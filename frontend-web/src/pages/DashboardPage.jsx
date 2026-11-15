import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Flame,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Layers,
  ArrowRight,
  RotateCcw,
  Tag,
  Clock,
  Sparkles,
  HelpCircle,
  Zap,
  BookMarked,
  X,
  Brain,
  CalendarCheck,
  TrendingUp,
  Award,
  Globe,
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from '../store/useAuthStore.js';

// Danh sách các nút lọc #tag dành cho Tiếng Anh (EN) chuẩn Parroto
const ENGLISH_TAGS = [
  'all',
  '#oxford',
  '#common',
  '#a1',
  '#a2',
  '#b1',
  '#b2',
  '#communication',
  '#toeic',
  '#ielts',
];

// Danh sách các nút lọc #tag dành cho Tiếng Trung (ZH)
const CHINESE_TAGS = [
  'all',
  '#hsk1',
  '#hsk2',
  '#hsk3',
  '#hsk4',
  '#giaotiep',
  '#boya',
];

/**
 * Hàm phụ: Cấu hình bảng màu & số bài học minh họa cho từng Cấp độ bộ thẻ (A1, A2, B1, B2)
 */
function getDeckVisualTheme(levelTag) {
  if (levelTag === 'A1') {
    return {
      bannerBg: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      levelSub: 'Beginner · Sơ cấp 1',
      unitEstimate: 54,
      accentText: 'text-emerald-700 dark:text-emerald-400',
    };
  }
  if (levelTag === 'A2') {
    return {
      bannerBg: 'bg-gradient-to-br from-[#3c94d4] via-blue-600 to-indigo-600',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
      levelSub: 'Elementary · Sơ cấp 2',
      unitEstimate: 48,
      accentText: 'text-sky-700 dark:text-sky-400',
    };
  }
  if (levelTag === 'B1') {
    return {
      bannerBg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      levelSub: 'Intermediate · Trung cấp 1',
      unitEstimate: 46,
      accentText: 'text-amber-700 dark:text-amber-400',
    };
  }
  if (levelTag === 'B2') {
    return {
      bannerBg: 'bg-gradient-to-br from-[#262c57] via-indigo-800 to-purple-800',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
      levelSub: 'Upper-Inter · Trung cao cấp',
      unitEstimate: 39,
      accentText: 'text-purple-700 dark:text-purple-400',
    };
  }
  return {
    bannerBg: 'bg-gradient-to-br from-[#262c57] to-[#3c94d4]',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    levelSub: 'Core Vocabulary',
    unitEstimate: 30,
    accentText: 'text-blue-700 dark:text-blue-400',
  };
}

/**
 * Hộp thoại giải thích "Spaced Repetition là gì?" theo đúng mẫu Parroto (4 Bước SRS)
 */
function SpacedRepetitionModal({ isOpen, onClose }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-duo-lg border-2 border-[#e2e8f0] dark:border-slate-700 shadow-duo max-w-2xl w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-[#e2e8f0] dark:border-slate-800 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-[#f0f4ff] text-[#3c94d4] border border-[#c7d2e0]">
              <Brain className="w-3.5 h-3.5" />
              Phương pháp khoa học
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1a1a2e] dark:text-white mt-2">
              Spaced Repetition (Lặp lại ngắt quãng) là gì?
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-duo p-2 rounded-xl border-2 border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#4a5568] shadow-duo-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-[#4a5568] dark:text-slate-300 leading-relaxed">
          Thay vì học vẹt hàng trăm từ trong một ngày rồi quên sạch sau 1 tuần, thuật toán{' '}
          <strong className="text-[#1a1a2e] dark:text-white">SM-2 Spaced Repetition</strong> tính toán chính xác{' '}
          <strong className="text-[#3c94d4]">“điểm rơi quên lãng”</strong> của từng từ để nhắc bạn ôn lại đúng lúc bộ não sắp quên:
        </p>

        {/* 4 Bước hoạt động chuẩn Parroto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-duo border-2 border-red-200 bg-red-50/70 dark:bg-red-950/20 dark:border-red-900/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-red-900 dark:text-red-300">
                Học từ mới theo Chủ đề
              </h3>
              <p className="text-xs text-red-700 dark:text-red-200/80 mt-1 leading-relaxed">
                Làm quen 15–20 từ mỗi bài qua hình ảnh, phát âm chuẩn US/UK và câu ví dụ ngữ cảnh.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-duo border-2 border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-300">
                Ôn tập ngay trước khi quên
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-200/80 mt-1 leading-relaxed">
                Hệ thống tự động đưa các từ sắp quên vào danh sách &ldquo;Cần ôn hôm nay&rdquo;.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-duo border-2 border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/20 dark:border-emerald-900/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-300">
                Giãn dần khoảng cách ôn
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-200/80 mt-1 leading-relaxed">
                Từ nhớ tốt sẽ giãn chu kỳ ôn từ 1 ngày → 3 ngày → 7 ngày → 21 ngày.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-duo border-2 border-sky-200 bg-sky-50/70 dark:bg-sky-950/20 dark:border-sky-900/50 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#3c94d4] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-sky-900 dark:text-sky-300">
                Chuyển vào Trí nhớ dài hạn
              </h3>
              <p className="text-xs text-sky-700 dark:text-sky-200/80 mt-1 leading-relaxed">
                Từ đạt chu kỳ trên 21 ngày được đánh dấu Đã thuộc lòng và không làm phiền bạn nữa.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-duo px-6 py-2.5 rounded-duo bg-[#262c57] text-white font-extrabold text-xs uppercase tracking-wide border-2 border-[#161c41] shadow-duo-primary cursor-pointer"
          >
            Đã hiểu nguyên lý
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const currentLang = useAuthStore((state) => state.currentLang);
  const switchLanguage = useAuthStore((state) => state.switchLanguage);

  const [decks, setDecks] = useState([]);
  const [dailySummary, setDailySummary] = useState({
    totalDueToday: 0,
    totalWeakWords: 0,
    totalMastered: 0,
  });
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSrsModalOpen, setIsSrsModalOpen] = useState(false);

  // =========================================================================
  // 1. GỌI API LẤY DANH SÁCH BỘ THẺ & THỐNG KÊ SRS HÀNG NGÀY
  // =========================================================================
  useEffect(() => {
    setSelectedTag('all');
    setSearchTerm('');

    async function fetchCatalogData() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await axiosClient.get(`/decks?lang=${currentLang}`);
        const resultData = response.data?.data;

        if (resultData) {
          setDecks(resultData.decks || []);
          setDailySummary(
            resultData.dailySummary || {
              totalDueToday: 0,
              totalWeakWords: 0,
              totalMastered: 0,
            }
          );
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách bộ thẻ:', error);
        setErrorMessage('Không thể tải danh sách bộ thẻ từ máy chủ. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCatalogData();
  }, [currentLang]);

  // =========================================================================
  // 2. XỬ LÝ LỌC BỘ THẺ THEO NHÃN #TAG VÀ Ô TÌM KIẾM
  // =========================================================================
  const filteredDecks = [];
  const keyword = searchTerm.trim().toLowerCase();

  for (let i = 0; i < decks.length; i++) {
    const deck = decks[i];

    let matchesTag = true;
    if (selectedTag !== 'all') {
      matchesTag = false;
      if (Array.isArray(deck.tags)) {
        for (let j = 0; j < deck.tags.length; j++) {
          if (String(deck.tags[j]).toLowerCase() === selectedTag.toLowerCase()) {
            matchesTag = true;
            break;
          }
        }
      }
    }

    let matchesSearch = true;
    if (keyword !== '') {
      const titleVi = (deck.title_vi || '').toLowerCase();
      const titleTarget = (deck.title_target || '').toLowerCase();
      const levelTag = (deck.level_tag || '').toLowerCase();

      if (
        !titleVi.includes(keyword) &&
        !titleTarget.includes(keyword) &&
        !levelTag.includes(keyword)
      ) {
        matchesSearch = false;
      }
    }

    if (matchesTag && matchesSearch) {
      filteredDecks.push(deck);
    }
  }

  let tagList = ENGLISH_TAGS;
  if (currentLang === 'ZH') {
    tagList = CHINESE_TAGS;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hộp thoại giải thích Spaced Repetition */}
      <SpacedRepetitionModal
        isOpen={isSrsModalOpen}
        onClose={() => setIsSrsModalOpen(false)}
      />

      {/* =================================================================== */}
      {/* KHU VỰC 1: HEADER & 3 NÚT HÀNH ĐỘNG XÚC GIÁC CHUẨN PARROTO          */}
      {/* =================================================================== */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a2e] dark:text-white tracking-tight">
            {currentLang === 'EN' ? 'Học Từ Vựng Tiếng Anh' : 'Học Từ Vựng Tiếng Trung'}
          </h1>
          <p className="text-sm text-[#4a5568] dark:text-slate-400 mt-1">
            Thành thạo từ vựng theo chủ đề với hệ thống lặp lại ngắt quãng (Spaced Repetition - SRS)
          </p>
        </div>

        {/* 3 Nút hành động chuẩn thiết kế Parroto */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/decks/all-oxford-3000')}
            className="btn-duo inline-flex items-center gap-2 px-4 py-2.5 rounded-duo bg-[#262c57] text-white font-extrabold text-xs uppercase tracking-wide border-2 border-[#161c41] shadow-duo-primary cursor-pointer"
          >
            <BookMarked className="w-4 h-4" />
            <span>Sổ tay 3.004 từ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (dailySummary.totalDueToday > 0) {
                navigate('/study?mode=due');
              } else if (decks.length > 0) {
                navigate(`/decks/${decks[0].slug}`);
              }
            }}
            className="btn-duo inline-flex items-center gap-2 px-4 py-2.5 rounded-duo bg-[#22c55e] text-white font-extrabold text-xs uppercase tracking-wide border-2 border-[#15803d] shadow-duo-success cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Luyện tập nhanh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSrsModalOpen(true)}
            className="btn-duo inline-flex items-center gap-2 px-4 py-2.5 rounded-duo bg-white dark:bg-slate-800 text-[#262c57] dark:text-slate-100 font-extrabold text-xs border-2 border-[#e2e8f0] dark:border-slate-700 shadow-duo cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#3c94d4]" />
            <span>Spaced Repetition là gì?</span>
          </button>
        </div>
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 2: LƯỚI BENTO 3 CỘT (1 CỘT TIẾN ĐỘ SRS + 2 CỘT KHÁM PHÁ)   */}
      {/* =================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1: Thẻ Tiến độ Ôn tập Hàng ngày (Daily SRS Status Card) */}
        <div className="lg:col-span-1 rounded-duo-lg border-2 border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-duo flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#f0f4ff] dark:bg-slate-800 text-[#262c57] dark:text-blue-300 border border-[#c7d2e0] dark:border-slate-700">
                <CalendarCheck className="w-3.5 h-3.5 text-[#3c94d4]" />
                <span>Tiến độ hôm nay</span>
              </span>
              <span className="text-xs font-bold text-[#4a5568] dark:text-slate-400">
                Xin chào, {user?.display_name || 'bạn'}
              </span>
            </div>

            {/* 3 Ô chỉ số SRS */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-duo border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 text-center">
                <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
                  <Flame className="w-4 h-4" />
                </div>
                <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
                  {dailySummary.totalDueToday}
                </p>
                <p className="text-[11px] font-bold text-amber-800/80 dark:text-amber-300/80">
                  Cần ôn
                </p>
              </div>

              <div className="p-3 rounded-duo border-2 border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 text-center">
                <div className="flex items-center justify-center text-rose-600 dark:text-rose-400 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <p className="text-xl font-extrabold text-rose-700 dark:text-rose-300">
                  {dailySummary.totalWeakWords}
                </p>
                <p className="text-[11px] font-bold text-rose-800/80 dark:text-rose-300/80">
                  Hay quên
                </p>
              </div>

              <div className="p-3 rounded-duo border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/20 text-center">
                <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {dailySummary.totalMastered}
                </p>
                <p className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">
                  Đã thuộc
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4a5568] dark:text-slate-400 leading-relaxed">
              {dailySummary.totalDueToday > 0
                ? `Bạn có ${dailySummary.totalDueToday} từ vựng đã đến hạn cần ôn tập ngay hôm nay để không bị quên.`
                : 'Hôm nay bạn đã hoàn thành hết các thẻ cần ôn! Hãy chọn một bài học theo chủ đề bên dưới để nạp từ mới.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (dailySummary.totalDueToday > 0) {
                navigate('/study?mode=due');
              } else {
                const el = document.getElementById('catalog-decks-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={`btn-duo w-full py-3 px-4 rounded-duo font-extrabold text-xs uppercase tracking-wide border-2 flex items-center justify-center gap-2 cursor-pointer ${
              dailySummary.totalDueToday > 0
                ? 'bg-amber-500 text-white border-amber-700 shadow-duo-amber'
                : 'bg-[#262c57] text-white border-[#161c41] shadow-duo-primary'
            }`}
          >
            <span>
              {dailySummary.totalDueToday > 0
                ? `Ôn tập ngay (${dailySummary.totalDueToday} từ)`
                : 'Chọn cấp độ học bên dưới'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cột 2 & 3: 2 Thẻ Ngang Nổi Bật (Oxford 3000 Full Explorer & Lộ trình Chủ đề) */}
        <div className="lg:col-span-2 flex flex-col justify-between gap-4">
          {/* Thẻ ngang 1: Trọn bộ Oxford 3000 */}
          <div
            onClick={() => navigate('/decks/all-oxford-3000')}
            className="btn-duo rounded-duo-lg border-2 border-[#262c57] bg-white dark:bg-slate-900 p-5 shadow-duo-primary flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-duo bg-[#262c57] text-white flex items-center justify-center shrink-0 border-2 border-[#161c41]">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#f0f4ff] text-[#262c57] border border-[#c7d2e0]">
                    OXFORD 3000™ COMPLETE
                  </span>
                  <span className="text-xs font-extrabold text-[#3c94d4]">
                    3.004 Từ Vựng · A1 đến B2
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#1a1a2e] dark:text-white group-hover:text-[#3c94d4] transition-colors">
                  TRỌN BỘ TỪ ĐIỂN OXFORD 3000 (A1 – B2)
                </h2>
                <p className="text-xs text-[#4a5568] dark:text-slate-400 leading-relaxed">
                  Tra cứu toàn bộ 3.004 từ cốt lõi, nghe phát âm chuẩn US/UK, xem câu ví dụ được tô sáng từ khóa và đánh dấu &ldquo;Đã biết&rdquo;.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-duo bg-[#262c57] text-white font-extrabold text-xs uppercase tracking-wide border-2 border-[#161c41] shrink-0">
              <span>Khám phá</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>

          {/* Thẻ ngang 2: Lộ trình 187 Chủ đề Ngữ nghĩa ngắn gọn */}
          <div
            onClick={() => {
              if (decks.length > 0) {
                navigate(`/decks/${decks[0].slug}`);
              } else {
                navigate('/decks/oxford-3000-a1');
              }
            }}
            className="btn-duo rounded-duo-lg border-2 border-[#3c94d4] bg-white dark:bg-slate-900 p-5 shadow-duo-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-duo bg-[#3c94d4] text-white flex items-center justify-center shrink-0 border-2 border-[#1e64a5]">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-50 text-[#3c94d4] border border-sky-200">
                    187 BÀI HỌC CHỦ ĐỀ
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600">
                    15–20 Từ / Bài · Sắp xếp Dễ → Khó
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#1a1a2e] dark:text-white group-hover:text-[#3c94d4] transition-colors">
                  HỌC TỪ VỰNG THEO CHỦ ĐỀ NGỮ NGHĨA THỰC TẾ
                </h2>
                <p className="text-xs text-[#4a5568] dark:text-slate-400 leading-relaxed">
                  Phân chia khoa học thành các chủ đề ngắn gọn: Gia đình & Người thân, Đồ ăn & Thực phẩm, Du lịch & Kỳ nghỉ, Công sở, Y tế...
                </p>
              </div>
            </div>

            <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-duo bg-[#3c94d4] text-white font-extrabold text-xs uppercase tracking-wide border-2 border-[#1e64a5] shrink-0">
              <span>Vào bài học</span>
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 3: DẢI LỌC NHANH #TAGS & Ô TÌM KIẾM CHUẨN PARROTO          */}
      {/* =================================================================== */}
      <section
        id="catalog-decks-section"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2"
      >
        {/* Dải nút lọc #tag */}
        <div className="flex items-center gap-2 flex-wrap">
          {tagList.map((tagItem) => {
            const isSelected = selectedTag === tagItem;
            return (
              <button
                key={tagItem}
                type="button"
                onClick={() => setSelectedTag(tagItem)}
                className={`btn-duo px-3.5 py-2 rounded-duo text-xs font-extrabold border-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#262c57] text-white border-[#161c41] shadow-[0_2px_0_0_#161c41]'
                    : 'bg-white dark:bg-slate-900 text-[#4a5568] dark:text-slate-300 border-[#e2e8f0] dark:border-slate-700 shadow-duo-sm hover:border-[#3c94d4] hover:text-[#262c57]'
                }`}
              >
                {tagItem === 'all' ? 'Tất cả bộ từ' : tagItem}
              </button>
            );
          })}
        </div>

        {/* Ô tìm kiếm bộ thẻ */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#4a5568] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm bộ từ vựng (A1, A2, B1, B2...)"
            className="w-full pl-10 pr-4 py-2.5 rounded-duo bg-white dark:bg-slate-900 border-2 border-[#e2e8f0] dark:border-slate-700 shadow-duo-sm text-xs sm:text-sm font-semibold text-[#1a1a2e] dark:text-white focus:outline-none focus:border-[#3c94d4]"
          />
        </div>
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 4: LƯỚI 4 CỘT CÁC BỘ THẺ CẤP ĐỘ (PARROTO 4-COLUMN DECKS)   */}
      {/* =================================================================== */}
      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((skeleton) => (
              <div
                key={skeleton}
                className="h-96 rounded-duo bg-white dark:bg-slate-900 border-2 border-[#e2e8f0] dark:border-slate-800 p-4 animate-pulse flex flex-col justify-between"
              >
                <div className="h-40 rounded-duo bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2">
                  <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-duo" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="rounded-duo border-2 border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-700 font-bold text-sm">{errorMessage}</p>
          </div>
        ) : decks.length === 0 && currentLang === 'ZH' ? (
          <div className="rounded-duo-lg border-2 border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-duo p-8 sm:p-10 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-duo bg-[#f0f4ff] border-2 border-[#c7d2e0] text-[#262c57] flex items-center justify-center mx-auto">
              <Globe className="w-7 h-7 text-[#3c94d4]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1a1a2e] dark:text-white">
              Kho từ vựng Tiếng Trung (HSK 1 – HSK 6) đang được cập nhật
            </h3>
            <p className="text-sm text-[#4a5568] dark:text-slate-400 leading-relaxed">
              Dữ liệu HSK sẽ được nạp ở chặng tiếp theo. Hiện tại bạn có thể chuyển sang{' '}
              <strong className="text-[#262c57] dark:text-white">Tiếng Anh (EN)</strong> để trải nghiệm trọn bộ{' '}
              <strong className="text-[#3c94d4]">3.004 từ Oxford 3000</strong> chia theo 187 bài học chủ đề!
            </p>
            <button
              type="button"
              onClick={() => switchLanguage('EN')}
              className="btn-duo inline-flex items-center gap-2 px-6 py-3 rounded-duo bg-[#262c57] text-white font-extrabold text-xs uppercase tracking-wide border-2 border-[#161c41] shadow-duo-primary cursor-pointer"
            >
              <span>Chuyển sang Tiếng Anh (EN)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="rounded-duo border-2 border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-duo space-y-4">
            <p className="text-sm font-bold text-[#4a5568] dark:text-slate-300">
              Không tìm thấy bộ từ vựng nào khớp với bộ lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedTag('all');
                setSearchTerm('');
              }}
              className="btn-duo inline-flex items-center gap-1.5 px-4 py-2 rounded-duo border-2 border-[#e2e8f0] bg-[#f0f4ff] text-[#262c57] text-xs font-extrabold shadow-duo-sm cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xem tất cả bộ từ</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredDecks.map((deck) => {
              const theme = getDeckVisualTheme(deck.level_tag);
              const isCompleted =
                deck.total_cards > 0 && deck.mastered_count >= deck.total_cards;
              const isInProgress = deck.learned_count > 0 && !isCompleted;

              return (
                <div
                  key={deck.id}
                  onClick={() => navigate(`/decks/${deck.slug}`)}
                  className="btn-duo rounded-duo border-2 border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-duo flex flex-col justify-between gap-4 cursor-pointer group"
                >
                  <div className="space-y-3.5">
                    {/* Ảnh bìa trực quan chuẩn Parroto (h-40 rounded-duo border-2) */}
                    <div
                      className={`h-40 rounded-duo border-2 border-[#e2e8f0] dark:border-slate-700 overflow-hidden relative p-4 flex flex-col justify-between text-white ${theme.bannerBg}`}
                    >
                      {/* Hàng nhãn trên cùng của ảnh bìa */}
                      <div className="flex items-center justify-between gap-2 z-10">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/25 backdrop-blur-xs border border-white/25">
                          CEFR {deck.level_tag}
                        </span>

                        {isCompleted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-white border border-white/40">
                            HOÀN THÀNH
                          </span>
                        ) : isInProgress ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 border border-white/40">
                            ĐANG HỌC
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-white/20 text-white border border-white/25">
                            MỚI
                          </span>
                        )}
                      </div>

                      {/* Biểu tượng cấp độ lớn ở giữa ảnh bìa */}
                      <div className="z-10 my-auto">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                          THE OXFORD 3000™
                        </p>
                        <p className="text-2xl font-black tracking-tight mt-0.5">
                          Cấp độ {deck.level_tag}
                        </p>
                        <p className="text-xs font-semibold text-white/90 mt-0.5">
                          {theme.levelSub}
                        </p>
                      </div>

                      {/* Vòng tròn trang trí nhẹ ở góc phải */}
                      <div className="w-24 h-24 rounded-full bg-white/10 absolute -right-6 -bottom-6 pointer-events-none" />
                    </div>

                    {/* Tiêu đề bộ thẻ */}
                    <div>
                      <h3 className="font-extrabold text-base text-[#1a1a2e] dark:text-white group-hover:text-[#3c94d4] transition-colors line-clamp-1">
                        {deck.title_vi}
                      </h3>
                      <p className="text-xs font-semibold text-[#4a5568] dark:text-slate-400 mt-0.5 line-clamp-1">
                        {deck.title_target}
                      </p>
                    </div>

                    {/* Thanh tiến độ & Số thẻ cần ôn */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#4a5568] dark:text-slate-300">
                          Đã thuộc:{' '}
                          <strong className="text-[#1a1a2e] dark:text-white">
                            {deck.mastered_count}/{deck.total_cards}
                          </strong>
                        </span>
                        {deck.due_count > 0 ? (
                          <span className="font-extrabold text-amber-600 dark:text-amber-400">
                            Cần ôn: {deck.due_count}
                          </span>
                        ) : (
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {deck.progress_percent || 0}%
                          </span>
                        )}
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-[#f0f4ff] dark:bg-slate-800 border border-[#c7d2e0] dark:border-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-[#22c55e] rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(0, deck.progress_percent || 0))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Dòng thông tin Tổng số từ & Số bài học */}
                    <div className="flex items-center justify-between text-xs font-bold text-[#4a5568] dark:text-slate-400 pt-1 border-t border-[#e2e8f0] dark:border-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#3c94d4]" />
                        <span>{deck.total_cards} từ vựng</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#262c57] dark:text-slate-300" />
                        <span>{theme.unitEstimate} bài học</span>
                      </span>
                    </div>
                  </div>

                  {/* Nút CTA dưới đáy thẻ */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/decks/${deck.slug}`);
                    }}
                    className={`btn-duo w-full py-2.5 px-4 rounded-duo font-extrabold text-xs uppercase tracking-wide border-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                      deck.due_count > 0
                        ? 'bg-amber-500 text-white border-amber-700 shadow-duo-amber'
                        : isInProgress
                        ? 'bg-[#3c94d4] text-white border-[#1e64a5] shadow-duo-secondary'
                        : 'bg-[#262c57] text-white border-[#161c41] shadow-duo-primary'
                    }`}
                  >
                    <span>
                      {deck.due_count > 0
                        ? `Ôn tập (${deck.due_count} từ)`
                        : isInProgress
                        ? 'Tiếp tục học'
                        : 'Bắt đầu học'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 5: BẢNG THAM CHIẾU CẤP ĐỘ CEFR & 4 NGUYÊN TẮC VÀNG SRS      */}
      {/* =================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Khung trái: Bảng quy chiếu cấp độ từ vựng CEFR */}
        <div className="rounded-duo-lg border-2 border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-duo space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f0f4ff] dark:bg-slate-800 border-2 border-[#c7d2e0] dark:border-slate-700 flex items-center justify-center text-[#262c57] dark:text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1a1a2e] dark:text-white">
                Thang Cấp Độ Từ Vựng Chuẩn Quốc Tế (CEFR)
              </h3>
              <p className="text-xs text-[#4a5568] dark:text-slate-400">
                Chọn đúng cấp độ phù hợp với mục tiêu giao tiếp hoặc thi cử của bạn
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-[#e2e8f0] dark:border-slate-800 text-[#4a5568] dark:text-slate-400 uppercase font-extrabold">
                  <th className="py-2.5 pr-3">Cấp độ</th>
                  <th className="py-2.5 px-3">Số từ</th>
                  <th className="py-2.5 px-3">Bài học</th>
                  <th className="py-2.5 pl-3">Năng lực đạt được</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800 font-semibold">
                <tr>
                  <td className="py-3 pr-3">
                    <span className="px-2.5 py-1 rounded-full font-extrabold bg-emerald-100 text-emerald-800">
                      A1 · Beginner
                    </span>
                  </td>
                  <td className="py-3 px-3 font-extrabold text-[#1a1a2e] dark:text-white">902 từ</td>
                  <td className="py-3 px-3 text-[#3c94d4] font-bold">54 bài</td>
                  <td className="py-3 pl-3 text-[#4a5568] dark:text-slate-300">
                    Giao tiếp sinh hoạt hàng ngày, giới thiệu bản thân, mua sắm cơ bản
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3">
                    <span className="px-2.5 py-1 rounded-full font-extrabold bg-sky-100 text-sky-800">
                      A2 · Elementary
                    </span>
                  </td>
                  <td className="py-3 px-3 font-extrabold text-[#1a1a2e] dark:text-white">801 từ</td>
                  <td className="py-3 px-3 text-[#3c94d4] font-bold">48 bài</td>
                  <td className="py-3 pl-3 text-[#4a5568] dark:text-slate-300">
                    Du lịch tự túc, mô tả công việc, sức khỏe và trải nghiệm cá nhân
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3">
                    <span className="px-2.5 py-1 rounded-full font-extrabold bg-amber-100 text-amber-800">
                      B1 · Intermediate
                    </span>
                  </td>
                  <td className="py-3 px-3 font-extrabold text-[#1a1a2e] dark:text-white">700 từ</td>
                  <td className="py-3 px-3 text-[#3c94d4] font-bold">46 bài</td>
                  <td className="py-3 pl-3 text-[#4a5568] dark:text-slate-300">
                    Đọc hiểu báo chí, làm việc công sở (tương đương IELTS 5.0–5.5 / TOEIC 550+)
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3">
                    <span className="px-2.5 py-1 rounded-full font-extrabold bg-purple-100 text-purple-800">
                      B2 · Upper-Inter
                    </span>
                  </td>
                  <td className="py-3 px-3 font-extrabold text-[#1a1a2e] dark:text-white">601 từ</td>
                  <td className="py-3 px-3 text-[#3c94d4] font-bold">39 bài</td>
                  <td className="py-3 pl-3 text-[#4a5568] dark:text-slate-300">
                    Tranh luận học thuật, kinh tế, pháp luật (IELTS 6.5+ / TOEIC 785+)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Khung phải: 4 Nguyên tắc học từ vựng hiệu quả chuẩn Parroto */}
        <div className="rounded-duo-lg border-2 border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-duo space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f0f4ff] dark:bg-slate-800 border-2 border-[#c7d2e0] dark:border-slate-700 flex items-center justify-center text-[#262c57] dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1a1a2e] dark:text-white">
                4 Bí Quyết Ghi Nhớ Từ Vựng Nhanh Gấp 3 Lần
              </h3>
              <p className="text-xs text-[#4a5568] dark:text-slate-400">
                Áp dụng đúng lộ trình để không bao giờ bị học trước quên sau
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-duo border-2 border-[#e2e8f0] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/50 space-y-1">
              <p className="text-xs font-extrabold text-[#262c57] dark:text-blue-300">
                1. Lọc bỏ từ đã biết trước
              </p>
              <p className="text-xs text-[#4a5568] dark:text-slate-400 leading-relaxed">
                Vào từng bài học, bấm nút <strong>&ldquo;Đã biết&rdquo;</strong> cho những từ quen thuộc để chỉ tập trung vào từ mới.
              </p>
            </div>

            <div className="p-3.5 rounded-duo border-2 border-[#e2e8f0] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/50 space-y-1">
              <p className="text-xs font-extrabold text-[#262c57] dark:text-blue-300">
                2. Học theo cụm 15–20 từ cùng chủ đề
              </p>
              <p className="text-xs text-[#4a5568] dark:text-slate-400 leading-relaxed">
                Não bộ liên kết các từ cùng ngữ cảnh (Gia đình, Nhà hàng, Sân bay...) nhanh hơn gấp nhiều lần so với học theo A–Z.
              </p>
            </div>

            <div className="p-3.5 rounded-duo border-2 border-[#e2e8f0] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/50 space-y-1">
              <p className="text-xs font-extrabold text-[#262c57] dark:text-blue-300">
                3. Nghe phát âm & đọc to câu ví dụ
              </p>
              <p className="text-xs text-[#4a5568] dark:text-slate-400 leading-relaxed">
                Luôn bấm loa nghe cả giọng US/UK và đọc câu ví dụ có tô sáng từ khóa để hiểu cách dùng từ thực tế.
              </p>
            </div>

            <div className="p-3.5 rounded-duo border-2 border-[#e2e8f0] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/50 space-y-1">
              <p className="text-xs font-extrabold text-[#262c57] dark:text-blue-300">
                4. Duy trì 5–10 phút ôn tập mỗi ngày
              </p>
              <p className="text-xs text-[#4a5568] dark:text-slate-400 leading-relaxed">
                Ưu tiên giải quyết sạch các thẻ <strong>&ldquo;Cần ôn hôm nay&rdquo;</strong> trước khi học sang bài mới.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
