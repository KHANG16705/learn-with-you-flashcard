import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

/**
 * Trang giữ chỗ tạm cho Phiên học Tập trung (/study/:slug/:mode)
 * Sẽ được lắp đủ 5 chế độ học tương tác ở Lát cắt 4
 */
export default function StudySessionPage() {
  const { slug, mode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const unitId = searchParams.get('unitId') || 'all';
  const studyMode = mode || searchParams.get('mode') || 'flashcard';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            Phiên học Tập trung: <span className="text-blue-600 dark:text-blue-400">[{studyMode}]</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Đang chuẩn bị chế độ học <strong>{studyMode}</strong> cho bộ thẻ{' '}
            <strong>{slug || 'Tổng hợp'}</strong> (Unit: <strong>{unitId}</strong>). Giao diện 5 chế độ học
            tương tác sẽ được hoàn thiện ở <strong>Lát cắt 4</strong>.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => navigate(slug ? `/decks/${slug}` : '/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Quay lại {slug ? 'Chi tiết Bộ thẻ' : 'Trang chủ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
