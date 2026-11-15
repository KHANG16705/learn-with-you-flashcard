import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { BookOpen, Layers, BookMarked, BarChart3, Sun, Moon, LogOut } from 'lucide-react';
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
 * Thanh Menu trên cùng (Header Navbar):
 * Chứa Logo, Menu chuyển trang, Nút gạt đổi ngôn ngữ (Anh <-> Trung), Đổi màu Sáng/Tối và Đăng xuất
 */
function TopNavbar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const currentLang = useAuthStore((state) => state.currentLang);
  const theme = useAuthStore((state) => state.theme);
  const switchLanguage = useAuthStore((state) => state.switchLanguage);
  const toggleTheme = useAuthStore((state) => state.toggleTheme);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Cột trái: Logo và các mục Menu chính */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-blue-600 dark:text-blue-400">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>LWY</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                location.pathname === '/'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              Bộ thẻ từ vựng
            </Link>
            <Link
              to="/notebooks"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                location.pathname.startsWith('/notebooks')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              Sổ tay cá nhân
            </Link>
            <Link
              to="/analytics"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                location.pathname.startsWith('/analytics')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Thống kê
            </Link>
          </nav>
        </div>

        {/* Cột phải: Công tắc đổi ngôn ngữ (EN <-> ZH), Đổi Sáng/Tối và Tài khoản */}
        <div className="flex items-center gap-3">
          {/* Công tắc chuyển đổi tức thì giữa Tiếng Anh (EN) và Tiếng Trung (ZH) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => switchLanguage('EN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                currentLang === 'EN'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              🇬🇧 Tiếng Anh
            </button>
            <button
              type="button"
              onClick={() => switchLanguage('ZH')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                currentLang === 'ZH'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              🇨🇳 Tiếng Trung
            </button>
          </div>

          {/* Nút đổi chế độ Sáng / Tối */}
          <button
            type="button"
            onClick={toggleTheme}
            title="Đổi giao diện Sáng / Tối"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Tên người dùng & Nút đăng xuất */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200">
              {user?.display_name || user?.email}
            </span>
            <button
              type="button"
              onClick={logout}
              title="Đăng xuất"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <LogOut className="w-4 h-4" />
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

  // Khi mở trang web lên, nếu đã có token thì tự động lấy lại thông tin mới nhất của user
  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token, fetchMe]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {/* Chỉ hiển thị thanh Menu trên cùng khi người dùng đã đăng nhập */}
        {token && <TopNavbar />}

        <Routes>
          {/* Trang đăng nhập / đăng ký */}
          <Route
            path="/login"
            element={token ? <Navigate to="/" replace /> : <LoginPage />}
          />

          {/* Các trang yêu cầu phải đăng nhập mới được vào */}
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

          {/* Đường dẫn lạ tự động đưa về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
