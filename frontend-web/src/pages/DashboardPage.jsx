import React from 'react';
import { useAuthStore } from '../store/useAuthStore.js';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const currentLang = useAuthStore((state) => state.currentLang);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Xin chào, {user?.display_name || user?.email}! 👋
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          Bạn đang ở không gian học:{' '}
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {currentLang === 'EN'
              ? '🇬🇧 Tiếng Anh (Oxford 3000 / TOEIC / IELTS)'
              : '🇨🇳 Tiếng Trung (HSK 1 - HSK 6)'}
          </span>
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          (Danh sách các bộ thẻ và bộ lọc #tags sẽ được hiển thị tại đây ở Lát cắt 2).
        </p>
      </div>
    </div>
  );
}
