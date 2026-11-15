import { pool } from '../config/db.js';

/**
 * Hàm phụ: Chuyển dữ liệu cột JSON trong MySQL sang mảng/object JavaScript an toàn
 */
function parseJsonSafely(rawValue, fallbackValue) {
  if (!rawValue) {
    return fallbackValue;
  }
  if (typeof rawValue === 'object') {
    return rawValue;
  }
  try {
    const parsed = JSON.parse(rawValue);
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function parseTagsSafely(rawTags) {
  const result = parseJsonSafely(rawTags, []);
  return Array.isArray(result) ? result : [];
}

/**
 * Hàm phụ: Xác định Nhóm Chủ đề lớn (category_id & category_name) từ tiêu đề Unit
 */
function inferUnitCategory(unitTitle = '') {
  const title = String(unitTitle);

  if (
    title.includes('Gia đình') ||
    title.includes('Nhà cửa') ||
    title.includes('Trang phục') ||
    title.includes('Ẩm thực')
  ) {
    return {
      category_id: 'life_people',
      category_name: '👨‍👩‍👧‍👦 Đời sống, Gia đình & Ẩm thực',
    };
  }

  if (
    title.includes('Du lịch') ||
    title.includes('Đô thị') ||
    title.includes('Nghệ thuật') ||
    title.includes('Thể thao')
  ) {
    return {
      category_id: 'travel_leisure',
      category_name: '✈️ Di chuyển, Địa điểm & Giải trí',
    };
  }

  if (
    title.includes('Công việc') ||
    title.includes('Kinh doanh') ||
    title.includes('Giáo dục')
  ) {
    return {
      category_id: 'work_education',
      category_name: '💼 Công việc, Kinh tế & Giáo dục',
    };
  }

  if (
    title.includes('Cơ thể') ||
    title.includes('Thiên nhiên') ||
    title.includes('Khoa học') ||
    title.includes('Xã hội') ||
    title.includes('Thời gian')
  ) {
    return {
      category_id: 'nature_science_society',
      category_name: '🌿 Tự nhiên, Khoa học, Y tế & Xã hội',
    };
  }

  return {
    category_id: 'mind_actions_grammar',
    category_name: '🧠 Tư duy, Cảm xúc, Hành động & Ngữ pháp',
  };
}

/**
 * 1. Lấy danh sách bộ thẻ ở Trang Khám Phá kèm số liệu Banner Nhắc Ôn Tập Hôm Nay
 * Đường dẫn: GET /api/v1/decks?lang=EN&tag=#a1&search=...
 */
export async function getCatalogDecks(req, res) {
  try {
    const userId = req.user.id;

    let selectedLang = req.user.preferred_lang || 'EN';
    if (req.query.lang === 'EN' || req.query.lang === 'ZH') {
      selectedLang = req.query.lang;
    }

    const filterTag = req.query.tag ? String(req.query.tag).trim().toLowerCase() : '';
    const searchKeyword = req.query.search
      ? String(req.query.search).trim().toLowerCase()
      : '';

    const deckSql = `
      SELECT
        d.id,
        d.slug,
        d.title_vi,
        d.title_target,
        d.description,
        d.language,
        d.level_tag,
        d.tags,
        d.total_cards AS saved_total_cards,
        COUNT(dc.id) AS counted_cards,
        SUM(CASE WHEN uvp.id IS NOT NULL THEN 1 ELSE 0 END) AS learned_count,
        SUM(CASE WHEN uvp.status IN ('MASTERED', 'IGNORED') THEN 1 ELSE 0 END) AS mastered_count,
        SUM(
          CASE
            WHEN uvp.status IN ('LEARNING', 'REVIEW') AND uvp.next_review_at <= NOW()
            THEN 1
            ELSE 0
          END
        ) AS due_count
      FROM decks d
      LEFT JOIN deck_cards dc
        ON d.id = dc.deck_id AND dc.is_deleted = 0
      LEFT JOIN user_vocab_progress uvp
        ON dc.vocab_id = uvp.vocab_id AND uvp.user_id = ?
      WHERE d.language = ?
        AND d.is_system = 1
        AND d.is_deleted = 0
      GROUP BY d.id
      ORDER BY d.id ASC
    `;

    const [deckRows] = await pool.execute(deckSql, [userId, selectedLang]);
    const filteredDecks = [];

    for (let i = 0; i < deckRows.length; i++) {
      const row = deckRows[i];
      const tagsArray = parseTagsSafely(row.tags);

      const totalCards = Number(row.counted_cards || row.saved_total_cards || 0);
      const learnedCount = Number(row.learned_count || 0);
      const masteredCount = Number(row.mastered_count || 0);
      const dueCount = Number(row.due_count || 0);

      let progressPercent = 0;
      if (totalCards > 0) {
        progressPercent = Math.round((learnedCount / totalCards) * 100);
      }

      if (filterTag && filterTag !== 'all') {
        const normalizedFilterTag = filterTag.startsWith('#') ? filterTag : `#${filterTag}`;
        let hasMatchingTag = false;

        for (let j = 0; j < tagsArray.length; j++) {
          if (String(tagsArray[j]).toLowerCase() === normalizedFilterTag) {
            hasMatchingTag = true;
            break;
          }
        }

        if (!hasMatchingTag) {
          continue;
        }
      }

      if (searchKeyword) {
        const titleViText = String(row.title_vi || '').toLowerCase();
        const titleTargetText = String(row.title_target || '').toLowerCase();
        const descText = String(row.description || '').toLowerCase();

        const isMatchedSearch =
          titleViText.includes(searchKeyword) ||
          titleTargetText.includes(searchKeyword) ||
          descText.includes(searchKeyword);

        if (!isMatchedSearch) {
          continue;
        }
      }

      filteredDecks.push({
        id: row.id,
        slug: row.slug,
        title_vi: row.title_vi,
        title_target: row.title_target,
        description: row.description,
        language: row.language,
        level_tag: row.level_tag,
        tags: tagsArray,
        total_cards: totalCards,
        learned_count: learnedCount,
        mastered_count: masteredCount,
        due_count: dueCount,
        progress_percent: progressPercent,
      });
    }

    const summarySql = `
      SELECT
        SUM(
          CASE
            WHEN uvp.status IN ('LEARNING', 'REVIEW') AND uvp.next_review_at <= NOW()
            THEN 1
            ELSE 0
          END
        ) AS total_due_today,
        SUM(
          CASE
            WHEN uvp.lapses >= 3 AND uvp.status NOT IN ('MASTERED', 'IGNORED')
            THEN 1
            ELSE 0
          END
        ) AS total_weak_words,
        SUM(
          CASE
            WHEN uvp.status IN ('MASTERED', 'IGNORED')
            THEN 1
            ELSE 0
          END
        ) AS total_mastered
      FROM user_vocab_progress uvp
      INNER JOIN vocabularies v
        ON uvp.vocab_id = v.id
      WHERE uvp.user_id = ?
        AND v.language = ?
    `;

    const [summaryRows] = await pool.execute(summarySql, [userId, selectedLang]);
    const summaryRow = summaryRows[0] || {};

    const dailySummary = {
      totalDueToday: Number(summaryRow.total_due_today || 0),
      totalWeakWords: Number(summaryRow.total_weak_words || 0),
      totalMastered: Number(summaryRow.total_mastered || 0),
    };

    return res.status(200).json({
      success: true,
      data: {
        language: selectedLang,
        dailySummary: dailySummary,
        decks: filteredDecks,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bộ thẻ (getCatalogDecks):', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi tải danh sách bộ thẻ',
    });
  }
}

/**
 * 2. Lấy tổng quan Bộ thẻ, Thanh tiến độ 4 màu, Danh sách các Unit theo Nhóm Chủ đề
 *    và gợi ý Unit tiếp theo nên học (recommended_unit)
 * Đường dẫn: GET /api/v1/decks/:slug/overview
 */
export async function getDeckOverview(req, res) {
  try {
    const userId = req.user.id;
    const slug = String(req.params.slug || '').trim();

    let deckInfo = null;
    let unitWhereClause = '';
    let unitQueryParams = [];

    if (slug === 'all-oxford-3000') {
      deckInfo = {
        id: 0,
        slug: 'all-oxford-3000',
        title_vi: 'Trọn Bộ Từ Vựng Oxford 3000 (A1 - B2)',
        title_target: 'The Oxford 3000™ Complete Vocabulary (A1 - B2)',
        description:
          'Tổng hợp toàn bộ 3.004 từ vựng cốt lõi tiếng Anh thuộc cả 4 cấp độ CEFR (A1, A2, B1, B2) chia theo 5 Nhóm Chủ đề lớn.',
        language: 'EN',
        level_tag: 'A1-B2',
        tags: ['#oxford', '#a1', '#a2', '#b1', '#b2', '#common'],
        total_cards: 3004,
        is_system: 1,
      };

      unitWhereClause = `WHERE d.slug LIKE 'oxford-3000-%' AND d.is_deleted = 0`;
      unitQueryParams = [userId];
    } else {
      const findDeckSql = `
        SELECT
          id,
          slug,
          title_vi,
          title_target,
          description,
          language,
          level_tag,
          tags,
          total_cards,
          is_system
        FROM decks
        WHERE slug = ?
          AND is_deleted = 0
        LIMIT 1
      `;

      const [deckRows] = await pool.execute(findDeckSql, [slug]);
      if (deckRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy bộ thẻ với mã "${slug}"`,
        });
      }

      const row = deckRows[0];
      deckInfo = {
        id: row.id,
        slug: row.slug,
        title_vi: row.title_vi,
        title_target: row.title_target,
        description: row.description,
        language: row.language,
        level_tag: row.level_tag,
        tags: parseTagsSafely(row.tags),
        total_cards: Number(row.total_cards || 0),
        is_system: Number(row.is_system || 0),
      };

      unitWhereClause = `WHERE du.deck_id = ?`;
      unitQueryParams = [userId, deckInfo.id];
    }

    const unitsSql = `
      SELECT
        du.id,
        du.deck_id,
        d.slug AS deck_slug,
        d.level_tag AS deck_level_tag,
        du.unit_number,
        du.title,
        COUNT(dc.id) AS total_cards,
        SUM(
          CASE
            WHEN uvp.id IS NULL
            THEN 1
            ELSE 0
          END
        ) AS unseen_count,
        SUM(
          CASE
            WHEN uvp.status IN ('LEARNING', 'REVIEW')
                 AND (uvp.next_review_at IS NULL OR uvp.next_review_at > NOW())
            THEN 1
            ELSE 0
          END
        ) AS learning_count,
        SUM(
          CASE
            WHEN uvp.status IN ('LEARNING', 'REVIEW')
                 AND uvp.next_review_at IS NOT NULL
                 AND uvp.next_review_at <= NOW()
            THEN 1
            ELSE 0
          END
        ) AS due_today_count,
        SUM(
          CASE
            WHEN uvp.status IN ('MASTERED', 'IGNORED')
            THEN 1
            ELSE 0
          END
        ) AS mastered_count,
        SUM(
          CASE
            WHEN uvp.lapses >= 3 AND uvp.status NOT IN ('MASTERED', 'IGNORED')
            THEN 1
            ELSE 0
          END
        ) AS weak_count
      FROM deck_units du
      INNER JOIN decks d
        ON du.deck_id = d.id
      LEFT JOIN deck_cards dc
        ON du.id = dc.unit_id AND dc.is_deleted = 0
      LEFT JOIN user_vocab_progress uvp
        ON dc.vocab_id = uvp.vocab_id AND uvp.user_id = ?
      ${unitWhereClause}
      GROUP BY du.id
      ORDER BY du.deck_id ASC, du.unit_number ASC
    `;

    const [unitRows] = await pool.execute(unitsSql, unitQueryParams);

    const units = [];
    let totalCardsAll = 0;
    let unseenCountAll = 0;
    let learningCountAll = 0;
    let dueTodayCountAll = 0;
    let masteredCountAll = 0;
    let weakCountAll = 0;

    for (let i = 0; i < unitRows.length; i++) {
      const u = unitRows[i];
      const uTotal = Number(u.total_cards || 0);
      const uUnseen = Number(u.unseen_count || 0);
      const uLearning = Number(u.learning_count || 0);
      const uDue = Number(u.due_today_count || 0);
      const uMastered = Number(u.mastered_count || 0);
      const uWeak = Number(u.weak_count || 0);

      totalCardsAll += uTotal;
      unseenCountAll += uUnseen;
      learningCountAll += uLearning;
      dueTodayCountAll += uDue;
      masteredCountAll += uMastered;
      weakCountAll += uWeak;

      const categoryInfo = inferUnitCategory(u.title);
      let completionPercent = 0;
      if (uTotal > 0) {
        completionPercent = Math.round((uMastered / uTotal) * 100);
      }

      units.push({
        id: u.id,
        deck_id: u.deck_id,
        deck_slug: u.deck_slug,
        deck_level_tag: u.deck_level_tag,
        unit_number: Number(u.unit_number),
        title: u.title,
        category_id: categoryInfo.category_id,
        category_name: categoryInfo.category_name,
        total_cards: uTotal,
        unseen_count: uUnseen,
        learning_count: uLearning,
        due_today_count: uDue,
        mastered_count: uMastered,
        weak_count: uWeak,
        completion_percent: completionPercent,
      });
    }

    // Tìm Unit gợi ý nên học tiếp theo (recommended_unit):
    // 1. Ưu tiên Unit có thẻ đến hạn cần ôn hôm nay (due_today_count > 0)
    // 2. Tiếp theo là Unit đang học dở (mastered_count > 0 nhưng chưa thuộc hết)
    // 3. Tiếp theo là Unit đầu tiên chưa thuộc hết (mastered_count < total_cards)
    let recommendedUnit = null;

    for (let i = 0; i < units.length; i++) {
      if (units[i].due_today_count > 0) {
        recommendedUnit = {
          ...units[i],
          recommend_reason: `Có ${units[i].due_today_count} từ đến hạn cần ôn tập hôm nay`,
        };
        break;
      }
    }

    if (!recommendedUnit) {
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        const touched = u.mastered_count + u.learning_count + u.due_today_count;
        if (touched > 0 && u.mastered_count < u.total_cards) {
          recommendedUnit = {
            ...u,
            recommend_reason: `Đang học dở (${u.mastered_count}/${u.total_cards} từ đã thuộc)`,
          };
          break;
        }
      }
    }

    if (!recommendedUnit) {
      for (let i = 0; i < units.length; i++) {
        if (units[i].mastered_count < units[i].total_cards) {
          recommendedUnit = {
            ...units[i],
            recommend_reason: 'Bài học tiếp theo trong lộ trình của bạn',
          };
          break;
        }
      }
    }

    if (!recommendedUnit && units.length > 0) {
      recommendedUnit = {
        ...units[0],
        recommend_reason: 'Bạn đã hoàn thành toàn bộ lộ trình! Hãy ôn tập lại từ đầu.',
      };
    }

    deckInfo.total_cards = totalCardsAll;
    deckInfo.total_units = units.length;

    const stats = {
      total_cards: totalCardsAll,
      unseen_count: unseenCountAll,
      learning_count: learningCountAll,
      due_today_count: dueTodayCountAll,
      mastered_count: masteredCountAll,
      weak_count: weakCountAll,
    };

    return res.status(200).json({
      success: true,
      data: {
        deck: deckInfo,
        stats: stats,
        recommended_unit: recommendedUnit,
        units: units,
      },
      deck: deckInfo,
      stats: stats,
      recommended_unit: recommendedUnit,
      units: units,
    });
  } catch (error) {
    console.error('Lỗi khi lấy tổng quan bộ thẻ (getDeckOverview):', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi tải thông tin chi tiết bộ thẻ',
    });
  }
}

/**
 * 3. Lấy danh sách các từ vựng trong 1 Unit HOẶC toàn bộ từ của Bộ thẻ (unitId = 'all')
 *    Hỗ trợ lọc theo Trạng thái (filter) và Độ khó (difficulty: 'easy' | 'medium' | 'hard')
 * Đường dẫn: GET /api/v1/decks/:slug/units/:unitId/cards?filter=all&difficulty=all&search=...
 */
export async function getUnitCards(req, res) {
  try {
    const userId = req.user.id;
    const slug = String(req.params.slug || '').trim();
    const unitIdParam = String(req.params.unitId || 'all').trim();
    const filter = String(req.query.filter || 'all').trim().toLowerCase();
    const difficultyFilter = String(req.query.difficulty || 'all').trim().toUpperCase();
    const searchKeyword = String(req.query.search || '').trim().toLowerCase();

    let whereSql = '';
    let queryParams = [];

    if (slug === 'all-oxford-3000') {
      if (unitIdParam === 'all') {
        whereSql = `WHERE d.slug LIKE 'oxford-3000-%' AND d.is_deleted = 0 AND dc.is_deleted = 0`;
        queryParams = [userId];
      } else {
        const numericUnitId = Number(unitIdParam);
        whereSql = `WHERE d.slug LIKE 'oxford-3000-%' AND d.is_deleted = 0 AND dc.is_deleted = 0 AND dc.unit_id = ?`;
        queryParams = [userId, numericUnitId];
      }
    } else {
      const [deckRows] = await pool.execute(
        `SELECT id, slug, title_vi FROM decks WHERE slug = ? AND is_deleted = 0 LIMIT 1`,
        [slug]
      );

      if (deckRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy bộ thẻ với mã "${slug}"`,
        });
      }

      const deckId = deckRows[0].id;

      if (unitIdParam === 'all') {
        whereSql = `WHERE dc.deck_id = ? AND dc.is_deleted = 0`;
        queryParams = [userId, deckId];
      } else {
        const numericUnit = Number(unitIdParam);
        const [unitLookup] = await pool.execute(
          `SELECT id FROM deck_units WHERE deck_id = ? AND (id = ? OR unit_number = ?) ORDER BY (id = ?) DESC LIMIT 1`,
          [deckId, numericUnit, numericUnit, numericUnit]
        );

        if (unitLookup.length === 0) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy Unit "${unitIdParam}" trong bộ thẻ "${slug}"`,
          });
        }

        const resolvedUnitId = unitLookup[0].id;
        whereSql = `WHERE dc.deck_id = ? AND dc.unit_id = ? AND dc.is_deleted = 0`;
        queryParams = [userId, deckId, resolvedUnitId];
      }
    }

    const cardsSql = `
      SELECT
        dc.id AS deck_card_id,
        dc.deck_id,
        d.level_tag,
        dc.unit_id,
        du.unit_number,
        du.title AS unit_title,
        dc.vocab_id,
        dc.order_index,
        v.language,
        v.word,
        v.part_of_speech,
        v.phonetic_primary,
        v.phonetic_secondary,
        v.meaning_vi,
        dc.custom_meaning_vi,
        dc.example_sentence,
        dc.example_pinyin,
        dc.example_meaning_vi,
        dc.image_url,
        v.audio_word_url,
        dc.audio_example_url,
        v.language_metadata,
        v.distractors,
        uvp.status AS user_status,
        uvp.interval_days,
        uvp.ease_factor,
        uvp.repetitions,
        uvp.lapses,
        uvp.last_reviewed_at,
        uvp.next_review_at,
        CASE
          WHEN uvp.status IN ('LEARNING', 'REVIEW')
               AND uvp.next_review_at IS NOT NULL
               AND uvp.next_review_at <= NOW()
          THEN 1
          ELSE 0
        END AS is_due_today
      FROM deck_cards dc
      INNER JOIN decks d
        ON dc.deck_id = d.id
      INNER JOIN vocabularies v
        ON dc.vocab_id = v.id
      LEFT JOIN deck_units du
        ON dc.unit_id = du.id
      LEFT JOIN user_vocab_progress uvp
        ON dc.vocab_id = uvp.vocab_id AND uvp.user_id = ?
      ${whereSql}
      ORDER BY dc.deck_id ASC, du.unit_number ASC, dc.order_index ASC
    `;

    const [cardRows] = await pool.execute(cardsSql, queryParams);
    const filteredCards = [];

    for (let i = 0; i < cardRows.length; i++) {
      const row = cardRows[i];
      const metadata = parseJsonSafely(row.language_metadata, {});

      const status = row.user_status ? String(row.user_status) : 'UNSEEN';
      const isDueToday = Number(row.is_due_today || 0) === 1;
      const lapses = Number(row.lapses || 0);
      const isMastered = status === 'MASTERED' || status === 'IGNORED';
      const isWeak = lapses >= 3 && !isMastered;

      // Lấy thông tin Độ khó & Chủ đề từ language_metadata
      const difficultyLevel = String(metadata.difficulty_level || 'MEDIUM').toUpperCase();
      const difficultyScore = Number(metadata.difficulty_score || 3);
      const topicCategory =
        metadata.topic_category || inferUnitCategory(row.unit_title).category_name;

      let colorState = 'unseen';
      if (isMastered) {
        colorState = 'mastered';
      } else if (isDueToday) {
        colorState = 'due';
      } else if (status === 'LEARNING' || status === 'REVIEW') {
        colorState = 'learning';
      }

      // Lọc theo trạng thái nhớ (filter)
      if (filter === 'unseen' && status !== 'UNSEEN') {
        continue;
      }
      if (filter === 'learning' && colorState !== 'learning') {
        continue;
      }
      if (filter === 'due' && !isDueToday) {
        continue;
      }
      if (filter === 'mastered' && !isMastered) {
        continue;
      }
      if (filter === 'weak' && !isWeak) {
        continue;
      }

      // Lọc theo Độ khó (difficulty: 'EASY' | 'MEDIUM' | 'HARD')
      if (
        difficultyFilter !== 'ALL' &&
        difficultyFilter !== '' &&
        difficultyLevel !== difficultyFilter
      ) {
        continue;
      }

      const displayMeaningVi = row.custom_meaning_vi || row.meaning_vi || '';

      // Lọc theo từ khóa tìm kiếm (search)
      if (searchKeyword !== '') {
        const wordLower = String(row.word || '').toLowerCase();
        const meaningLower = String(displayMeaningVi).toLowerCase();

        if (!wordLower.includes(searchKeyword) && !meaningLower.includes(searchKeyword)) {
          continue;
        }
      }

      filteredCards.push({
        deck_card_id: row.deck_card_id,
        deck_id: row.deck_id,
        level_tag: row.level_tag,
        unit_id: row.unit_id,
        unit_number: row.unit_number ? Number(row.unit_number) : null,
        unit_title: row.unit_title || null,
        topic_category: topicCategory,
        vocab_id: row.vocab_id,
        order_index: Number(row.order_index || 1),
        language: row.language,
        word: row.word,
        part_of_speech: row.part_of_speech,
        phonetic_primary: row.phonetic_primary,
        phonetic_secondary: row.phonetic_secondary,
        meaning_vi: displayMeaningVi,
        custom_meaning_vi: row.custom_meaning_vi,
        example_sentence: row.example_sentence,
        example_pinyin: row.example_pinyin,
        example_meaning_vi: row.example_meaning_vi,
        image_url: row.image_url,
        audio_word_url: row.audio_word_url,
        audio_example_url: row.audio_example_url,
        difficulty_level: difficultyLevel,
        difficulty_score: difficultyScore,
        language_metadata: metadata,
        distractors: parseJsonSafely(row.distractors, []),
        status: status,
        color_state: colorState,
        is_known: isMastered,
        is_due_today: isDueToday,
        is_weak: isWeak,
        interval_days: Number(row.interval_days || 0),
        ease_factor: Number(row.ease_factor || 2.5),
        repetitions: Number(row.repetitions || 0),
        lapses: lapses,
        last_reviewed_at: row.last_reviewed_at || null,
        next_review_at: row.next_review_at || null,
      });
    }

    return res.status(200).json({
      success: true,
      total: filteredCards.length,
      data: {
        slug: slug,
        unit_id: unitIdParam,
        filter: filter,
        difficulty: difficultyFilter,
        total: filteredCards.length,
        cards: filteredCards,
      },
      cards: filteredCards,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách từ vựng trong Unit (getUnitCards):', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi tải danh sách từ vựng',
    });
  }
}

export default {
  getCatalogDecks,
  getDeckOverview,
  getUnitCards,
};
