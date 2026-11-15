import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { pool } from '../config/db.js';

dotenv.config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Hàm phụ: Tạo mã đăng nhập (JWT Token) từ thông tin người dùng
 * Tại sao cần hàm này: Để không phải viết lặp lại lệnh jwt.sign ở nhiều nơi (Đăng ký, Đăng nhập, Đổi ngôn ngữ)
 */
function createLoginToken(user) {
  const jwtSecret = process.env.JWT_SECRET || 'flashcard_srs_super_secret_jwt_key_2026';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const tokenPayload = {
    id: user.id,
    email: user.email,
    preferred_lang: user.preferred_lang || 'EN',
  };

  const newToken = jwt.sign(tokenPayload, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

  return newToken;
}

/**
 * Hàm phụ: Lọc lấy các thông tin an toàn của người dùng để gửi về cho giao diện
 * Tại sao cần hàm này: Tuyệt đối không bao giờ gửi cột mật khẩu (password_hash) về trình duyệt
 */
function formatSafeUserInfo(userRow) {
  return {
    id: userRow.id,
    email: userRow.email,
    display_name: userRow.display_name,
    avatar_url: userRow.avatar_url || null,
    preferred_lang: userRow.preferred_lang || 'EN',
    daily_new_cards_limit: userRow.daily_new_cards_limit || 15,
    timezone: userRow.timezone || 'Asia/Ho_Chi_Minh',
    created_at: userRow.created_at,
  };
}

/**
 * 1. Xử lý Đăng ký tài khoản mới (POST /api/v1/auth/register)
 */
export async function register(req, res) {
  try {
    // Bước 1: Lấy dữ liệu người dùng nhập từ form đăng ký gửi lên
    const emailInput = req.body.email;
    const passwordInput = req.body.password;
    const displayNameInput = req.body.displayName || req.body.display_name;
    const preferredLangInput = req.body.preferredLang || req.body.preferred_lang;

    // Bước 2: Kiểm tra xem email và mật khẩu có hợp lệ không
    if (!emailInput || typeof emailInput !== 'string' || !emailInput.includes('@')) {
      return res.status(400).json({
        message: 'Vui lòng nhập địa chỉ email hợp lệ (phải có ký tự @)',
      });
    }

    if (!passwordInput || typeof passwordInput !== 'string' || passwordInput.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có từ 6 ký tự trở lên',
      });
    }

    // Chuẩn hóa email về chữ thường và cắt khoảng trắng thừa ở 2 đầu
    const cleanEmail = emailInput.trim().toLowerCase();

    // Nếu người dùng không nhập tên hiển thị thì lấy phần tên đứng trước dấu @ của email
    let cleanDisplayName = '';
    if (displayNameInput && String(displayNameInput).trim() !== '') {
      cleanDisplayName = String(displayNameInput).trim();
    } else {
      cleanDisplayName = cleanEmail.split('@')[0];
    }

    // Nếu người dùng chọn Tiếng Trung ('ZH') thì lưu 'ZH', còn lại mặc định là Tiếng Anh ('EN')
    let selectedLanguage = 'EN';
    if (preferredLangInput === 'ZH') {
      selectedLanguage = 'ZH';
    }

    // Bước 3: Kiểm tra trong MySQL xem email này đã có người đăng ký trước đó chưa
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: 'Email này đã được sử dụng',
      });
    }

    // Bước 4: Mã hóa mật khẩu bằng bcryptjs trước khi lưu vào Database
    // Tại sao phải làm vậy: Để nếu lộ Database thì kẻ xấu cũng không đọc được mật khẩu thật của người dùng
    const passwordHash = await bcrypt.hash(passwordInput, 10);

    // Bước 5: Lưu tài khoản mới vào bảng users trong MySQL
    const [insertResult] = await pool.execute(
      `INSERT INTO users (email, password_hash, display_name, preferred_lang)
       VALUES (?, ?, ?, ?)`,
      [cleanEmail, passwordHash, cleanDisplayName, selectedLanguage]
    );

    const newUserId = insertResult.insertId;

    // Lấy lại dòng dữ liệu vừa tạo để trả về cho giao diện
    const [newUserRows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [newUserId]
    );
    const createdUser = newUserRows[0];

    // Bước 6: Tạo mã đăng nhập (token) để người dùng vào thẳng trang học sau khi đăng ký xong
    const newToken = createLoginToken(createdUser);

    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      token: newToken,
      user: formatSafeUserInfo(createdUser),
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký tài khoản:', error);
    return res.status(500).json({
      message: 'Đã có lỗi xảy ra trên hệ thống khi đăng ký tài khoản',
    });
  }
}

/**
 * 2. Xử lý Đăng nhập bằng Email & Mật khẩu (POST /api/v1/auth/login)
 */
export async function login(req, res) {
  try {
    // Bước 1: Lấy email và mật khẩu người dùng gửi lên
    const emailInput = req.body.email;
    const passwordInput = req.body.password;

    if (!emailInput || !passwordInput) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ email và mật khẩu',
      });
    }

    const cleanEmail = String(emailInput).trim().toLowerCase();

    // Bước 2: Tìm tài khoản trong bảng users theo email
    const [userRows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (userRows.length === 0) {
      return res.status(401).json({
        message: 'Sai email hoặc mật khẩu',
      });
    }

    const existingUser = userRows[0];

    // Nếu tài khoản này trước đây đăng nhập bằng Google (không có mật khẩu) thì báo lỗi
    if (!existingUser.password_hash) {
      return res.status(401).json({
        message: 'Sai email hoặc mật khẩu',
      });
    }

    // Bước 3: So sánh mật khẩu người dùng nhập vào với mật khẩu đã mã hóa trong Database
    const isPasswordCorrect = await bcrypt.compare(passwordInput, existingUser.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Sai email hoặc mật khẩu',
      });
    }

    // Bước 4: Nếu mật khẩu khớp, tạo mã đăng nhập (token) và trả về thông tin người dùng
    const newToken = createLoginToken(existingUser);

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      token: newToken,
      user: formatSafeUserInfo(existingUser),
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    return res.status(500).json({
      message: 'Đã có lỗi xảy ra trên hệ thống khi đăng nhập',
    });
  }
}

/**
 * 3. Xử lý Đăng nhập nhanh bằng tài khoản Google (POST /api/v1/auth/google)
 */
export async function googleLogin(req, res) {
  try {
    // Bước 1: Nhận mã idToken do Google cấp ở phía trình duyệt gửi lên
    const idToken = req.body.idToken || req.body.credential;

    if (!idToken) {
      return res.status(400).json({
        message: 'Thiếu mã xác thực Google (idToken)',
      });
    }

    // Bước 2: Nhờ thư viện của Google kiểm tra xem idToken có thật sự hợp lệ không
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const googlePayload = ticket.getPayload();
    const googleId = googlePayload.sub;
    const email = String(googlePayload.email || '').trim().toLowerCase();
    const displayName = googlePayload.name || email.split('@')[0];
    const avatarUrl = googlePayload.picture || null;

    // Bước 3: Kiểm tra xem người dùng này đã từng có tài khoản trong bảng users chưa
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1',
      [googleId, email]
    );

    let currentUser = null;

    if (existingUsers.length === 0) {
      // Nếu chưa có trong bảng users thì tự động tạo tài khoản mới
      const [insertResult] = await pool.execute(
        `INSERT INTO users (email, google_id, display_name, avatar_url, preferred_lang)
         VALUES (?, ?, ?, ?, 'EN')`,
        [email, googleId, displayName, avatarUrl]
      );
      const [newUserRows] = await pool.execute(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        [insertResult.insertId]
      );
      currentUser = newUserRows[0];
    } else {
      // Nếu đã có tài khoản rồi thì lấy ra dùng (và bổ sung google_id nếu trước đó đăng ký bằng email)
      currentUser = existingUsers[0];
      if (!currentUser.google_id) {
        await pool.execute(
          'UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?',
          [googleId, avatarUrl, currentUser.id]
        );
        currentUser.google_id = googleId;
        if (!currentUser.avatar_url) {
          currentUser.avatar_url = avatarUrl;
        }
      }
    }

    // Bước 4: Tạo mã token của hệ thống và trả về cho trình duyệt
    const newToken = createLoginToken(currentUser);

    return res.status(200).json({
      message: 'Đăng nhập bằng Google thành công',
      token: newToken,
      user: formatSafeUserInfo(currentUser),
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập Google:', error);
    return res.status(401).json({
      message: 'Xác thực tài khoản Google thất bại hoặc mã đã hết hạn',
    });
  }
}

/**
 * 4. Lấy thông tin cá nhân của người đang đăng nhập (GET /api/v1/auth/me)
 */
export async function getMe(req, res) {
  try {
    // Bước 1: Lấy id của người dùng từ req.user (do authMiddleware đã kiểm tra và truyền sang)
    const currentUserId = req.user.id;

    // Bước 2: Truy vấn vào bảng users để lấy thông tin mới nhất
    const [userRows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [currentUserId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin người dùng',
      });
    }

    const currentUser = userRows[0];

    // Bước 3: Trả thông tin người dùng về cho giao diện
    return res.status(200).json({
      user: formatSafeUserInfo(currentUser),
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin cá nhân:', error);
    return res.status(500).json({
      message: 'Đã có lỗi xảy ra khi lấy thông tin cá nhân',
    });
  }
}

/**
 * 5. Đổi ngôn ngữ học tập giữa Tiếng Anh ('EN') và Tiếng Trung ('ZH')
 * Dùng cho cả đường dẫn PATCH /api/v1/auth/language và PATCH /api/v1/users/me/preferences
 */
export async function updatePreferences(req, res) {
  try {
    // Bước 1: Lấy id người dùng hiện tại và ngôn ngữ mới người dùng muốn đổi sang
    const currentUserId = req.user.id;
    const requestedLang = req.body.preferred_lang || req.body.preferredLang;

    // Kiểm tra chỉ chấp nhận 'EN' (Tiếng Anh) hoặc 'ZH' (Tiếng Trung)
    if (requestedLang !== 'EN' && requestedLang !== 'ZH') {
      return res.status(400).json({
        message: 'Ngôn ngữ không hợp lệ. Chỉ chấp nhận EN (Tiếng Anh) hoặc ZH (Tiếng Trung)',
      });
    }

    // Bước 2: Cập nhật lựa chọn ngôn ngữ mới vào bảng users trong MySQL
    await pool.execute(
      'UPDATE users SET preferred_lang = ? WHERE id = ?',
      [requestedLang, currentUserId]
    );

    // Bước 3: Lấy lại thông tin người dùng sau khi đã cập nhật trong MySQL
    const [userRows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [currentUserId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy tài khoản người dùng',
      });
    }

    const updatedUser = userRows[0];

    // Bước 4: Tạo lại mã token mới có chứa ngôn ngữ vừa đổi và trả về cho giao diện
    const newToken = createLoginToken(updatedUser);

    return res.status(200).json({
      message: 'Đã đổi ngôn ngữ học tập thành công',
      token: newToken,
      user: formatSafeUserInfo(updatedUser),
    });
  } catch (error) {
    console.error('Lỗi khi đổi ngôn ngữ học:', error);
    return res.status(500).json({
      message: 'Đã có lỗi xảy ra khi cập nhật ngôn ngữ học',
    });
  }
}
