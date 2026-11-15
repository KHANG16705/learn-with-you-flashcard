import { create } from 'zustand';
import axiosClient from '../api/axiosClient.js';

// Đọc lại thông tin người dùng đã lưu trong trình duyệt (localStorage) để khi bấm F5 không bị văng đăng nhập
function getInitialUser() {
  try {
    const rawUser = localStorage.getItem('flashcard_user');
    if (!rawUser) return null;
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

// Áp dụng giao diện Sáng / Tối lên thẻ <html>
function applyThemeToHtml(themeMode) {
  if (typeof document === 'undefined') return;
  if (themeMode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

const initialUser = getInitialUser();
const initialToken = localStorage.getItem('flashcard_token') || null;
const initialLang =
  localStorage.getItem('flashcard_lang') ||
  (initialUser && initialUser.preferred_lang) ||
  'EN';
const initialTheme = localStorage.getItem('flashcard_theme') || 'light';

// Kích hoạt giao diện Sáng/Tối ngay khi vừa mở trang
applyThemeToHtml(initialTheme);

/**
 * Kho lưu trữ thông tin đăng nhập, ngôn ngữ học ('EN' / 'ZH') và chế độ giao diện ('light' / 'dark')
 */
export const useAuthStore = create((set, get) => ({
  // 4 biến chính dùng chung cho toàn bộ trang web
  user: initialUser,
  token: initialToken,
  currentLang: initialLang,
  theme: initialTheme,

  // Biến phụ theo dõi trạng thái đang tải và thông báo lỗi
  isLoading: false,
  errorMessage: '',

  // 1. Hàm Đăng nhập bằng Email và Mật khẩu
  login: async (email, password) => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await axiosClient.post('/auth/login', {
        email: email,
        password: password,
      });

      const loggedInUser = response.data.user;
      const newToken = response.data.token;
      const userLang = loggedInUser.preferred_lang || 'EN';

      // Lưu vào localStorage để giữ đăng nhập khi tải lại trang
      localStorage.setItem('flashcard_token', newToken);
      localStorage.setItem('flashcard_user', JSON.stringify(loggedInUser));
      localStorage.setItem('flashcard_lang', userLang);

      set({
        user: loggedInUser,
        token: newToken,
        currentLang: userLang,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      set({ isLoading: false, errorMessage: message });
      return { success: false, message: message };
    }
  },

  // 2. Hàm Đăng ký tài khoản mới
  register: async (email, password, displayName, preferredLang = 'EN') => {
    set({ isLoading: true, errorMessage: '' });
    try {
      const response = await axiosClient.post('/auth/register', {
        email: email,
        password: password,
        displayName: displayName,
        preferredLang: preferredLang,
      });

      const createdUser = response.data.user;
      const newToken = response.data.token;
      const userLang = createdUser.preferred_lang || 'EN';

      // Lưu vào localStorage để đăng nhập luôn sau khi tạo tài khoản
      localStorage.setItem('flashcard_token', newToken);
      localStorage.setItem('flashcard_user', JSON.stringify(createdUser));
      localStorage.setItem('flashcard_lang', userLang);

      set({
        user: createdUser,
        token: newToken,
        currentLang: userLang,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      set({ isLoading: false, errorMessage: message });
      return { success: false, message: message };
    }
  },

  // 3. Hàm lấy lại thông tin cá nhân mới nhất từ Backend khi mở lại web
  fetchMe: async () => {
    const currentToken = get().token;
    if (!currentToken) return;

    try {
      const response = await axiosClient.get('/auth/me');
      const latestUser = response.data.user;
      const userLang = latestUser.preferred_lang || 'EN';

      localStorage.setItem('flashcard_user', JSON.stringify(latestUser));
      localStorage.setItem('flashcard_lang', userLang);

      set({
        user: latestUser,
        currentLang: userLang,
      });
    } catch {
      // Nếu token hết hạn thì axiosClient sẽ tự xử lý xóa token
    }
  },

  // 4. Hàm Đổi ngôn ngữ học tập giữa Tiếng Anh ('EN') và Tiếng Trung ('ZH')
  switchLanguage: async (newLang) => {
    if (newLang !== 'EN' && newLang !== 'ZH') return;

    // Đổi ngay trên giao diện để người dùng không phải chờ
    localStorage.setItem('flashcard_lang', newLang);
    set({ currentLang: newLang });

    // Nếu đã đăng nhập thì gửi lên Backend để lưu vào bảng users trong MySQL
    const currentToken = get().token;
    if (currentToken) {
      try {
        const response = await axiosClient.patch('/auth/language', {
          preferred_lang: newLang,
        });

        const updatedUser = response.data.user;
        const updatedToken = response.data.token;

        localStorage.setItem('flashcard_token', updatedToken);
        localStorage.setItem('flashcard_user', JSON.stringify(updatedUser));

        set({
          user: updatedUser,
          token: updatedToken,
          currentLang: updatedUser.preferred_lang,
        });
      } catch (error) {
        console.error('Không thể đồng bộ ngôn ngữ lên máy chủ:', error);
      }
    }
  },

  // 5. Hàm Bật / Tắt chế độ giao diện Sáng ('light') hoặc Tối ('dark')
  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('flashcard_theme', nextTheme);
    applyThemeToHtml(nextTheme);
    set({ theme: nextTheme });
  },

  // 6. Hàm Đăng xuất khỏi tài khoản
  logout: () => {
    localStorage.removeItem('flashcard_token');
    localStorage.removeItem('flashcard_user');
    set({
      user: null,
      token: null,
      errorMessage: '',
    });
  },
}));

export default useAuthStore;
