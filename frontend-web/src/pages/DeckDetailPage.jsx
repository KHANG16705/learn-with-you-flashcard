import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  Search,
  CheckCircle2,
  Eye,
  Sparkles,
  BookOpen,
  Play,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import AudioButton from '../components/common/AudioButton.jsx';

// 5 Nhóm Chủ đề lớn (Category Filter Tabs) để gom nhóm các Unit gọn gàng, không gây ngợp
const CATEGORY_TABS = [
  { id: 'all', label: '🌟 Tất cả nhóm chủ đề' },
  { id: 'life_people', label: '👨‍👩‍👧‍👦 Đời sống, Gia đình & Ẩm thực' },
  { id: 'travel_leisure', label: '✈️ Di chuyển, Địa điểm & Giải trí' },
  { id: 'work_education', label: '💼 Công việc, Kinh tế & Giáo dục' },
  { id: 'nature_science_society', label: '🌿 Tự nhiên, Khoa học, Y tế & Xã hội' },
  { id: 'mind_actions_grammar', label: '🧠 Tư duy, Cảm xúc, Hành động & Ngữ pháp' },
];

// 5 Chế độ học tự chủ động
const STUDY_MODES = [
  {
    id: 'flashcard',
    icon: '🗂️',
    title: 'Lật thẻ Flashcard (SRS)',
    desc: 'Lật thẻ 2 mặt, nghe phát âm & tự chấm mức độ nhớ',
  },
  {
    id: 'quiz',
    icon: '⚡',
    title: 'Trắc nghiệm 4 đáp án',
    desc: 'Phản xạ nhanh nhìn từ chọn nghĩa cùng chủ đề',
  },
  {
    id: 'typing',
    icon: '⌨️',
    title: 'Nghe & Ghép chữ / Gõ từ',
    desc: 'Nghe phát âm và gõ lại chính tả từ vựng',
  },
  {
    id: 'combo',
    icon: '🔄',
    title: 'Học kết hợp 4 bước (Combo)',
    desc: 'Làm quen -> Trắc nghiệm -> Gõ từ -> Chấm SRS',
  },
  {
    id: 'weak_words',
    icon: '🎯',
    title: 'Ôn riêng Từ hay quên',
    desc: 'Tập trung xoáy sâu vào các từ hay nhầm',
  },
];

// Bộ lọc Trạng thái nhớ
const STATUS_TABS = [
  { id: 'all', label: 'Tất cả trạng thái' },
  { id: 'unseen', label: '⚪ Chưa học' },
  { id: 'due', label: '🟠 Cần ôn hôm nay' },
  { id: 'mastered', label: '🟢 Đã thuộc' },
  { id: 'weak', label: '🎯 Từ hay quên' },
];

// Bộ lọc Độ khó nội tại của từ vựng
const DIFFICULTY_TABS = [
  { id: 'ALL', label: 'Mọi độ khó' },
  { id: 'EASY', label: '🟢 Dễ nhớ' },
  { id: 'MEDIUM', label: '🟡 Trung bình' },
  { id: 'HARD', label: '🔴 Từ khó' },
];

/**
 * Hàm phụ: Trả về nhãn và màu sắc cho Badge Độ khó ('EASY' | 'MEDIUM' | 'HARD')
 */
function getDifficultyBadge(difficultyLevel) {
  const level = String(difficultyLevel || 'MEDIUM').toUpperCase();
  if (level === 'EASY') {
    return {
      text: '🟢 Dễ',
      className:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    };
  }
  if (level === 'HARD') {
    return {
      text: '🔴 Khó',
      className:
        'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    };
  }
  return {
    text: '🟡 Vừa',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  };
}

/**
 * Thành phần hiển thị Ảnh minh họa từ Wikipedia:
 * Nếu từ không có ảnh hoặc lỗi tải ảnh thì tự ẩn gọn gàng
 */
function VocabThumbnail({ imageUrl, word, large = false }) {
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return null;
  }

  if (large) {
    return (
      <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
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

  // Trạng thái lưu thông tin Bộ thẻ, Thanh tiến độ 4 màu, Unit gợi ý và danh sách Units
  const [deck, setDeck] = useState(null);
  const [stats, setStats] = useState({
    total_cards: 0,
    unseen_count: 0,
    learning_count: 0,
    due_today_count: 0,
    mastered_count: 0,
    weak_count: 0,
  });
  const [recommendedUnit, setRecommendedUnit] = useState(null);
  const [units, setUnits] = useState([]);

  // Nhóm chủ đề lớn đang chọn ('all' | 'life_people' | 'travel_leisure' | ...)
  const [selectedCategory, setSelectedCategory] = useState('life_people');
  // Unit đang được chọn ('all' hoặc id của Unit)
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  // Danh sách từ vựng & các bộ lọc trong Khu vực 3 (Vocabulary Explorer)
  const [cards, setCards] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  // Chế độ xem: 'list' (Danh sách gọn) hoặc 'grid' (Thẻ lưới có ảnh lớn)
  const [viewMode, setViewMode] = useState('list');
  const [visibleCount, setVisibleCount] = useState(100);

  // Trạng thái tải dữ liệu
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [togglingVocabId, setTogglingVocabId] = useState(null);

  // =========================================================================
  // 1. GỌI API LẤY TỔNG QUAN BỘ THẺ, THANH 4 MÀU & LỘ TRÌNH CHỦ ĐỀ
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
          const recUnit = resultData.recommended_unit || unitList[0] || null;
          setUnits(unitList);
          setRecommendedUnit(recUnit);

          if (slug === 'all-oxford-3000') {
            setSelectedCategory('all');
            setSelectedUnitId('all');
          } else if (recUnit) {
            setSelectedCategory(recUnit.category_id || 'life_people');
            setSelectedUnitId(recUnit.id);
          } else {
            setSelectedCategory('all');
            setSelectedUnitId('all');
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
  // 2. GỌI API LẤY DANH SÁCH TỪ VỰNG KHI ĐỔI UNIT ĐANG CHỌN
  // =========================================================================
  useEffect(() => {
    if (!selectedUnitId) {
      return;
    }

    async function fetchCardsByUnit() {
      setIsLoadingCards(true);
      setVisibleCount(100);

      try {
        const response = await axiosClient.get(
          `/decks/${slug}/units/${selectedUnitId}/cards`
        );
        const resultData = response.data?.data || response.data;
        setCards(resultData?.cards || []);
      } catch (error) {
        console.error('Lỗi khi tải danh sách từ vựng:', error);
        setCards([]);
      } finally {
        setIsLoadingCards(false);
      }
    }

    fetchCardsByUnit();
  }, [slug, selectedUnitId]);

  useEffect(() => {
    setVisibleCount(100);
  }, [statusFilter, difficultyFilter, searchTerm]);

  // =========================================================================
  // 3. XỬ LÝ NÚT "ĐÃ BIẾT" (CẬP NHẬT TỨC THÌ THANH 4 MÀU & DANH SÁCH TỪ)
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

        // Cập nhật danh sách thẻ hiện tại
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

        // Cập nhật Thanh tiến độ 4 màu tổng (stats)
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

        // Cập nhật tiến độ trên ô Unit chứa từ đó
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

              const uTotal = u.total_cards > 0 ? u.total_cards : 1;
              nextUnits.push({
                ...u,
                unseen_count: uUnseen,
                mastered_count: uMastered,
                completion_percent: Math.round((uMastered / uTotal) * 100),
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
  // 4. LỌC DANH SÁCH UNITS THEO NHÓM CHỦ ĐỀ LỚN (CATEGORY TABS)
  // =========================================================================
  const filteredUnits = [];
  const categoryUnitCounts = { all: units.length };

  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const catId = u.category_id || 'mind_actions_grammar';
    categoryUnitCounts[catId] = (categoryUnitCounts[catId] || 0) + 1;

    if (selectedCategory === 'all' || catId === selectedCategory) {
      filteredUnits.push(u);
    }
  }

  // =========================================================================
  // 5. LỌC DANH SÁCH TỪ VỰNG THEO TRẠNG THÁI, ĐỘ KHÓ & TỪ KHÓA TÌM KIẾM
  // =========================================================================
  const filteredCards = [];
  const keyword = searchTerm.trim().toLowerCase();
  const diffCounts = { ALL: cards.length, EASY: 0, MEDIUM: 0, HARD: 0 };

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const cardDiff = String(card.difficulty_level || 'MEDIUM').toUpperCase();
    if (diffCounts[cardDiff] !== undefined) {
      diffCounts[cardDiff] += 1;
    }

    // Điều kiện 1: Khớp trạng thái nhớ
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

    // Điều kiện 2: Khớp Độ khó ('ALL' | 'EASY' | 'MEDIUM' | 'HARD')
    let matchesDifficulty = true;
    if (difficultyFilter !== 'ALL') {
      matchesDifficulty = cardDiff === difficultyFilter;
    }

    // Điều kiện 3: Khớp từ khóa tìm kiếm
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

    if (matchesStatus && matchesDifficulty && matchesSearch) {
      filteredCards.push(card);
    }
  }

  const displayedCards = filteredCards.slice(0, visibleCount);

  // Tính phần trăm cho Thanh tiến độ 4 màu
  const total = stats.total_cards > 0 ? stats.total_cards : 1;
  const masteredPct = Math.round((stats.mastered_count / total) * 100);
  const duePct = Math.round((stats.due_today_count / total) * 100);
  const learningPct = Math.round((stats.learning_count / total) * 100);
  const unseenPct = Math.max(0, 100 - masteredPct - duePct - learningPct);

  // Xác định tiêu đề của bài học (Unit) đang chọn
  let currentUnitLabel = `📚 Tất cả các từ trong bộ (${stats.total_cards} từ)`;
  if (selectedUnitId !== 'all') {
    for (let i = 0; i < units.length; i++) {
      if (units[i].id === selectedUnitId) {
        currentUnitLabel = units[i].title;
        break;
      }
    }
  }

  if (isLoadingOverview) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="h-56 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse p-8" />
        <div className="h-40 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse p-6" />
        <div className="h-96 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse p-6" />
      </div>
    );
  }

  if (errorMessage || !deck) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 space-y-4">
          <p className="text-red-600 dark:text-red-400 font-semibold">
            {errorMessage || 'Không tìm thấy bộ thẻ này'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
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
      {/* KHU VỰC 1: HEADER, THANH TIẾN ĐỘ 4 MÀU & HERO CARD "HỌC TIẾP NGAY"  */}
      {/* =================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Khung bên trái (7 cột): Thông tin Bộ thẻ & Thanh tiến độ 4 màu */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kho bộ thẻ</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  Cấp độ {deck.level_tag}
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {stats.total_cards} từ • {units.length} bài học
                </span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {deck.title_target || deck.title_vi}
              </h1>
              <p className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400 mt-1">
                {deck.title_vi}
              </p>
              {deck.description && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {deck.description}
                </p>
              )}
            </div>
          </div>

          {/* Thanh Tiến Độ Học Tập 4 Màu */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/70">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Tiến Độ Làm Chủ Bộ Thẻ (4 Trạng Thái)
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                Đã thuộc: {stats.mastered_count} / {stats.total_cards} từ ({masteredPct}%)
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex p-0.5 gap-0.5">
              {stats.mastered_count > 0 && (
                <div
                  style={{ width: `${Math.max(2, masteredPct)}%` }}
                  className="h-full bg-emerald-500 rounded-l-full transition-all duration-300"
                />
              )}
              {stats.due_today_count > 0 && (
                <div
                  style={{ width: `${Math.max(2, duePct)}%` }}
                  className="h-full bg-amber-500 transition-all duration-300"
                />
              )}
              {stats.learning_count > 0 && (
                <div
                  style={{ width: `${Math.max(2, learningPct)}%` }}
                  className="h-full bg-blue-500 transition-all duration-300"
                />
              )}
              {stats.unseen_count > 0 && (
                <div
                  style={{ width: `${Math.max(2, unseenPct)}%` }}
                  className="h-full bg-slate-300 dark:bg-slate-600 rounded-r-full transition-all duration-300"
                />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  ⚪ Chưa học
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {stats.unseen_count}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  🔵 Đang học
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-blue-700 dark:text-blue-300">
                  {stats.learning_count}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/50 flex items-center justify-between">
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  🟠 Cần ôn
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-300">
                  {stats.due_today_count}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  🟢 Đã thuộc
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                  {stats.mastered_count}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Khung bên phải (5 cột): HERO CARD "Học Tiếp Ngay" (1-Click Start) */}
        <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-6 sm:p-7 shadow-lg flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Gợi ý học tiếp thông minh</span>
            </div>

            {recommendedUnit ? (
              <>
                <h2 className="text-lg sm:text-xl font-extrabold leading-snug">
                  {recommendedUnit.title}
                </h2>
                <p className="text-xs sm:text-sm text-blue-100">
                  📌 {recommendedUnit.recommend_reason} • Nhóm:{' '}
                  <strong className="text-white">{recommendedUnit.category_name}</strong>
                </p>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-100">Tiến độ bài học này:</span>
                    <span className="font-bold text-amber-300">
                      {recommendedUnit.mastered_count} / {recommendedUnit.total_cards} từ (
                      {recommendedUnit.completion_percent || 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(100, recommendedUnit.completion_percent || 0)}%`,
                      }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-blue-100">
                Chọn một bài học bên dưới để bắt đầu khám phá từ vựng theo chủ đề.
              </p>
            )}
          </div>

          {recommendedUnit && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() =>
                  navigate(`/study/${slug}/flashcard?unitId=${recommendedUnit.id}`)
                }
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Học ngay bài này (Lật thẻ SRS)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(recommendedUnit.category_id || 'all');
                  setSelectedUnitId(recommendedUnit.id);
                  const vocabEl = document.getElementById('vocab-explorer-section');
                  if (vocabEl) vocabEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition"
              >
                Xem trước {recommendedUnit.total_cards} từ của bài này ↓
              </button>
            </div>
          )}
        </div>
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 2: LỘ TRÌNH CHỦ ĐỀ PHÂN NHÓM (GROUPED THEMATIC UNITS)       */}
      {/* =================================================================== */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Lộ Trình Học Theo Nhóm Chủ Đề (Thematic Units)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chọn 1 trong 5 Nhóm Chủ đề lớn bên dưới để lọc gọn danh sách bài học (15–20 từ/bài)
            </p>
          </div>

          {/* Nút Xem tất cả các từ trong bộ */}
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
            <span>📚 Xem tất cả {stats.total_cards} từ trong bộ</span>
          </button>
        </div>

        {/* Thanh lọc nhanh theo 5 Nhóm Chủ đề lớn (Category Filter Tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORY_TABS.map((cat) => {
            const count = categoryUnitCounts[cat.id] || 0;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count} bài
                </span>
              </button>
            );
          })}
        </div>

        {/* Lưới các thẻ Unit thuộc Nhóm Chủ đề đang chọn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredUnits.map((unit) => {
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
                className={`p-4 rounded-2xl text-left border transition flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-900/40 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      {slug === 'all-oxford-3000'
                        ? `[${unit.deck_level_tag}] Bài ${unit.unit_number}`
                        : `Bài ${unit.unit_number}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        uMasteredPct === 100
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {unit.mastered_count}/{unit.total_cards} từ ({uMasteredPct}%)
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {unit.title.replace(/^Unit \d+:\s*/, '')}
                  </p>
                </div>

                <div className="space-y-1.5">
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
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {unit.category_name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dải 5 nút Chế độ học áp dụng cho Bài học đang chọn */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/70 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              🎯 Chọn chế độ luyện tập cho:{' '}
              <strong className="text-blue-600 dark:text-blue-400">{currentUnitLabel}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {STUDY_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() =>
                  navigate(`/study/${slug}/${mode.id}?unitId=${selectedUnitId}`)
                }
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-900/60 hover:bg-blue-50/40 dark:hover:bg-slate-800 transition text-left flex items-center gap-3"
              >
                <span className="text-xl flex-shrink-0">{mode.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {mode.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {mode.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 3: DANH SÁCH TỪ VỰNG TRỰC QUAN (VOCABULARY EXPLORER)        */}
      {/* =================================================================== */}
      <section
        id="vocab-explorer-section"
        className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5"
      >
        {/* Hàng 1: Tiêu đề + Ô tìm kiếm + Nút chuyển đổi Grid / List */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Khám Phá Từ Vựng:{' '}
              <span className="text-blue-600 dark:text-blue-400">{currentUnitLabel}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Các từ trong mỗi bài đã được sắp xếp theo trình tự <strong>🟢 Dễ (có hình ảnh) → 🟡 Vừa → 🔴 Khó</strong> để bạn dễ tiếp thu nhất
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Ô tìm kiếm từ vựng nhanh */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm từ tiếng Anh, nghĩa Việt..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Nút chuyển đổi kiểu xem Dạng Bảng (List) <-> Dạng Thẻ Lưới (Grid) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Xem dạng danh sách gọn"
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Danh sách</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Xem dạng thẻ lưới có ảnh lớn"
                className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Thẻ lưới</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hàng 2: Thanh lọc Trạng thái nhớ & Thanh lọc Độ khó */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-y border-slate-100 dark:border-slate-700 py-3.5">
          {/* Lọc theo Trạng thái nhớ */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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

          {/* Lọc theo Độ khó (🟢 Dễ | 🟡 Trung bình | 🔴 Khó) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Độ khó:
            </span>
            {DIFFICULTY_TABS.map((dTab) => {
              const active = difficultyFilter === dTab.id;
              const count = diffCounts[dTab.id] || 0;
              return (
                <button
                  key={dTab.id}
                  type="button"
                  onClick={() => setDifficultyFilter(dTab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    active
                      ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {dTab.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Hiển thị danh sách từ vựng */}
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
        ) : viewMode === 'grid' ? (
          /* ================= CHẾ ĐỘ XEM 1: DẠNG THẺ LƯỚI (CARD GRID) ================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedCards.map((card, index) => {
              const isKnown = card.status === 'MASTERED' || card.status === 'IGNORED';
              const diffBadge = getDifficultyBadge(card.difficulty_level);

              return (
                <div
                  key={`${card.deck_card_id || card.vocab_id}-${index}`}
                  className={`p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                    isKnown
                      ? 'bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Ảnh minh họa lớn nếu có */}
                    <VocabThumbnail imageUrl={card.image_url} word={card.word} large={true} />

                    {/* Hàng trên: Số thứ tự + Badge Độ khó + Loa */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs">
                          #{index + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${diffBadge.className}`}
                        >
                          {diffBadge.text}
                        </span>
                        {card.part_of_speech && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 italic">
                            {card.part_of_speech}
                          </span>
                        )}
                      </div>

                      <AudioButton
                        text={card.word}
                        lang={card.language || 'EN'}
                        audioUrl={card.audio_word_url}
                        size="sm"
                      />
                    </div>

                    {/* Từ vựng & Phiên âm IPA */}
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {card.word}
                      </h3>
                      {card.phonetic_primary && (
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {card.phonetic_primary}
                        </p>
                      )}
                    </div>

                    {/* Nghĩa tiếng Việt */}
                    <p className="text-base font-bold text-blue-700 dark:text-blue-300">
                      {card.meaning_vi}
                    </p>

                    {/* Câu ví dụ */}
                    {card.example_sentence && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 border-l-2 border-slate-300 dark:border-slate-600 pl-2.5">
                        <p className="italic">&ldquo;{card.example_sentence}&rdquo;</p>
                        {card.example_meaning_vi && (
                          <p className="text-slate-500 dark:text-slate-400">
                            → {card.example_meaning_vi}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Nút Đánh dấu Đã biết */}
                  <button
                    type="button"
                    disabled={togglingVocabId === card.vocab_id}
                    onClick={() => handleToggleMarkKnown(card)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      isKnown
                        ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:text-emerald-600'
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
              );
            })}
          </div>
        ) : (
          /* ================= CHẾ ĐỘ XEM 2: DẠNG DANH SÁCH GỌN (COMPACT LIST) ================= */
          <div className="space-y-3">
            {displayedCards.map((card, index) => {
              const isKnown = card.status === 'MASTERED' || card.status === 'IGNORED';
              const diffBadge = getDifficultyBadge(card.difficulty_level);

              return (
                <div
                  key={`${card.deck_card_id || card.vocab_id}-${index}`}
                  className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isKnown
                      ? 'bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-200/80 dark:border-emerald-800/40'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>

                    <VocabThumbnail imageUrl={card.image_url} word={card.word} />

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
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

                        {/* Badge Độ khó */}
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${diffBadge.className}`}
                        >
                          {diffBadge.text}
                        </span>

                        <AudioButton
                          text={card.word}
                          lang={card.language || 'EN'}
                          audioUrl={card.audio_word_url}
                          size="sm"
                        />
                      </div>

                      <p className="text-sm sm:text-base font-bold text-blue-700 dark:text-blue-300">
                        {card.meaning_vi}
                      </p>

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
          </div>
        )}

        {/* Nút Xem thêm 100 từ khi danh sách lớn */}
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
      </section>
    </div>
  );
}
