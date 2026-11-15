import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import {
  register,
  login,
  googleLogin,
  getMe,
  updatePreferences,
} from '../controllers/authController.js';
import {
  getCatalogDecks,
  getDeckOverview,
  getUnitCards,
} from '../controllers/deckController.js';
import { toggleMarkKnown } from '../controllers/studyController.js';

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

// ==========================================
// 3. NHÓM ĐƯỜNG DẪN BỘ THẺ TỪ VỰNG (CATALOG, DECK DETAIL & UNITS)
// ==========================================

// Lấy danh sách các bộ thẻ kèm tiến độ học và số liệu nhắc ôn tập hôm nay
router.get('/decks', authMiddleware, getCatalogDecks);

// Lấy tổng quan bộ thẻ, thanh tiến độ 4 màu và danh sách các Unit 20 từ
router.get('/decks/:slug/overview', authMiddleware, getDeckOverview);

// Lấy danh sách từ vựng trong 1 Unit (20 từ) hoặc toàn bộ từ của bộ thẻ (unitId = 'all')
router.get('/decks/:slug/units/:unitId/cards', authMiddleware, getUnitCards);

// ==========================================
// 4. NHÓM ĐƯỜNG DẪN HỌC TẬP & ĐÁNH DẤU TỪ VỰNG (STUDY & SRS)
// ==========================================

// Đánh dấu hoặc bỏ đánh dấu 1 từ vựng là "Đã biết" (status = 'IGNORED' / 'UNSEEN')
router.patch('/study/cards/:vocabId/mark-known', authMiddleware, toggleMarkKnown);

export default router;
