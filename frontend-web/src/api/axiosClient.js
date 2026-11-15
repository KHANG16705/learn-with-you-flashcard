import axios from 'axios';

// Tạo cầu nối gọi API sang Backend đang chạy ở cổng 5000
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Tự động gắn mã đăng nhập (flashcard_token) vào mọi yêu cầu gửi lên Backend
// Tại sao cần làm vậy: Để ở các trang sau chỉ cần gọi axiosClient.get(...) mà không phải tự gắn token thủ công
axiosClient.interceptors.request.use(
  (config) => {
    const savedToken = localStorage.getItem('flashcard_token');
    if (savedToken) {
      config.headers.Authorization = `Bearer ${savedToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 2. Tự động kiểm tra kết quả trả về từ Backend
// Nếu Backend báo lỗi 401 (chưa đăng nhập hoặc hết hạn), tự động xóa token cũ và đưa về trang /login
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('flashcard_token');
      localStorage.removeItem('flashcard_user');

      // Chỉ chuyển hướng nếu người dùng đang không đứng sẵn ở trang /login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
