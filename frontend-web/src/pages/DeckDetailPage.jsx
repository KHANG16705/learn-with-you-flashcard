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
  Table2,
  Filter,
  Zap,
  Keyboard,
  Repeat,
  Target,
  Home,
  Compass,
  Briefcase,
  Leaf,
  MessageSquare,
  Clock,
  Flame,
} from 'lucide-react';
import axiosClient from '../api/axiosClient.js';
import AudioButton from '../components/common/AudioButton.jsx';

// 5 Nhóm Chủ đề lớn (Macro Categories) ngắn gọn, chuẩn sư phạm
const CATEGORY_TABS = [
  { id: 'all', label: 'Tất cả chủ đề', Icon: Layers },
  { id: 'life_people', label: 'Đời sống & Gia đình', Icon: Home },
  { id: 'travel_leisure', label: 'Du lịch & Giải trí', Icon: Compass },
  { id: 'work_education', label: 'Học tập & Công việc', Icon: Briefcase },
  { id: 'nature_science_society', label: 'Thiên nhiên & Xã hội', Icon: Leaf },
  { id: 'mind_actions_grammar', label: 'Giao tiếp & Ngữ pháp', Icon: MessageSquare },
];

// 5 Chế độ luyện tập chủ động với Icon Vector Lucide
const STUDY_MODES = [
  {
    id: 'flashcard',
    Icon: Layers,
    title: 'Flashcard 3D',
    desc: 'Lật thẻ & chấm mức nhớ SRS',
    primary: true,
  },
  {
    id: 'quiz',
    Icon: Zap,
    title: 'Trắc nghiệm',
    desc: 'Phản xạ chọn nghĩa nhanh',
    primary: false,
  },
  {
    id: 'typing',
    Icon: Keyboard,
    title: 'Nghe & Gõ từ',
    desc: 'Luyện nghe và gõ chính tả',
    primary: false,
  },
  {
    id: 'combo',
    Icon: Repeat,
    title: 'Học Combo 4 bước',
    desc: 'Làm quen → Quiz → Gõ từ',
    primary: false,
  },
  {
    id: 'weak_words',
    Icon: Target,
    title: 'Ôn từ hay quên',
    desc: 'Xoáy sâu các từ hay nhầm',
    primary: false,
  },
];

// Bộ lọc Trạng thái nhớ
const STATUS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'unseen', label: 'Chưa học' },
  { id: 'due', label: 'Cần ôn' },
  { id: 'mastered', label: 'Đã thuộc' },
  { id: 'weak', label: 'Hay quên' },
];

// Bộ lọc Độ khó từ vựng
const DIFFICULTY_TABS = [
  { id: 'ALL', label: 'Mọi độ khó' },
  { id: 'EASY', label: 'Dễ' },
  { id: 'MEDIUM', label: 'Vừa' },
  { id: 'HARD', label: 'Khó' },
];

/**
 * Hàm phụ: Làm sạch tên bài học để hiển thị ngắn gọn (VD: "Gia đình & Người thân")
 */
function cleanUnitTitle(rawTitle = '') {
  return String(rawTitle)
    .replace(/^Unit\s*\d+\s*:\s*/i, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .trim();
}

/**
 * Hàm phụ: Trả về màu sắc cho nhãn Từ loại (Part of Speech) giống hệt Parroto WordListTable
 */
function getPosBadgeStyle(pos = '') {
  const normalized = String(pos).toLowerCase();
  if (normalized.includes('noun') || normalized === 'n') {
    return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
  }
  if (normalized.includes('verb') || normalized === 'v') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
  }
  if (normalized.includes('adj')) {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  }
  if (normalized.includes('adv')) {
    return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
}

/**
 * Hàm phụ: Trả về nhãn và màu sắc cho Badge Độ khó ('EASY' | 'MEDIUM' | 'HARD')
 */
function getDifficultyBadge(difficultyLevel) {
  const level = String(difficultyLevel || 'MEDIUM').toUpperCase();
  if (level === 'EASY') {
    return {
      text: 'Dễ',
      className:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    };
  }
  if (level === 'HARD') {
    return {
      text: 'Khó',
      className:
        'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    };
  }
  return {
    text: 'Vừa',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  };
}

/**
 * Hàm phụ: Tô sáng từ vựng mục tiêu màu xanh lá trong câu ví dụ (giống hàm highlightWord của Parroto)
 */
function renderHighlightedSentence(sentence = '', targetWord = '') {
  if (!sentence) {
    return null;
  }
  const cleanTarget = String(targetWord || '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
  if (!cleanTarget) {
    return sentence;
  }

  try {
    const escaped = cleanTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(\\b${escaped}[a-zA-Z]*\\b)`, 'gi');
    const parts = String(sentence).split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase().startsWith(cleanTarget.toLowerCase())) {
        return (
          <span
            key={index}
            className="text-emerald-600 dark:text-emerald-400 font-extrabold underline decoration-emerald-400/70 underline-offset-2"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  } catch {
    return sentence;
  }
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
      <div className="w-full h-40 rounded-duo overflow-hidden bg-[#f0f4ff] dark:bg-slate-800 border-2 border-[#e2e8f0] dark:border-slate-700">
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
    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f0f4ff] dark:bg-slate-800 border-2 border-[#e2e8f0] dark:border-slate-700 shrink-0">
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

  // Trạng thái lưu thông tin Bộ thẻ, Thống kê 4 trạng thái, Unit gợi ý và danh sách Units
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

  // Nhóm chủ đề lớn đang chọn ('all' | 'life_people' | ...)
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Tìm kiếm nhanh tên bài học ở thanh bên trái
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  // Bài học (Unit) đang chọn ('all' hoặc id của Unit)
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  // Danh sách từ vựng & bộ lọc trong bảng từ vựng
  const [cards, setCards] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  // Chế độ hiển thị: 'table' (Bảng từ vựng chuẩn Parroto) hoặc 'grid' (Thẻ lưới có ảnh lớn)
  const [viewMode, setViewMode] = useState('table');
  const [visibleCount, setVisibleCount] = useState(100);

  // Trạng thái tải dữ liệu
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [togglingVocabId, setTogglingVocabId] = useState(null);

  // =========================================================================
  // 1. GỌI API LẤY TỔNG QUAN BỘ THẺ & DANH SÁCH BÀI HỌC CHỦ ĐỀ
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
          setSelectedCategory('all');

          if (slug === 'all-oxford-3000') {
            setSelectedUnitId('all');
          } else if (recUnit) {
            setSelectedUnitId(recUnit.id);
          } else {
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
  // 2. GỌI API LẤY DANH SÁCH TỪ VỰNG KHI ĐỔI BÀI HỌC (UNIT) ĐANG CHỌN
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
  // 3. XỬ LÝ NÚT "ĐÃ BIẾT" (CẬP NHẬT TỨC THÌ TIẾN ĐỘ BÀI HỌC & BẢNG TỪ)
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
    } finally {
      setTogglingVocabId(null);
    }
  }

  // =========================================================================
  // 4. LỌC DANH SÁCH BÀI HỌC Ở SIDEBAR THEO NHÓM CHỦ ĐỀ & TỪ KHÓA
  // =========================================================================
  const filteredUnits = [];
  const categoryUnitCounts = { all: units.length };
  const unitKeyword = unitSearchTerm.trim().toLowerCase();

  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const catId = u.category_id || 'mind_actions_grammar';
    categoryUnitCounts[catId] = (categoryUnitCounts[catId] || 0) + 1;

    const matchesCategory = selectedCategory === 'all' || catId === selectedCategory;
    const cleanTitle = cleanUnitTitle(u.title).toLowerCase();
    const matchesUnitKeyword =
      unitKeyword === '' ||
      cleanTitle.includes(unitKeyword) ||
      `bài ${u.unit_number}`.includes(unitKeyword);

    if (matchesCategory && matchesUnitKeyword) {
      filteredUnits.push(u);
    }
  }

  // =========================================================================
  // 5. LỌC DANH SÁCH TỪ VỰNG TRONG BẢNG THEO TRẠNG THÁI, ĐỘ KHÓ & TỪ KHÓA
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

    let matchesDifficulty = true;
    if (difficultyFilter !== 'ALL') {
      matchesDifficulty = cardDiff === difficultyFilter;
    }

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

  // Tìm thông tin của Bài học (Unit) đang được chọn để hiển thị lên Khung Tổng Quan bên phải
  let activeUnitObj = null;
  if (selectedUnitId !== 'all') {
    for (let i = 0; i < units.length; i++) {
      if (units[i].id === selectedUnitId) {
        activeUnitObj = units[i];
        break;
      }
    }
  }

  const activeStats = activeUnitObj
    ? {
        total_cards: activeUnitObj.total_cards,
        unseen_count: activeUnitObj.unseen_count,
        learning_count: activeUnitObj.learning_count,
        due_today_count: activeUnitObj.due_today_count,
        mastered_count: activeUnitObj.mastered_count,
      }
    : stats;

  const activeTotal = activeStats.total_cards > 0 ? activeStats.total_cards : 1;
  const activeMasteredPct = Math.round((activeStats.mastered_count / activeTotal) * 100);
  const activeDuePct = Math.round((activeStats.due_today_count / activeTotal) * 100);
  const activeLearningPct = Math.round((activeStats.learning_count / activeTotal) * 100);

  const deckTotal = stats.total_cards > 0 ? stats.total_cards : 1;
  const deckMasteredPct = Math.round((stats.mastered_count / deckTotal) * 100);

  if (isLoadingOverview) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="h-24 rounded-duo-lg bg-white dark:bg-slate-900 border-2 border-[#e2e8f0] dark:border-slate-800 animate-pulse p-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-[520px] rounded-duo-lg bg-white dark:bg-slate-900 border-2 border-[#e2e8f0] dark:border-slate-800 animate-pulse" />
          <div className="lg:col-span-8 h-[520px] rounded-duo-lg bg-white dark:bg-slate-900 border-2 border-[#e2e8f0] dark:border-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (errorMessage || !deck) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="rounded-duo-lg border-2 border-red-200 bg-red-50 p-8 space-y-4 shadow-duo">
          <p className="text-red-700 font-extrabold">{errorMessage || 'Không tìm thấy bộ thẻ này'}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-duo inline-flex items-center gap-2 px-5 py-2.5 rounded-duo bg-[#262c57] text-white text-xs font-extrabold uppercase border-2 border-[#161c41] shadow-duo-primary cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Trang chủ</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* =================================================================== */}
      {/* KHU VỰC 1: THANH ĐIỀU HƯỚNG ĐẦU TRANG & BỘ LỌC 5 NHÓM CHỦ ĐỀ LỚN    */}
      {/* =================================================================== */}
      <section className="rounded-duo-lg border-2 border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-duo space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Cột trái: Nút Quay lại + Tên Bộ thẻ */}
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-duo px-3.5 py-2 rounded-duo border-2 border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#262c57] dark:text-slate-200 font-extrabold text-xs flex items-center gap-1.5 shadow-duo-sm shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#262c57] text-white">
                  CEFR {deck.level_tag}
                </span>
                <span className="text-xs font-bold text-[#4a5568] dark:text-slate-400">
                  {stats.total_cards} từ vựng · {units.length} bài học chủ đề
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-[#1a1a2e] dark:text-white mt-0.5">
                {deck.title_vi}
              </h1>
            </div>
          </div>

          {/* Cột phải: Tiến độ tổng toàn bộ thẻ + Nút học tiếp bài gợi ý */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3.5 py-2 rounded-duo bg-[#f0f4ff] dark:bg-slate-800 border-2 border-[#c7d2e0] dark:border-slate-700 text-xs">
              <span className="font-bold text-[#4a5568] dark:text-slate-300">
                Tổng tiến độ bộ:{' '}
              </span>
              <strong className="font-extrabold text-[#262c57] dark:text-white">
                {stats.mastered_count}/{stats.total_cards} từ ({deckMasteredPct}%)
              </strong>
            </div>

            {recommendedUnit && selectedUnitId !== recommendedUnit.id && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedUnitId(recommendedUnit.id);
                }}
                className="btn-duo px-3.5 py-2 rounded-duo bg-amber-400 text-slate-950 font-extrabold text-xs border-2 border-amber-600 shadow-[0_2px_0_0_#b45309] flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Gợi ý: Bài {recommendedUnit.unit_number} · {cleanUnitTitle(recommendedUnit.title)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Dải nút lọc 5 Nhóm Chủ đề lớn (Macro Category Filter Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar pt-1 border-t border-[#e2e8f0] dark:border-slate-800">
          {CATEGORY_TABS.map((cat) => {
            const count = categoryUnitCounts[cat.id] || 0;
            const isActive = selectedCategory === cat.id;
            const IconComponent = cat.Icon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn-duo px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap border-2 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#262c57] text-white border-[#161c41] shadow-[0_2px_0_0_#161c41]'
                    : 'bg-white dark:bg-slate-800 text-[#4a5568] dark:text-slate-300 border-[#e2e8f0] dark:border-slate-700 shadow-duo-sm hover:border-[#3c94d4] hover:text-[#262c57]'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#f0f4ff] dark:bg-slate-700 text-[#262c57] dark:text-slate-200'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* =================================================================== */}
      {/* KHU VỰC 2: BỐ CỤC 2 CỘT CHUẨN PARROTO (SIDEBAR BÀI HỌC + NỘI DUNG)  */}
      {/* =================================================================== */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ================================================================= */}
        {/* CỘT TRÁI (STICKY SIDEBAR): DANH SÁCH BÀI HỌC THEO CHỦ ĐỀ NGẮN GỌN */}
        {/* ================================================================= */}
        <aside className="w-full lg:w-[320px] shrink-0 rounded-duo-lg border-2 border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-duo lg:sticky lg:top-20 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#262c57] dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#3c94d4]" />
              <span>Danh sách bài học ({filteredUnits.length})</span>
            </h2>
          </div>

          {/* Ô tìm nhanh tên chủ đề trong Sidebar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#4a5568] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={unitSearchTerm}
              onChange={(e) => setUnitSearchTerm(e.target.value)}
              placeholder="Tìm chủ đề (VD: Gia đình, Đồ ăn...)"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#f8fafc] dark:bg-slate-800 border-2 border-[#e2e8f0] dark:border-slate-700 text-xs font-semibold text-[#1a1a2e] dark:text-white focus:outline-none focus:border-[#3c94d4]"
            />
          </div>

          {/* Nút Xem tất cả các từ trong bộ */}
          <button
            type="button"
            onClick={() => setSelectedUnitId('all')}
            className={`btn-duo w-full p-3 rounded-duo text-left border-2 flex items-center justify-between gap-2 cursor-pointer ${
              selectedUnitId === 'all'
                ? 'bg-[#262c57] text-white border-[#161c41] shadow-[0_2px_0_0_#161c41]'
                : 'bg-[#f0f4ff] dark:bg-slate-800 text-[#262c57] dark:text-blue-300 border-[#c7d2e0] dark:border-slate-700 shadow-duo-sm hover:border-[#3c94d4]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="text-xs font-extrabold truncate">
                Tất cả từ vựng trong bộ
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                selectedUnitId === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-white dark:bg-slate-900 text-[#262c57] dark:text-slate-200'
              }`}
            >
              {stats.total_cards} từ
            </span>
          </button>

          {/* Danh sách cuộn các bài học (Unit Buttons chuẩn Parroto) */}
          <div className="max-h-[360px] lg:max-h-[calc(100vh-310px)] overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {filteredUnits.map((unit) => {
              const isSelected = selectedUnitId === unit.id;
              const uTotal = unit.total_cards > 0 ? unit.total_cards : 1;
              const uMasteredPct = Math.round((unit.mastered_count / uTotal) * 100);
              const isCompleted = uMasteredPct === 100;
              const isInProgress =
                !isCompleted &&
                unit.mastered_count + unit.learning_count + unit.due_today_count > 0;

              // 4 trạng thái màu sắc chuẩn thiết kế Parroto
              let cardStyle =
                'bg-white dark:bg-slate-800/80 hover:bg-[#f0f4ff] dark:hover:bg-slate-800 border-[#e2e8f0] dark:border-slate-700 text-[#1a1a2e] dark:text-slate-100 shadow-duo-sm';
              let badgeStyle =
                'bg-[#f0f4ff] dark:bg-slate-700 text-[#4a5568] dark:text-slate-300';
              let subTextStyle = 'text-[#4a5568] dark:text-slate-400';

              if (isSelected) {
                cardStyle =
                  'bg-[#262c57] text-white border-[#161c41] shadow-[0_2px_0_0_#161c41]';
                badgeStyle = 'bg-white/20 text-white';
                subTextStyle = 'text-blue-200';
              } else if (isCompleted) {
                cardStyle =
                  'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 shadow-[0_2px_0_0_rgb(167,243,208)]';
                badgeStyle = 'bg-emerald-200/80 text-emerald-900';
                subTextStyle = 'text-emerald-700 dark:text-emerald-400';
              } else if (isInProgress) {
                cardStyle =
                  'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 shadow-[0_2px_0_0_rgb(253,230,138)]';
                badgeStyle = 'bg-amber-200/80 text-amber-900';
                subTextStyle = 'text-amber-700 dark:text-amber-400';
              }

              const shortTitle = cleanUnitTitle(unit.title);

              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedUnitId(unit.id)}
                  className={`btn-duo w-full p-3 rounded-duo text-left border-2 flex flex-col gap-1.5 cursor-pointer ${cardStyle}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-extrabold uppercase ${subTextStyle}`}>
                      {slug === 'all-oxford-3000'
                        ? `${unit.deck_level_tag} · Bài ${unit.unit_number}`
                        : `Bài ${unit.unit_number}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeStyle}`}>
                      {unit.mastered_count}/{unit.total_cards}
                    </span>
                  </div>

                  {/* Tên chủ đề ngắn gọn 2-3 từ */}
                  <p className="text-xs sm:text-sm font-extrabold leading-snug line-clamp-1">
                    {shortTitle}
                  </p>

                  {/* Thanh tiến độ mini */}
                  <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div
                      style={{ width: `${uMasteredPct}%` }}
                      className={`h-full rounded-full ${
                        isSelected ? 'bg-[#22c55e]' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ================================================================= */}
        {/* CỘT PHẢI (MAIN CONTENT): THỐNG KÊ BÀI HỌC, 5 CHẾ ĐỘ & BẢNG TỪ     */}
        {/* ================================================================= */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          {/* --------------------------------------------------------------- */}
          {/* KHỐI 1: THÔNG TIN BÀI HỌC ĐANG CHỌN & 5 CHẾ ĐỘ LUYỆN TẬP        */}
          {/* --------------------------------------------------------------- */}
          <section className="rounded-duo-lg border-2 border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-duo space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#f0f4ff] dark:bg-slate-800 text-[#3c94d4] border border-[#c7d2e0] dark:border-slate-700">
                    {activeUnitObj ? activeUnitObj.category_name : 'Trọn bộ từ vựng'}
                  </span>
                  {activeUnitObj && (
                    <span className="text-xs font-extrabold text-[#4a5568] dark:text-slate-400">
                      Bài {activeUnitObj.unit_number} · {activeStats.total_cards} từ vựng
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1a1a2e] dark:text-white mt-1">
                  {activeUnitObj
                    ? `Bài ${activeUnitObj.unit_number}: ${cleanUnitTitle(activeUnitObj.title)}`
                    : `Tất cả từ vựng (${stats.total_cards} từ)`}
                </h2>
              </div>

              {/* Nút Bắt đầu học nhanh bài đang chọn */}
              <button
                type="button"
                onClick={() =>
                  navigate(`/study/${slug}/flashcard?unitId=${selectedUnitId}`)
                }
                className="btn-duo px-5 py-3 rounded-duo bg-[#22c55e] text-white font-extrabold text-xs uppercase tracking-wide border-2 border-[#15803d] shadow-duo-success flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Học ngay bài này</span>
              </button>
            </div>

            {/* Thanh tiến độ & 4 Hộp Trạng Thái chuẩn thiết kế Parroto */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-[#4a5568] dark:text-slate-300">
                  Tiến độ hoàn thành bài học
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Đã thuộc {activeStats.mastered_count} / {activeStats.total_cards} từ (
                  {activeMasteredPct}%)
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-[#f0f4ff] dark:bg-slate-800 border-2 border-[#e2e8f0] dark:border-slate-700 overflow-hidden flex">
                {activeStats.mastered_count > 0 && (
                  <div
                    style={{ width: `${Math.max(2, activeMasteredPct)}%` }}
                    className="h-full bg-[#22c55e] transition-all duration-300"
                  />
                )}
                {activeStats.due_today_count > 0 && (
                  <div
                    style={{ width: `${Math.max(2, activeDuePct)}%` }}
                    className="h-full bg-amber-500 transition-all duration-300"
                  />
                )}
                {activeStats.learning_count > 0 && (
                  <div
                    style={{ width: `${Math.max(2, activeLearningPct)}%` }}
                    className="h-full bg-[#3c94d4] transition-all duration-300"
                  />
                )}
              </div>

              {/* 4 Hộp chỉ số màu chuẩn Parroto */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-duo border-2 border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Chưa học
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {activeStats.unseen_count}
                  </span>
                </div>

                <div className="p-3 rounded-duo border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      Đang học
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">
                    {activeStats.learning_count}
                  </span>
                </div>

                <div className="p-3 rounded-duo border-2 border-sky-200 dark:border-sky-900/50 bg-sky-50/80 dark:bg-sky-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#3c94d4]" />
                    <span className="text-xs font-bold text-sky-800 dark:text-sky-300">
                      Cần ôn tập
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-[#3c94d4]">
                    {activeStats.due_today_count}
                  </span>
                </div>

                <div className="p-3 rounded-duo border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 dark:bg-emerald-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Đã thuộc
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                    {activeStats.mastered_count}
                  </span>
                </div>
              </div>
            </div>

            {/* 5 Chế độ luyện tập cho Bài học đang chọn */}
            <div className="pt-3 border-t-2 border-[#e2e8f0] dark:border-slate-800 space-y-2.5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#4a5568] dark:text-slate-400">
                Chọn chế độ luyện tập:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
                {STUDY_MODES.map((mode) => {
                  const ModeIcon = mode.Icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        navigate(`/study/${slug}/${mode.id}?unitId=${selectedUnitId}`)
                      }
                      className={`btn-duo p-3 rounded-duo border-2 text-left flex items-center gap-2.5 cursor-pointer ${
                        mode.primary
                          ? 'bg-[#262c57] text-white border-[#161c41] shadow-[0_2px_0_0_#161c41]'
                          : 'bg-white dark:bg-slate-800 text-[#1a1a2e] dark:text-white border-[#e2e8f0] dark:border-slate-700 shadow-duo-sm hover:border-[#3c94d4]'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          mode.primary
                            ? 'bg-white/15 text-white'
                            : 'bg-[#f0f4ff] dark:bg-slate-700 text-[#262c57] dark:text-blue-300'
                        }`}
                      >
                        <ModeIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold truncate">{mode.title}</p>
                        <p
                          className={`text-[10px] truncate ${
                            mode.primary
                              ? 'text-blue-200'
                              : 'text-[#4a5568] dark:text-slate-400'
                          }`}
                        >
                          {mode.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* --------------------------------------------------------------- */}
          {/* KHỐI 2: BẢNG TỪ VỰNG CHUẨN PARROTO (WORDLISTTABLE & CARD GRID)  */}
          {/* --------------------------------------------------------------- */}
          <section
            id="vocab-explorer-section"
            className="rounded-duo-lg border-2 border-[#e2e8f0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-duo overflow-hidden"
          >
            {/* Thanh công cụ tìm kiếm & lọc trên đầu bảng */}
            <div className="p-4 sm:p-5 border-b-2 border-[#e2e8f0] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/60 space-y-3.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#1a1a2e] dark:text-white">
                    Danh sách từ vựng ({filteredCards.length} từ)
                  </h3>
                  <p className="text-xs text-[#4a5568] dark:text-slate-400">
                    Sắp xếp từ Dễ → Khó kèm phát âm chuẩn US/UK và câu ví dụ tô sáng ngữ cảnh
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Ô tìm kiếm từ vựng */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-[#4a5568] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm từ hoặc nghĩa tiếng Việt..."
                      className="w-full pl-9 pr-3 py-2 rounded-duo bg-white dark:bg-slate-800 border-2 border-[#e2e8f0] dark:border-slate-700 text-xs font-semibold text-[#1a1a2e] dark:text-white focus:outline-none focus:border-[#3c94d4]"
                    />
                  </div>

                  {/* Công tắc chuyển đổi Bảng từ vựng (Table) <-> Thẻ lưới (Grid) */}
                  <div className="flex items-center bg-[#f0f4ff] dark:bg-slate-800 p-1 rounded-duo border-2 border-[#e2e8f0] dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-[#262c57] text-white shadow-xs'
                          : 'text-[#4a5568] dark:text-slate-300'
                      }`}
                    >
                      <Table2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Bảng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-[#262c57] text-white shadow-xs'
                          : 'text-[#4a5568] dark:text-slate-300'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Thẻ ảnh</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hàng lọc Trạng thái & Độ khó */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {STATUS_TABS.map((tab) => {
                    const active = statusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id)}
                        className={`btn-duo px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 cursor-pointer ${
                          active
                            ? 'bg-[#262c57] text-white border-[#161c41]'
                            : 'bg-white dark:bg-slate-800 text-[#4a5568] dark:text-slate-300 border-[#e2e8f0] dark:border-slate-700 hover:border-[#3c94d4]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold text-[#4a5568] dark:text-slate-400 flex items-center gap-1 mr-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Độ khó:</span>
                  </span>
                  {DIFFICULTY_TABS.map((dTab) => {
                    const active = difficultyFilter === dTab.id;
                    const count = diffCounts[dTab.id] || 0;
                    return (
                      <button
                        key={dTab.id}
                        type="button"
                        onClick={() => setDifficultyFilter(dTab.id)}
                        className={`btn-duo px-2.5 py-1.5 rounded-xl text-xs font-extrabold border-2 cursor-pointer ${
                          active
                            ? 'bg-[#3c94d4] text-white border-[#1e64a5]'
                            : 'bg-white dark:bg-slate-800 text-[#4a5568] dark:text-slate-300 border-[#e2e8f0] dark:border-slate-700 hover:border-[#3c94d4]'
                        }`}
                      >
                        {dTab.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Nội dung Bảng từ vựng hoặc Lưới thẻ */}
            {isLoadingCards ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="h-16 rounded-duo bg-slate-100 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-bold text-[#4a5568] dark:text-slate-400">
                  Không có từ vựng nào khớp với bộ lọc hiện tại.
                </p>
              </div>
            ) : viewMode === 'table' ? (
              /* ================= CHẾ ĐỘ 1: BẢNG TỪ VỰNG CHUẨN PARROTO (WORDLISTTABLE) ================= */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f0f4ff] dark:bg-slate-800 border-b-2 border-[#e2e8f0] dark:border-slate-700 text-[11px] font-extrabold uppercase tracking-wider text-[#262c57] dark:text-slate-200">
                      <th className="py-3.5 pl-4 pr-3">Từ vựng</th>
                      <th className="py-3.5 px-3">Phát âm</th>
                      <th className="py-3.5 px-3">Từ loại</th>
                      <th className="py-3.5 px-3">Nghĩa tiếng Việt</th>
                      <th className="py-3.5 px-3 min-w-[260px]">Ví dụ ngữ cảnh</th>
                      <th className="py-3.5 pl-3 pr-4 text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-[#e2e8f0] dark:divide-slate-800 text-sm">
                    {displayedCards.map((card, index) => {
                      const isKnown =
                        card.status === 'MASTERED' || card.status === 'IGNORED';
                      const diffBadge = getDifficultyBadge(card.difficulty_level);

                      return (
                        <tr
                          key={`${card.deck_card_id || card.vocab_id}-${index}`}
                          className={`transition-colors ${
                            isKnown
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/10 hover:bg-emerald-50/70'
                              : 'hover:bg-[#f0f4ff]/60 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          {/* Cột 1: Từ vựng + IPA + Ảnh thu nhỏ nếu có */}
                          <td className="py-3.5 pl-4 pr-3 align-top">
                            <div className="flex items-center gap-3">
                              <VocabThumbnail
                                imageUrl={card.image_url}
                                word={card.word}
                              />
                              <div>
                                <p className="font-extrabold text-base text-[#1a1a2e] dark:text-white">
                                  {card.word}
                                </p>
                                {card.phonetic_primary && (
                                  <p className="text-xs font-mono text-[#4a5568] dark:text-slate-400 mt-0.5">
                                    {card.phonetic_primary}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Cột 2: 2 Nút Loa US & UK chuẩn Parroto */}
                          <td className="py-3.5 px-3 align-top">
                            <div className="flex items-center gap-1.5">
                              <AudioButton
                                text={card.word}
                                lang={card.language || 'EN'}
                                accent="US"
                                audioUrl={card.audio_word_url}
                                size="sm"
                                label="US"
                              />
                              {card.language !== 'ZH' && (
                                <AudioButton
                                  text={card.word}
                                  lang="EN"
                                  accent="UK"
                                  size="sm"
                                  label="UK"
                                />
                              )}
                            </div>
                          </td>

                          {/* Cột 3: Nhãn Từ loại & Độ khó */}
                          <td className="py-3.5 px-3 align-top">
                            <div className="flex flex-col items-start gap-1">
                              {card.part_of_speech && (
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border-2 ${getPosBadgeStyle(
                                    card.part_of_speech
                                  )}`}
                                >
                                  {card.part_of_speech}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${diffBadge.className}`}
                              >
                                {diffBadge.text}
                              </span>
                            </div>
                          </td>

                          {/* Cột 4: Nghĩa tiếng Việt nổi bật màu xanh Parroto */}
                          <td className="py-3.5 px-3 align-top">
                            <p className="font-extrabold text-sm text-[#3c94d4] dark:text-sky-400">
                              {card.meaning_vi}
                            </p>
                          </td>

                          {/* Cột 5: Câu ví dụ có tô sáng từ vựng mục tiêu màu xanh lá */}
                          <td className="py-3.5 px-3 align-top">
                            {card.example_sentence ? (
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm text-[#1a1a2e] dark:text-slate-200 leading-relaxed">
                                  &ldquo;
                                  {renderHighlightedSentence(
                                    card.example_sentence,
                                    card.word
                                  )}
                                  &rdquo;
                                </p>
                                {card.example_meaning_vi && (
                                  <p className="text-xs text-[#4a5568] dark:text-slate-400">
                                    → {card.example_meaning_vi}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>

                          {/* Cột 6: Nút Đánh dấu Đã biết */}
                          <td className="py-3.5 pl-3 pr-4 align-top text-right">
                            <button
                              type="button"
                              disabled={togglingVocabId === card.vocab_id}
                              onClick={() => handleToggleMarkKnown(card)}
                              className={`btn-duo inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 whitespace-nowrap cursor-pointer ${
                                isKnown
                                  ? 'bg-[#22c55e] text-white border-[#15803d] shadow-[0_2px_0_0_#15803d]'
                                  : 'bg-white dark:bg-slate-800 text-[#262c57] dark:text-slate-200 border-[#e2e8f0] dark:border-slate-700 shadow-duo-sm hover:border-[#22c55e] hover:text-[#15803d]'
                              }`}
                            >
                              {isKnown ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Đã thuộc</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Đã biết</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ================= CHẾ ĐỘ 2: LƯỚI THẺ HÌNH ẢNH (VISUAL CARD GRID) ================= */
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedCards.map((card, index) => {
                  const isKnown =
                    card.status === 'MASTERED' || card.status === 'IGNORED';
                  const diffBadge = getDifficultyBadge(card.difficulty_level);

                  return (
                    <div
                      key={`${card.deck_card_id || card.vocab_id}-${index}`}
                      className={`rounded-duo border-2 p-4 flex flex-col justify-between gap-4 shadow-duo ${
                        isKnown
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-800/70 border-[#e2e8f0] dark:border-slate-700'
                      }`}
                    >
                      <div className="space-y-3">
                        <VocabThumbnail
                          imageUrl={card.image_url}
                          word={card.word}
                          large={true}
                        />

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {card.part_of_speech && (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border-2 ${getPosBadgeStyle(
                                  card.part_of_speech
                                )}`}
                              >
                                {card.part_of_speech}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${diffBadge.className}`}
                            >
                              {diffBadge.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <AudioButton
                              text={card.word}
                              lang={card.language || 'EN'}
                              accent="US"
                              audioUrl={card.audio_word_url}
                              size="sm"
                              label="US"
                            />
                            {card.language !== 'ZH' && (
                              <AudioButton
                                text={card.word}
                                lang="EN"
                                accent="UK"
                                size="sm"
                                label="UK"
                              />
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xl font-extrabold text-[#1a1a2e] dark:text-white">
                            {card.word}
                          </h4>
                          {card.phonetic_primary && (
                            <p className="text-xs font-mono text-[#4a5568] dark:text-slate-400">
                              {card.phonetic_primary}
                            </p>
                          )}
                        </div>

                        <p className="text-base font-extrabold text-[#3c94d4] dark:text-sky-400">
                          {card.meaning_vi}
                        </p>

                        {card.example_sentence && (
                          <div className="text-xs text-[#1a1a2e] dark:text-slate-200 space-y-1 border-l-2 border-[#c7d2e0] dark:border-slate-600 pl-2.5">
                            <p>
                              &ldquo;
                              {renderHighlightedSentence(
                                card.example_sentence,
                                card.word
                              )}
                              &rdquo;
                            </p>
                            {card.example_meaning_vi && (
                              <p className="text-[#4a5568] dark:text-slate-400">
                                → {card.example_meaning_vi}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={togglingVocabId === card.vocab_id}
                        onClick={() => handleToggleMarkKnown(card)}
                        className={`btn-duo w-full py-2 px-3 rounded-duo text-xs font-extrabold border-2 flex items-center justify-center gap-1.5 cursor-pointer ${
                          isKnown
                            ? 'bg-[#22c55e] text-white border-[#15803d] shadow-[0_2px_0_0_#15803d]'
                            : 'bg-white dark:bg-slate-900 text-[#262c57] dark:text-slate-200 border-[#e2e8f0] dark:border-slate-700 shadow-duo-sm hover:border-[#22c55e]'
                        }`}
                      >
                        {isKnown ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Đã thuộc (Bấm để bỏ)</span>
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
            )}

            {/* Nút Xem thêm 100 từ khi xem danh sách lớn */}
            {visibleCount < filteredCards.length && (
              <div className="p-4 border-t-2 border-[#e2e8f0] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 100)}
                  className="btn-duo px-5 py-2.5 rounded-duo bg-[#262c57] text-white font-extrabold text-xs uppercase tracking-wide border-2 border-[#161c41] shadow-duo-primary cursor-pointer"
                >
                  Xem thêm 100 từ (Đang hiện {displayedCards.length}/
                  {filteredCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(filteredCards.length)}
                  className="btn-duo px-4 py-2.5 rounded-duo bg-white dark:bg-slate-800 text-[#262c57] dark:text-slate-200 font-extrabold text-xs border-2 border-[#e2e8f0] dark:border-slate-700 shadow-duo-sm cursor-pointer"
                >
                  Hiện tất cả {filteredCards.length} từ
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
