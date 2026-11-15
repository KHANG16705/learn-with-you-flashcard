import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, Globe } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';

export default function LoginPage() {
  const navigate = useNavigate();

  // Lấy các hàm và trạng thái từ kho lưu trữ useAuthStore
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const errorMessage = useAuthStore((state) => state.errorMessage);

  // isRegisterMode = false là đang ở tab Đăng nhập, true là đang ở tab Đăng ký
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Các biến lưu dữ liệu người dùng nhập vào ô input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [preferredLang, setPreferredLang] = useState('EN');
  const [localError, setLocalError] = useState('');

  // Hàm xử lý khi người dùng bấm nút Đăng nhập hoặc Đăng ký
  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError('');

    if (!email.includes('@')) {
      setLocalError('Vui lòng nhập email hợp lệ (có ký tự @).');
      return;
    }

    if (password.length < 6) {
      setLocalError('Mật khẩu phải có từ 6 ký tự trở lên.');
      return;
    }

    if (isRegisterMode) {
      // Nếu đang ở chế độ Đăng ký thì gọi hàm register
      const result = await register(email, password, displayName, preferredLang);
      if (result.success) {
        navigate('/');
      }
    } else {
      // Nếu đang ở chế độ Đăng nhập thì gọi hàm login
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
        {/* Phần đầu: Logo và Tên dự án */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-md mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            LWY — Learn With You
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Nền tảng học từ vựng Tiếng Anh & Tiếng Trung cá nhân hóa qua Flashcard SRS
          </p>
        </div>

        {/* Hai nút chuyển qua lại giữa Đăng nhập và Đăng ký */}
        <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setLocalError('');
            }}
            className={`py-2 text-sm font-semibold rounded-lg transition ${
              !isRegisterMode
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setLocalError('');
            }}
            className={`py-2 text-sm font-semibold rounded-lg transition ${
              isRegisterMode
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Đăng ký mới
          </button>
        </div>

        {/* Hiển thị thông báo lỗi nếu có */}
        {(localError || errorMessage) && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-300">
            {localError || errorMessage}
          </div>
        )}

        {/* Biểu mẫu nhập thông tin */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chỉ hiện ô Tên hiển thị và Ngôn ngữ khi ở tab Đăng ký */}
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tên hiển thị của bạn
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Ví dụ: Minh Khang"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Ngôn ngữ bạn muốn ưu tiên học trước
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPreferredLang('EN')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition ${
                      preferredLang === 'EN'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    🇬🇧 Tiếng Anh
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredLang('ZH')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-medium transition ${
                      preferredLang === 'ZH'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    🇨🇳 Tiếng Trung
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Ô nhập Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Ô nhập Mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu (từ 6 ký tự)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Nút bấm gửi biểu mẫu */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm shadow-md transition"
          >
            {isLoading
              ? 'Đang xử lý...'
              : isRegisterMode
                ? 'Tạo tài khoản & Bắt đầu học'
                : 'Đăng nhập vào hệ thống'}
          </button>
        </form>
      </div>
    </div>
  );
}
