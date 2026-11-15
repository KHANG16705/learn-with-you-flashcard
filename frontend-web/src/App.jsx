import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  BookMarked,
  BarChart3,
  Sun,
  Moon,
  LogOut,
  Globe,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from './store/useAuthStore.js';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DeckDetailPage from './pages/DeckDetailPage.jsx';
import StudySessionPage from './pages/StudySessionPage.jsx';
import NotebookPage from './pages/NotebookPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';

/**
 * Thành phần bảo vệ trang: Nếu chưa có token đăng nhập thì tự động đẩy về trang /login
 */
function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * Thanh Menu trên cùng (Header Navbar) chuẩn phong cách Parroto / Tactile Duo:
 * Dùng viền 2px rõ nét, nút bấm 3D xúc giác và bộ icon vector Lucide thay cho emoji.
 */
function TopNavbar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const currentLang = useAuthStore((state) => state.currentLang);
  const theme = useAuthStore((state) => state.theme);
  const switchLanguage = useAuthStore((state) => state.switchLanguage);
  const toggleTheme = useAuthStore((state) => state.toggleTheme);
  const logout = useAuthStore((state) => state.logout);

  const isVocabActive =
    location.pathname === '/' ||
    location.pathname.startsWith('/decks') ||
    location.pathname.startsWith('/study');

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b-2 border-[#e2e8f0] dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Cột trái: Logo thương hiệu & các mục điều hướng chính */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-duo bg-[#262c57] border-2 border-[#161c41] shadow-[0_2px_0_0_#161c41] text-white flex items-center justify-center transition-transform group-hover:scale-105">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg leading-none tracking-tight text-[#262c57] dark:text-white">
                LWY
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3c94d4]">
                Spaced Repetition
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={`btn-duo flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide border-2 ${
                isVocabActive
                  ? 'bg-[#262c57] text-white border-[#161c41] shadow-[0_2px_0_0_#161c41]'
                  : 'bg-white dark:bg-slate-800 text-[#4a5568] dark:text-slate-300 border-transparent hover:border-[#e2e8f0] dark:hover:border-slate-700 hover:bg-[#f0f4ff] dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Từ vựng</span>
            </Link>

            <Link
              to="/notebooks"
              className={`btn-duo flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide border-2 ${
                location.pathname.startsWith('/notebooks')
                  ? 'bg-[#262c57] text-white border-[#161c41] shadow-[0_2px_0_0_#161c41]'
                  : 'bg-white dark:bg-slate-800 text-[#4a5568] dark:text-slate-300 border-transparent hover:border-[#e2e8f0] dark:hover:border-slate-700 hover:bg-[#f0f4ff] dark:hover:bg-slate-800'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>Sổ tay từ vựng</span>
            </Link>

            <Link
              to="/analytics"
              className={`btn-duo flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide border-2 ${
                location.pathname.startsWith('/analytics')
                  ? 'bg-[#262c57] text-white border-[#161c41] shadow-[0_2px_0_0_#161c41]'
                  : 'bg-white dark:bg-slate-800 text-[#4a5568] dark:text-slate-300 border-transparent hover:border-[#e2e8f0] dark:hover:border-slate-700 hover:bg-[#f0f4ff] dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Thống kê</span>
            </Link>
          </nav>
        </div>

        {/* Cột phải: Chuyển đổi ngôn ngữ (EN / ZH), Chế độ Sáng/Tối và Tài khoản */}
        <div className="flex items-center gap-2.5">
          {/* Công tắc chuyển đổi tức thì giữa Tiếng Anh (EN) và Tiếng Trung (ZH) */}
          <div className="flex items-center bg-[#f0f4ff] dark:bg-slate-800 p-1 rounded-xl border-2 border-[#e2e8f0] dark:border-slate-700">
            <button
              type="button"
              onClick={() => switchLanguage('EN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                currentLang === 'EN'
                  ? 'bg-[#262c57] text-white shadow-sm'
                  : 'text-[#4a5568] dark:text-slate-300 hover:text-[#262c57]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>EN · Tiếng Anh</span>
            </button>
            <button
              type="button"
              onClick={() => switchLanguage('ZH')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                currentLang === 'ZH'
                  ? 'bg-[#262c57] text-white shadow-sm'
                  : 'text-[#4a5568] dark:text-slate-300 hover:text-[#262c57]'
              }`}
            >
              <span>ZH · Tiếng Trung</span>
            </button>
          </div>

          {/* Nút đổi giao diện Sáng / Tối */}
          <button
            type="button"
            onClick={toggleTheme}
            title="Đổi giao diện Sáng / Tối"
            className="btn-duo p-2 rounded-xl border-2 border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#262c57] dark:text-slate-200 shadow-duo-sm cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Thông tin tài khoản & Nút đăng xuất */}
          <div className="flex items-center gap-2 pl-2 border-l-2 border-[#e2e8f0] dark:border-slate-700">
            <span className="hidden lg:inline text-xs font-bold text-[#1a1a2e] dark:text-slate-200 max-w-[140px] truncate">
              {user?.display_name || user?.email}
            </span>
            <button
              type="button"
              onClick={logout}
              title="Đăng xuất"
              className="btn-duo flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 shadow-[0_2px_0_0_rgb(254,205,211)] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const token = useAuthStore((state) => state.token);
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token, fetchMe]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-[#1a1a2e] dark:text-slate-100">
        {token && <TopNavbar />}

        <Routes>
          <Route
            path="/login"
            element={token ? <Navigate to="/" replace /> : <LoginPage />}
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decks/:slug"
            element={
              <ProtectedRoute>
                <DeckDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study"
            element={
              <ProtectedRoute>
                <StudySessionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study/:slug/:mode"
            element={
              <ProtectedRoute>
                <StudySessionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notebooks"
            element={
              <ProtectedRoute>
                <NotebookPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
