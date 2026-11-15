import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Flame,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Tag,
  Clock
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import { useAuthStore } from '../store/useAuthStore.js';

// Danh sách các nút lọc #tag dành cho Tiếng Anh (EN)
const ENGLISH_TAGS = [
  'all',
  '#oxford',
  '#a1',
  '#a2',
  '#b1',
  '#b2',
  '#common',
  '#communication',
  '#toeic',
  '#ielts'
];

// Danh sách các nút lọc #tag dành cho Tiếng Trung (ZH)
const CHINESE_TAGS = [
  'all',
  '#hsk1',
  '#hsk2',
  '#hsk3',
  '#hsk4',
  '#giaotiep',
  '#boya'
];

/**
 * Hàm phụ trợ lấy màu sắc nổi bật cho nhãn cấp độ (A1, A2, B1, B2, HSK...)
 */
function getLevelBadgeStyle(levelTag) {
  if (levelTag === 'A1') {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  }
  if (levelTag === 'A2') {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  }
  if (levelTag === 'B1') {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  }
  if (levelTag === 'B2') {
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600';
}

export default function DashboardPage() {
  const navigate = useNavigate();

  // Lấy thông tin người dùng, ngôn ngữ hiện tại và hàm đổi ngôn ngữ từ kho lưu trữ chung
  const user = useAuthStore((state) => state.user);
  const currentLang = useAuthStore((state) => state.currentLang);
  const switchLanguage = useAuthStore((state) => state.switchLanguage);

  // Các biến trạng thái (state) quản lý dữ liệu trên trang chủ
  const [decks, setDecks] = useState([]);
  const [dailySummary, setDailySummary] = useState({
    totalDueToday: 0,
    totalWeakWords: 0,
    totalMastered: 0
  });
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // =========================================================================
  // 1. GỌI API LẤY DANH SÁCH BỘ THẺ & BANNER NHẮC ÔN TẬP KHI ĐỔI NGÔN NGỮ
  // =========================================================================
  useEffect(() => {
    // Mỗi khi đổi giữa Tiếng Anh (EN) và Tiếng Trung (ZH), đưa bộ lọc về mặc định
    setSelectedTag('all');
    setSearchTerm('');

    async function fetchCatalogData() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        // Gọi API lấy danh sách bộ thẻ theo ngôn ngữ hiện tại
        const response = await axiosClient.get(`/decks?lang=${currentLang}`);
        const resultData = response.data?.data;

        if (resultData) {
          setDecks(resultData.decks || []);
          setDailySummary(
            resultData.dailySummary || {
              totalDueToday: 0,
              totalWeakWords: 0,
              totalMastered: 0
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
  // 2. XỬ LÝ LỌC BỘ THẺ KHI BẤM CHỌN #TAG HOẶC GÕ Ô TÌM KIẾM
  // =========================================================================
  const filteredDecks = [];
  const keyword = searchTerm.trim().toLowerCase();

  for (let i = 0; i < decks.length; i++) {
    const deck = decks[i];

    // Kiểm tra điều kiện 1: Bộ thẻ có khớp với nút #tag đang chọn hay không
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

    // Kiểm tra điều kiện 2: Tên bộ thẻ có chứa từ khóa tìm kiếm hay không
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

    // Nếu thỏa mãn cả 2 điều kiện thì đưa vào danh sách hiển thị
    if (matchesTag && matchesSearch) {
      filteredDecks.push(deck);
    }
  }

  // Chọn danh sách nút #tags tương ứng với ngôn ngữ đang bật
  let tagList = ENGLISH_TAGS;
  if (currentLang === 'ZH') {
    tagList = CHINESE_TAGS;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* =================================================================== */}
      {/* KHU VỰC 1: BANNER NHẮC ÔN TẬP HÀNG NGÀY (DAILY SRS QUEUE BANNER)    */}
      {/* =================================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Cột trái: Lời chào & Thông điệp nhắc học */}
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                Không gian học:{' '}
                {currentLang === 'EN' ? '🇬🇧 Tiếng Anh (Oxford 3000)' : '🇨🇳 Tiếng Trung (HSK)'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Xin chào, {user?.display_name || user?.email}! 👋
            </h1>

            {dailySummary.totalDueToday > 0 ? (
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                Hôm nay bạn có{' '}
                <span className="font-bold text-amber-300 underline">
                  {dailySummary.totalDueToday} từ vựng
                </span>{' '}
                đã đến điểm rơi遗忘 (quên) cần được ôn tập ngay để ghi nhớ dài hạn.
              </p>
            ) : (
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                🎉 <span className="font-semibold text-white">Tuyệt vời! Hôm nay bạn không có từ nào tồn đọng cần ôn.</span>{' '}
                Hãy chọn một bộ thẻ bên dưới để khám phá và nạp thêm từ vựng mới nhé!
              </p>
            )}
          </div>

          {/* Cột phải: 3 Con số thống kê nổi bật & Nút hành động chính */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-4">
            <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
              {/* Con số 1: Cần ôn hôm nay */}
              <div className="px-3 py-1 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-300 text-xs font-medium mb-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Cần ôn hôm nay</span>
                </div>
                <p className="text-2xl font-extrabold">{dailySummary.totalDueToday}</p>
                <span className="text-[11px] text-blue-100">từ đến hạn</span>
              </div>

              {/* Con số 2: Từ hay nhầm */}
              <div className="px-3 py-1 text-center border-x border-white/15">
                <div className="flex items-center justify-center gap-1 text-rose-300 text-xs font-medium mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Từ hay nhầm</span>
                </div>
                <p className="text-2xl font-extrabold">{dailySummary.totalWeakWords}</p>
                <span className="text-[11px] text-blue-100">từ khó nhớ</span>
              </div>

              {/* Con số 3: Tổng số từ đã thuộc */}
              <div className="px-3 py-1 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-300 text-xs font-medium mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã thuộc lòng</span>
                </div>
                <p className="text-2xl font-extrabold">{dailySummary.totalMastered}</p>
                <span className="text-[11px] text-blue-100">từ dài hạn</span>
              </div>
            </div>

            {/* Nút bấm Ôn tập ngay */}
            <button
              type="button"
              onClick={() => {
                if (dailySummary.totalDueToday > 0) {
                  navigate('/study?mode=due');
                } else {
                  const deckSection = document.getElementById('catalog-decks-section');
                  if (deckSection) {
                    deckSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
              className={`px-6 py-4 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 whitespace-nowrap ${
                dailySummary.totalDueToday > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-900'
                  : 'bg-white text-blue-700 hover:bg-blue-50'
              }`}
            >
              <span>
                {dailySummary.totalDueToday > 0 ? 'Ôn tập ngay' : 'Chọn bộ thẻ học mới'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 2: THANH TÌM KIẾM & DẢI NÚT LỌC #TAGS                       */}
      {/* =================================================================== */}
      <section
        id="catalog-decks-section"
        className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Khám phá Kho Bộ Thẻ Từ Vựng</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tìm kiếm theo cấp độ hoặc bấm vào nhãn #tag để lọc nhanh bộ từ vựng phù hợp với bạn
            </p>
          </div>

          {/* Ô tìm kiếm nhanh theo tên bộ thẻ */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bộ thẻ (VD: A1, Oxford, Giao tiếp...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Dải nút bấm #tags */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
            <Tag className="w-3.5 h-3.5" />
            Lọc nhanh:
          </span>

          {tagList.map((tagItem) => {
            const isSelected = selectedTag === tagItem;
            return (
              <button
                key={tagItem}
                type="button"
                onClick={() => setSelectedTag(tagItem)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tagItem === 'all' ? 'Tất cả' : tagItem}
              </button>
            );
          })}
        </div>
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 3: LƯỚI DANH SÁCH CÁC BỘ THẺ (DECK GRID)                    */}
      {/* =================================================================== */}
      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((skeleton) => (
              <div
                key={skeleton}
                className="h-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-24 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                  <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
                <div className="w-full h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">{errorMessage}</p>
          </div>
        ) : decks.length === 0 && currentLang === 'ZH' ? (
          /* Trường hợp danh sách trống khi chuyển sang Tiếng Trung (ZH) chưa nạp bộ HSK */
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm max-w-2xl mx-auto my-4 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-3xl">
              🇨🇳
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Kho từ vựng Tiếng Trung đang được chuẩn bị
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Kho từ vựng Tiếng Trung (HSK 1 - HSK 6) sẽ được nạp trong bước tiếp theo. Hãy chuyển sang{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">🇬🇧 Tiếng Anh</span> để khám phá{' '}
                <span className="font-semibold">3.004 từ Oxford 3000</span>!
              </p>
            </div>
            <button
              type="button"
              onClick={() => switchLanguage('EN')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition"
            >
              <span>Chuyển sang 🇬🇧 Tiếng Anh ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : filteredDecks.length === 0 ? (
          /* Trường hợp lọc theo #tag hoặc từ khóa mà không có bộ thẻ nào khớp */
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 space-y-4">
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              Không tìm thấy bộ thẻ nào khớp với nhãn{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">{selectedTag}</span>
              {searchTerm ? ` và từ khóa "${searchTerm}"` : ''}.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedTag('all');
                setSearchTerm('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xem tất cả bộ thẻ</span>
            </button>
          </div>
        ) : (
          /* Hiển thị lưới danh sách các bộ thẻ (Deck Grid) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDecks.map((deck) => {
              return (
                <div
                  key={deck.id}
                  className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 transition flex flex-col justify-between gap-5"
                >
                  <div className="space-y-4">
                    {/* Thông tin 1: Nhãn cấp độ (level_tag) + Tổng số thẻ + Nhãn nhắc ôn nếu có */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-extrabold border ${getLevelBadgeStyle(
                            deck.level_tag
                          )}`}
                        >
                          Cấp độ {deck.level_tag || 'Cơ bản'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {deck.total_cards} thẻ
                        </span>
                      </div>

                      {/* Nếu có từ đến hạn cần ôn trong bộ thẻ này thì hiện nhãn màu cam nhắc nhở */}
                      {deck.due_count > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Cần ôn: {deck.due_count} từ</span>
                        </span>
                      )}
                    </div>

                    {/* Thông tin 2: Tên bộ thẻ (title_target và title_vi) */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {deck.title_target}
                      </h3>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                        {deck.title_vi}
                      </p>
                      {deck.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {deck.description}
                        </p>
                      )}
                    </div>

                    {/* Thông tin 3: Danh sách #tags nhỏ bên dưới */}
                    {Array.isArray(deck.tags) && deck.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {deck.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSelectedTag(tag)}
                            className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Khu vực chân Card: Thanh tiến độ cá nhân mini & Nút Bắt đầu Học */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-700/70 space-y-4">
                    {/* Thông tin 4: Thanh tiến độ cá nhân mini (Progress Bar) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          Đã thuộc:{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {deck.mastered_count} / {deck.total_cards} từ
                          </strong>{' '}
                          ({deck.progress_percent}%)
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">
                          Đã chạm tới: {deck.learned_count} từ
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(0, deck.progress_percent || 0))}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Thông tin 5: Nút bấm Bắt đầu Học chuyển sang /decks/:slug */}
                    <button
                      type="button"
                      onClick={() => navigate(`/decks/${deck.slug}`)}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <span>Bắt đầu Học & Chọn Unit</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
