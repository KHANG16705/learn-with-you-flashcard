import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';

/**
 * Trang chi tiết bộ thẻ (/decks/:slug)
 * Hiện tại đóng vai trò trang giữ chỗ tạm cho Lát cắt 2, sẽ được lắp danh sách Unit 20 từ ở Lát cắt 3
 */
export default function DeckDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Layers className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Đang xem bộ thẻ: <span className="text-blue-600 dark:text-blue-400">[{slug}]</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            Đang xem bộ thẻ: <strong>{slug}</strong> - Giao diện chia Unit 20 từ &amp; Thanh tiến độ 4 màu sẽ được lắp ở bước tiếp theo.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Quay lại Trang chủ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
