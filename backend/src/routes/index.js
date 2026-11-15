import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import {
  register,
  login,
  googleLogin,
  getMe,
  updatePreferences,
} from '../controllers/authController.js';

const router = express.Router();

// ==========================================
// 1. NHÓM ĐƯỜNG DẪN ĐĂNG KÝ & ĐĂNG NHẬP (Không cần đăng nhập trước)
// ==========================================

// Đăng ký tài khoản mới
router.post('/auth/register', register);

// Đăng nhập bằng Email và Mật khẩu
router.post('/auth/login', login);

// Đăng nhập nhanh bằng tài khoản Google
router.post('/auth/google', googleLogin);

// ==========================================
// 2. NHÓM ĐƯỜNG DẪN CÁ NHÂN (Phải đi qua người gác cổng authMiddleware)
// ==========================================

// Xem thông tin cá nhân của tài khoản đang đăng nhập
router.get('/auth/me', authMiddleware, getMe);

// Đổi ngôn ngữ học tập ('EN' <-> 'ZH')
router.patch('/auth/language', authMiddleware, updatePreferences);
router.patch('/users/me/preferences', authMiddleware, updatePreferences);

export default router;
