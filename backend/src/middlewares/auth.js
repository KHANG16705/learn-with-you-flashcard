import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Hàm kiểm tra đăng nhập (Người gác cổng cho các chức năng cần tài khoản)
 * Mục đích: Đảm bảo chỉ người dùng đã đăng nhập hợp lệ mới được xem hoặc lưu tiến độ học.
 */
export function authMiddleware(req, res, next) {
  try {
    // Bước 1: Lấy thông tin đăng nhập từ phần đầu (header) của yêu cầu gửi lên
    // Thông thường trình duyệt sẽ gửi theo mẫu: "Bearer <chuỗi_mã_token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để thực hiện chức năng này',
      });
    }

    // Cắt bỏ chữ "Bearer " ở đầu (dài 7 ký tự) để lấy riêng mã token phía sau
    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập để thực hiện chức năng này',
      });
    }

    // Bước 2: Kiểm tra xem mã token có đúng do hệ thống cấp và còn hạn sử dụng hay không
    const jwtSecret = process.env.JWT_SECRET || 'flashcard_srs_super_secret_jwt_key_2026';
    const decodedData = jwt.verify(token, jwtSecret);

    // Bước 3: Lưu thông tin người dùng vào req.user để các bước xử lý phía sau biết ai đang gọi
    req.user = {
      id: decodedData.id,
      email: decodedData.email,
      preferred_lang: decodedData.preferred_lang || 'EN',
    };

    // Cho phép yêu cầu đi tiếp vào chức năng bên trong
    return next();
  } catch (error) {
    // Nếu mã token bị sửa đổi hoặc đã hết hạn thì chặn lại và báo lỗi 401
    return res.status(401).json({
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
    });
  }
}

export default authMiddleware;
