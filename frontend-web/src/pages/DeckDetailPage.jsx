import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  Search,
  CheckCircle2,
  Eye,
  Sparkles,
  Zap,
  Keyboard,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import AudioButton from '../components/common/AudioButton.jsx';

// 5 Chế độ học tự chủ động để người học bấm chọn
const STUDY_MODES = [
  {
    id: 'flashcard',
    icon: '🗂️',
    title: 'Lật thẻ Flashcard (SRS)',
    desc: 'Lật thẻ 2 mặt, nghe phát âm & tự chấm mức độ nhớ',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'quiz',
    icon: '⚡',
    title: 'Trắc nghiệm 4 đáp án',
    desc: 'Phản xạ nhanh nhìn từ chọn nghĩa hoặc điền câu',
    color: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'typing',
    icon: '⌨️',
    title: 'Nghe & Ghép chữ / Gõ từ',
    desc: 'Nghe phát âm và gõ lại chính tả từ vựng',
    color: 'from-violet-600 to-purple-600',
  },
  {
    id: 'combo',
    icon: '🔄',
    title: 'Học kết hợp 4 bước (Combo)',
    desc: 'Làm quen -> Trắc nghiệm -> Gõ từ -> Chấm SRS',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'weak_words',
    icon: '🎯',
    title: 'Ôn riêng Từ hay quên',
    desc: 'Tập trung xoáy sâu vào các từ bạn đã quên nhiều lần',
    color: 'from-rose-600 to-pink-600',
  },
];

// 5 Tab lọc trạng thái từ vựng trong bảng bên dưới
const STATUS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'due', label: '🟠 Cần ôn hôm nay' },
  { id: 'unseen', label: '⚪ Chưa học' },
  { id: 'mastered', label: '🟢 Đã thuộc' },
  { id: 'weak', label: '🎯 Từ hay quên' },
];

/**
 * Thành phần hiển thị Ảnh minh họa từ Wikipedia:
 * Nếu từ không có ảnh hoặc link ảnh bị lỗi tải thì tự động ẩn đi gọn gàng
 */
function VocabThumbnail({ imageUrl, word }) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return null;
  }

  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex-shrink-0">
      <img
        src={imageUrl}
        alt={word}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function DeckDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Trạng thái lưu thông tin tổng quan bộ thẻ, 4 chỉ số màu và danh sách các Unit
  const [deck, setDeck] = useState(null);
  const [stats, setStats] = useState({
    total_cards: 0,
    unseen_count: 0,
    learning_count: 0,
    due_today_count: 0,
    mastered_count: 0,
    weak_count: 0,
  });
  const [units, setUnits] = useState([]);

  // Unit đang được chọn ('all' hoặc id của Unit)
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  // Thu gọn bớt lưới Unit khi bộ thẻ có quá nhiều Unit (như bộ A1 46 Units hoặc Trọn bộ 153 Units)
  const [showAllUnits, setShowAllUnits] = useState(false);

  // Trạng thái lưu danh sách từ vựng của Unit đang chọn
  const [cards, setCards] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Giới hạn số từ hiển thị mỗi lần (100 từ) để xem bộ 902 từ hoặc 3.004 từ không bị giật lag
  const [visibleCount, setVisibleCount] = useState(100);

  // Trạng thái loading và lỗi
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [togglingVocabId, setTogglingVocabId] = useState(null);

  // =========================================================================
  // 1. GỌI API LẤY THÔNG TIN BỘ THẺ, THANH 4 MÀU & DANH SÁCH UNITS KHI MỞ TRANG
  // =========================================================================
  useEffect(() => {
    async function fetchOverview() {
      setIsLoadingOverview(true);
      setErrorMessage('');

      try {
        const response = await axiosClient.get(`/decks/${slug}/overview`);
        const resultData = response.data?.data || response.data;

        if (resultData) {
          setDeck(resultData.deck || null);
          setStats(
            resultData.stats || {
              total_cards: 0,
              unseen_count: 0,
              learning_count: 0,
              due_today_count: 0,
              mastered_count: 0,
              weak_count: 0,
            }
          );

          const unitList = resultData.units || [];
          setUnits(unitList);

          // Nếu đang mở trang "Trọn bộ 3.004 từ" thì mặc định chọn 'all',
          // còn nếu mở từng bộ A1, A2, B1, B2 thì mặc định chọn Unit 1 (hoặc 'all' nếu không có Unit)
          if (slug === 'all-oxford-3000' || unitList.length === 0) {
            setSelectedUnitId('all');
          } else {
            setSelectedUnitId(unitList[0].id);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết bộ thẻ:', error);
        setErrorMessage('Không tìm thấy thông tin bộ thẻ hoặc máy chủ đang bận.');
      } finally {
        setIsLoadingOverview(false);
      }
    }

    fetchOverview();
  }, [slug]);

  // =========================================================================
  // 2. GỌI API LẤY DANH SÁCH TỪ VỰNG KHI ĐỔI UNIT (20 TỪ HOẶC TẤT CẢ TỪ)
  // =========================================================================
  useEffect(() => {
    if (!selectedUnitId) {
      return;
    }

    async function fetchCardsByUnit() {
      setIsLoadingCards(true);
      // Đưa số lượng hiển thị về 100 từ đầu tiên mỗi khi đổi Unit để trang luôn mượt
      setVisibleCount(100);

      try {
        const response = await axiosClient.get(
          `/decks/${slug}/units/${selectedUnitId}/cards`
        );
        const resultData = response.data?.data || response.data;
        setCards(resultData?.cards || []);
      } catch (error) {
        console.error('Lỗi khi tải danh sách từ vựng của Unit:', error);
        setCards([]);
      } finally {
        setIsLoadingCards(false);
      }
    }

    fetchCardsByUnit();
  }, [slug, selectedUnitId]);

  // Khi người dùng đổi Tab lọc hoặc gõ tìm kiếm thì đưa danh sách hiển thị về 100 từ đầu
  useEffect(() => {
    setVisibleCount(100);
  }, [statusFilter, searchTerm]);

  // =========================================================================
  // 3. HÀM XỬ LÝ KHI BẤM NÚT "ĐÃ BIẾT" TRÊN 1 TỪ VỰNG (OPTIMISTIC UI)
  // =========================================================================
  async function handleToggleMarkKnown(card) {
    if (togglingVocabId === card.vocab_id) {
      return;
    }

    setTogglingVocabId(card.vocab_id);

    try {
      const response = await axiosClient.patch(
        `/study/cards/${card.vocab_id}/mark-known`
      );
      const updated = response.data?.data;

      if (updated) {
        const nowKnown = Boolean(updated.is_known);
        const newStatus = updated.status;
        const wasKnown = card.status === 'MASTERED' || card.status === 'IGNORED';
        const wasDue = Boolean(card.is_due_today);
        const wasLearning =
          (card.status === 'LEARNING' || card.status === 'REVIEW') && !wasDue;
        const wasUnseen = card.status === 'UNSEEN';

        // Bước 3A: Cập nhật ngay trạng thái của từ vựng trong bảng hiện tại
        const nextCards = [];
        for (let i = 0; i < cards.length; i++) {
          const item = cards[i];
          if (item.vocab_id === card.vocab_id) {
            nextCards.push({
              ...item,
              status: newStatus,
              is_known: nowKnown,
              color_state: nowKnown ? 'mastered' : 'unseen',
              is_due_today: false,
            });
          } else {
            nextCards.push(item);
          }
        }
        setCards(nextCards);

        // Bước 3B: Cập nhật ngay số liệu trên Thanh tiến độ 4 màu (stats)
        setStats((prev) => {
          let unseen = prev.unseen_count;
          let learning = prev.learning_count;
          let due = prev.due_today_count;
          let mastered = prev.mastered_count;

          if (nowKnown && !wasKnown) {
            mastered += 1;
            if (wasUnseen && unseen > 0) unseen -= 1;
            else if (wasLearning && learning > 0) learning -= 1;
            else if (wasDue && due > 0) due -= 1;
          } else if (!nowKnown && wasKnown) {
            if (mastered > 0) mastered -= 1;
            unseen += 1;
          }

          return {
            ...prev,
            unseen_count: unseen,
            learning_count: learning,
            due_today_count: due,
            mastered_count: mastered,
          };
        });

        // Bước 3C: Cập nhật luôn số liệu nhỏ trên ô Unit chứa từ vựng đó
        setUnits((prevUnits) => {
          const nextUnits = [];
          for (let i = 0; i < prevUnits.length; i++) {
            const u = prevUnits[i];
            if (u.id === card.unit_id) {
              let uUnseen = u.unseen_count;
              let uMastered = u.mastered_count;

              if (nowKnown && !wasKnown) {
                uMastered += 1;
                if (uUnseen > 0) uUnseen -= 1;
              } else if (!nowKnown && wasKnown) {
                if (uMastered > 0) uMastered -= 1;
                uUnseen += 1;
              }

              nextUnits.push({
                ...u,
                unseen_count: uUnseen,
                mastered_count: uMastered,
              });
            } else {
              nextUnits.push(u);
            }
          }
          return nextUnits;
        });
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái Đã biết:', error);
      alert('Không thể cập nhật trạng thái từ vựng. Vui lòng thử lại.');
    } finally {
      setTogglingVocabId(null);
    }
  }

  // =========================================================================
  // 4. LỌC DANH SÁCH TỪ VỰNG THEO TAB TRẠNG THÁI VÀ Ô TÌM KIẾM BẰNG VÒNG LẶP FOR
  // =========================================================================
  const filteredCards = [];
  const keyword = searchTerm.trim().toLowerCase();

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    // Kiểm tra điều kiện 1: Khớp với Tab trạng thái đang chọn
    let matchesStatus = true;
    if (statusFilter === 'due') {
      matchesStatus = Boolean(card.is_due_today);
    } else if (statusFilter === 'unseen') {
      matchesStatus = card.status === 'UNSEEN';
    } else if (statusFilter === 'mastered') {
      matchesStatus = card.status === 'MASTERED' || card.status === 'IGNORED';
    } else if (statusFilter === 'weak') {
      matchesStatus = Boolean(card.is_weak);
    }

    // Kiểm tra điều kiện 2: Khớp với từ khóa tìm kiếm (tìm cả tiếng Anh lẫn nghĩa tiếng Việt)
    let matchesSearch = true;
    if (keyword !== '') {
      const wordText = String(card.word || '').toLowerCase();
      const meaningText = String(card.meaning_vi || '').toLowerCase();
      const exampleText = String(card.example_sentence || '').toLowerCase();

      if (
        !wordText.includes(keyword) &&
        !meaningText.includes(keyword) &&
        !exampleText.includes(keyword)
      ) {
        matchesSearch = false;
      }
    }

    if (matchesStatus && matchesSearch) {
      filteredCards.push(card);
    }
  }

  // Cắt danh sách theo visibleCount (mặc định 100 từ) để tránh giật lag khi xem 902 hoặc 3.004 từ
  const displayedCards = filteredCards.slice(0, visibleCount);

  // Tính tỷ lệ phần trăm cho Thanh tiến độ 4 màu
  const total = stats.total_cards > 0 ? stats.total_cards : 1;
  const masteredPct = Math.round((stats.mastered_count / total) * 100);
  const duePct = Math.round((stats.due_today_count / total) * 100);
  const learningPct = Math.round((stats.learning_count / total) * 100);
  const unseenPct = Math.max(0, 100 - masteredPct - duePct - learningPct);

  // Xác định tiêu đề của Unit đang chọn để hiển thị rõ ràng
  let currentUnitLabel = `Tất cả các từ (${stats.total_cards} từ)`;
  if (selectedUnitId !== 'all') {
    for (let i = 0; i < units.length; i++) {
      if (units[i].id === selectedUnitId) {
        currentUnitLabel = units[i].title;
        break;
      }
    }
  }

  // Quyết định số lượng ô Unit hiển thị (mặc định hiện 12 Unit đầu để gọn trang, bấm nút sẽ mở hết)
  const unitsToDisplay = showAllUnits ? units : units.slice(0, 12);

  if (isLoadingOverview) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="h-48 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse p-8" />
        <div className="h-32 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse p-6" />
        <div className="h-96 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse p-6" />
      </div>
    );
  }

  if (errorMessage || !deck) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8">
          <p className="text-red-600 dark:text-red-400 font-semibold">
            {errorMessage || 'Không tìm thấy bộ thẻ này'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Trang chủ</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* =================================================================== */}
      {/* KHU VỰC 1: HEADER & THANH TIẾN ĐỘ 4 MÀU (4-COLOR PROGRESS BAR)      */}
      {/* =================================================================== */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        {/* Hàng trên: Nút quay lại & Nhãn cấp độ */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Kho bộ thẻ</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Cấp độ {deck.level_tag}
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              Tổng cộng: {stats.total_cards} từ ({units.length} Units)
            </span>
          </div>
        </div>

        {/* Tên bộ thẻ & Mô tả */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {deck.title_target || deck.title_vi}
          </h1>
          <p className="text-base font-medium text-blue-600 dark:text-blue-400 mt-1">
            {deck.title_vi}
          </p>
          {deck.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {deck.description}
            </p>
          )}
        </div>

        {/* Thanh Tiến Độ 4 Màu (4-Color Segmented Progress Bar) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              Thanh Tiến Độ Học Tập 4 Trạng Thái
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Đã thuộc: {stats.mastered_count} / {stats.total_cards} từ ({masteredPct}%)
            </span>
          </div>

          {/* Thanh ngang ghép 4 dải màu */}
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex p-0.5 gap-0.5">
            {stats.mastered_count > 0 && (
              <div
                style={{ width: `${Math.max(2, masteredPct)}%` }}
                title={`Đã thuộc: ${stats.mastered_count} từ`}
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-300"
              />
            )}
            {stats.due_today_count > 0 && (
              <div
                style={{ width: `${Math.max(2, duePct)}%` }}
                title={`Cần ôn hôm nay: ${stats.due_today_count} từ`}
                className="h-full bg-amber-500 transition-all duration-300"
              />
            )}
            {stats.learning_count > 0 && (
              <div
                style={{ width: `${Math.max(2, learningPct)}%` }}
                title={`Đang học: ${stats.learning_count} từ`}
                className="h-full bg-blue-500 transition-all duration-300"
              />
            )}
            {stats.unseen_count > 0 && (
              <div
                style={{ width: `${Math.max(2, unseenPct)}%` }}
                title={`Chưa học: ${stats.unseen_count} từ`}
                className="h-full bg-slate-300 dark:bg-slate-600 rounded-r-full transition-all duration-300"
              />
            )}
          </div>

          {/* 4 Ô chú thích số lượng tương ứng với 4 màu */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  ⚪ Chưa học
                </span>
              </div>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {stats.unseen_count}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  🔵 Đang học
                </span>
              </div>
              <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
                {stats.learning_count}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  🟠 Cần ôn hôm nay
                </span>
              </div>
              <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">
                {stats.due_today_count}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  🟢 Đã thuộc
                </span>
              </div>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                {stats.mastered_count}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 2: BẢNG CHỌN 5 CHẾ ĐỘ HỌC TỰ CHỦ ĐỘNG                       */}
      {/* =================================================================== */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Chọn Chế Độ Học Tự Chủ Động</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Đang áp dụng cho chặng:{' '}
              <strong className="text-blue-600 dark:text-blue-400">{currentUnitLabel}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {STUDY_MODES.map((mode) => {
            const isWeakMode = mode.id === 'weak_words';
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() =>
                  navigate(`/study/${slug}/${mode.id}?unitId=${selectedUnitId}`)
                }
                className="group text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition shadow-sm hover:shadow flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{mode.icon}</span>
                    {isWeakMode && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300">
                        {stats.weak_count} từ
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {mode.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 pt-1">
                  <span>Bắt đầu ngay</span>
                  <span>→</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 3: DANH SÁCH CHỌN CHẶNG (UNITS GRID 20 TỪ) + NÚT TẤT CẢ TỪ  */}
      {/* =================================================================== */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Chọn Chặng Học (20 từ / Unit) hoặc Xem Tất Cả</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chia nhỏ bộ thẻ thành từng chặng 20 từ giúp bạn dễ hoàn thành trong 5–10 phút mỗi ngày
            </p>
          </div>

          {/* Nút đầu tiên nổi bật: Xem tất cả các từ trong bộ */}
          <button
            type="button"
            onClick={() => setSelectedUnitId('all')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border ${
              selectedUnitId === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 Tất cả các từ trong bộ ({stats.total_cards} từ)</span>
          </button>
        </div>

        {/* Lưới các chặng nhỏ (Unit 1, Unit 2...) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {unitsToDisplay.map((unit) => {
            const isSelected = selectedUnitId === unit.id;
            const uTotal = unit.total_cards > 0 ? unit.total_cards : 1;
            const uMasteredPct = Math.round((unit.mastered_count / uTotal) * 100);
            const uDuePct = Math.round((unit.due_today_count / uTotal) * 100);
            const uLearningPct = Math.round((unit.learning_count / uTotal) * 100);

            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => setSelectedUnitId(unit.id)}
                className={`p-3.5 rounded-2xl text-left border transition flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-900/40 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      {slug === 'all-oxford-3000'
                        ? `[${unit.deck_level_tag}] Unit ${unit.unit_number}`
                        : `Unit ${unit.unit_number}`}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {unit.mastered_count}/{unit.total_cards} từ
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {unit.title}
                  </p>
                </div>

                {/* Thanh tiến độ nhỏ trên từng ô Unit */}
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                  {unit.mastered_count > 0 && (
                    <div
                      style={{ width: `${uMasteredPct}%` }}
                      className="h-full bg-emerald-500"
                    />
                  )}
                  {unit.due_today_count > 0 && (
                    <div
                      style={{ width: `${uDuePct}%` }}
                      className="h-full bg-amber-500"
                    />
                  )}
                  {unit.learning_count > 0 && (
                    <div
                      style={{ width: `${uLearningPct}%` }}
                      className="h-full bg-blue-500"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Nút Mở rộng / Thu gọn danh sách Unit nếu có nhiều hơn 12 Units */}
        {units.length > 12 && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowAllUnits(!showAllUnits)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
            >
              {showAllUnits ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Thu gọn danh sách Unit</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Xem toàn bộ {units.length} Units</span>
                </>
              )}
            </button>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 4: BẢNG DANH SÁCH TỪ VỰNG (VOCABULARY PREVIEW TABLE)        */}
      {/* =================================================================== */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
        {/* Thanh tiêu đề + Ô tìm kiếm từ vựng nhanh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Danh Sách Từ Vựng: <span className="text-blue-600 dark:text-blue-400">{currentUnitLabel}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tìm thấy <strong>{filteredCards.length}</strong> từ vựng • Bấm loa để nghe phát âm hoặc đánh dấu &ldquo;Đã biết&rdquo; những từ bạn đã thuộc
            </p>
          </div>

          {/* Ô tìm kiếm từ vựng nhanh trong danh sách */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm từ tiếng Anh hoặc nghĩa Việt..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 5 Nút Tab lọc trạng thái */}
        <div className="flex items-center gap-2 flex-wrap border-b border-slate-100 dark:border-slate-700 pb-4">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Danh sách các dòng từ vựng */}
        {isLoadingCards ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-700/50 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Không có từ vựng nào khớp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedCards.map((card, index) => {
              const isKnown = card.status === 'MASTERED' || card.status === 'IGNORED';

              return (
                <div
                  key={`${card.deck_card_id || card.vocab_id}-${index}`}
                  className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isKnown
                      ? 'bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-200/80 dark:border-emerald-800/40'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Cột trái: Số thứ tự + Ảnh minh họa Wikipedia + Thông tin từ vựng */}
                  <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                    {/* Số thứ tự */}
                    <span className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>

                    {/* Ảnh minh họa từ Wikipedia (tự ẩn nếu không có ảnh hoặc lỗi tải ảnh) */}
                    <VocabThumbnail imageUrl={card.image_url} word={card.word} />

                    {/* Nội dung chính của từ vựng */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {card.word}
                        </h3>

                        {card.part_of_speech && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 italic">
                            {card.part_of_speech}
                          </span>
                        )}

                        {card.phonetic_primary && (
                          <span className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400">
                            {card.phonetic_primary}
                          </span>
                        )}

                        {/* Nút Loa nghe phát âm từ vựng */}
                        <AudioButton
                          text={card.word}
                          lang={card.language || 'EN'}
                          audioUrl={card.audio_word_url}
                          size="sm"
                        />
                      </div>

                      {/* Nghĩa tiếng Việt */}
                      <p className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-300">
                        {card.meaning_vi}
                      </p>

                      {/* Câu ví dụ tiếng Anh + Dịch nghĩa tiếng Việt */}
                      {card.example_sentence && (
                        <div className="pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-0.5 border-l-2 border-slate-300 dark:border-slate-600 pl-3">
                          <div className="flex items-center gap-2">
                            <p className="italic">&ldquo;{card.example_sentence}&rdquo;</p>
                            <AudioButton
                              text={card.example_sentence}
                              lang={card.language || 'EN'}
                              audioUrl={card.audio_example_url}
                              size="sm"
                            />
                          </div>
                          {card.example_meaning_vi && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              → {card.example_meaning_vi}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cột phải: Nhãn trạng thái + Nút đánh dấu "Đã biết" */}
                  <div className="flex items-center justify-end gap-2.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 dark:border-slate-700">
                    <button
                      type="button"
                      disabled={togglingVocabId === card.vocab_id}
                      onClick={() => handleToggleMarkKnown(card)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                        isKnown
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm hover:bg-emerald-700'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                    >
                      {isKnown ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Đã biết (Bấm để bỏ)</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Đánh dấu Đã biết</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Nút "Xem thêm 100 từ" khi đang xem danh sách lớn (902 từ hoặc 3.004 từ) */}
            {visibleCount < filteredCards.length && (
              <div className="pt-4 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 100)}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition"
                >
                  Xem thêm 100 từ tiếp theo (Đang hiện {displayedCards.length} /{' '}
                  {filteredCards.length} từ)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(filteredCards.length)}
                  className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
                >
                  Hiển thị tất cả {filteredCards.length} từ
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
