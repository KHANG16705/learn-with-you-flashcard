import { pool } from '../config/db.js';

/**
 * Hàm phụ: Chuyển dữ liệu cột JSON trong MySQL sang mảng/object JavaScript an toàn
 * Tại sao cần hàm này: Tùy cấu hình MySQL, cột JSON có thể trả về dạng chuỗi hoặc object sẵn
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
 * 1. Lấy danh sách bộ thẻ ở Trang Khám Phá kèm số liệu Banner Nhắc Ôn Tập Hôm Nay
 * Đường dẫn: GET /api/v1/decks?lang=EN&tag=#a1&search=...
 */
export async function getCatalogDecks(req, res) {
  try {
    // Bước 1: Lấy mã người dùng đang đăng nhập và các tham số lọc trên thanh địa chỉ (URL)
    const userId = req.user.id;

    // Xác định ngôn ngữ cần lấy ('EN' là Tiếng Anh, 'ZH' là Tiếng Trung)
    let selectedLang = req.user.preferred_lang || 'EN';
    if (req.query.lang === 'EN' || req.query.lang === 'ZH') {
      selectedLang = req.query.lang;
    }

    // Lấy mã tag muốn lọc (ví dụ: '#a1', '#oxford') và từ khóa tìm kiếm (nếu có)
    const filterTag = req.query.tag ? String(req.query.tag).trim().toLowerCase() : '';
    const searchKeyword = req.query.search
      ? String(req.query.search).trim().toLowerCase()
      : '';

    // =========================================================================
    // Bước 2: Truy vấn 1 - Lấy danh sách các bộ thẻ hệ thống (is_system = 1)
    // Kết hợp (LEFT JOIN) với bảng deck_cards và user_vocab_progress để đếm tiến độ học của User
    // =========================================================================
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

    // Bước 3: Duyệt qua từng bộ thẻ bằng vòng lặp for để định dạng số liệu và lọc theo tag / từ khóa
    const filteredDecks = [];

    for (let i = 0; i < deckRows.length; i++) {
      const row = deckRows[i];
      const tagsArray = parseTagsSafely(row.tags);

      // Chuyển các số đếm từ MySQL sang kiểu số (Number) để tính toán không bị lỗi
      const totalCards = Number(row.counted_cards || row.saved_total_cards || 0);
      const learnedCount = Number(row.learned_count || 0);
      const masteredCount = Number(row.mastered_count || 0);
      const dueCount = Number(row.due_count || 0);

      // Tính phần trăm số từ đã học trong bộ thẻ (từ 0% đến 100%)
      let progressPercent = 0;
      if (totalCards > 0) {
        progressPercent = Math.round((learnedCount / totalCards) * 100);
      }

      // Kiểm tra điều kiện lọc theo Tag (nếu người dùng có chọn tag khác 'all')
      if (filterTag && filterTag !== 'all') {
        const normalizedFilterTag = filterTag.startsWith('#') ? filterTag : `#${filterTag}`;
        let hasMatchingTag = false;

        for (let j = 0; j < tagsArray.length; j++) {
          if (String(tagsArray[j]).toLowerCase() === normalizedFilterTag) {
            hasMatchingTag = true;
            break;
          }
        }

        // Nếu bộ thẻ không có tag đang chọn thì bỏ qua, chuyển sang bộ thẻ tiếp theo
        if (!hasMatchingTag) {
          continue;
        }
      }

      // Kiểm tra điều kiện lọc theo từ khóa tìm kiếm (nếu người dùng gõ ô tìm kiếm)
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

      // Đưa bộ thẻ hợp lệ vào danh sách kết quả
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

    // =========================================================================
    // Bước 4: Truy vấn 2 - Tính số liệu cho "Banner Nhắc Ôn Tập Hôm Nay" (dailySummary)
    // Đếm trong bảng user_vocab_progress các từ thuộc ngôn ngữ đang chọn
    // =========================================================================
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

    // Bước 5: Trả kết quả JSON về cho giao diện Frontend
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
 * 2. Lấy tổng quan Bộ thẻ, Thanh tiến độ 4 màu và Danh sách các Unit 20 từ
 * Đường dẫn: GET /api/v1/decks/:slug/overview
 */
export async function getDeckOverview(req, res) {
  try {
    const userId = req.user.id;
    const slug = String(req.params.slug || '').trim();

    let deckInfo = null;
    let unitWhereClause = '';
    let unitQueryParams = [];

    // =========================================================================
    // Bước 1: Kiểm tra xem người dùng đang xem 1 bộ thẻ cụ thể hay trọn bộ 3.004 từ Oxford
    // =========================================================================
    if (slug === 'all-oxford-3000') {
      // Trường hợp đặc biệt: Tổng hợp cả 4 bộ Oxford 3000 (A1, A2, B1, B2)
      deckInfo = {
        id: 0,
        slug: 'all-oxford-3000',
        title_vi: 'Trọn Bộ Từ Vựng Oxford 3000 (A1 - B2)',
        title_target: 'The Oxford 3000™ Complete Vocabulary (A1 - B2)',
        description:
          'Tổng hợp toàn bộ 3.004 từ vựng cốt lõi tiếng Anh thuộc cả 4 cấp độ CEFR (A1, A2, B1, B2).',
        language: 'EN',
        level_tag: 'A1-B2',
        tags: ['#oxford', '#a1', '#a2', '#b1', '#b2', '#common'],
        total_cards: 3004,
        is_system: 1,
      };

      unitWhereClause = `WHERE d.slug LIKE 'oxford-3000-%' AND d.is_deleted = 0`;
      unitQueryParams = [userId];
    } else {
      // Trường hợp thông thường: Tìm đúng bộ thẻ theo slug (ví dụ: oxford-3000-a1)
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

    // =========================================================================
    // Bước 2: Lấy danh sách toàn bộ các Unit kèm 4 chỉ số màu của từng Unit
    // - unseen_count (Chưa học): uvp.id IS NULL
    // - learning_count (Đang học): status IN ('LEARNING', 'REVIEW') và chưa tới giờ ôn
    // - due_today_count (Cần ôn hôm nay): status IN ('LEARNING', 'REVIEW') và next_review_at <= NOW()
    // - mastered_count (Đã thuộc): status IN ('MASTERED', 'IGNORED')
    // =========================================================================
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

    // =========================================================================
    // Bước 3: Duyệt vòng lặp for qua các Unit để chuẩn hóa dữ liệu và cộng dồn
    // thành bảng thống kê 4 màu tổng (stats) của toàn bộ thẻ
    // =========================================================================
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

      units.push({
        id: u.id,
        deck_id: u.deck_id,
        deck_slug: u.deck_slug,
        deck_level_tag: u.deck_level_tag,
        unit_number: Number(u.unit_number),
        title: u.title,
        total_cards: uTotal,
        unseen_count: uUnseen,
        learning_count: uLearning,
        due_today_count: uDue,
        mastered_count: uMastered,
        weak_count: uWeak,
      });
    }

    // Cập nhật lại tổng số thẻ thực tế cho thông tin bộ thẻ
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

    // Bước 4: Trả kết quả JSON về cho Frontend
    return res.status(200).json({
      success: true,
      data: {
        deck: deckInfo,
        stats: stats,
        units: units,
      },
      deck: deckInfo,
      stats: stats,
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
 * 3. Lấy danh sách các từ vựng trong 1 Unit (20 từ) HOẶC toàn bộ từ của Bộ thẻ (unitId = 'all')
 * Đường dẫn: GET /api/v1/decks/:slug/units/:unitId/cards?filter=all&search=...
 */
export async function getUnitCards(req, res) {
  try {
    const userId = req.user.id;
    const slug = String(req.params.slug || '').trim();
    const unitIdParam = String(req.params.unitId || 'all').trim();
    const filter = String(req.query.filter || 'all').trim().toLowerCase();
    const searchKeyword = String(req.query.search || '').trim().toLowerCase();

    // =========================================================================
    // Bước 1: Xác định điều kiện lọc theo Bộ thẻ (slug) và theo Chặng (unitId)
    // =========================================================================
    let whereSql = '';
    let queryParams = [];

    if (slug === 'all-oxford-3000') {
      // Nếu lấy từ trọn bộ 3.004 từ Oxford 3000
      if (unitIdParam === 'all') {
        whereSql = `WHERE d.slug LIKE 'oxford-3000-%' AND d.is_deleted = 0 AND dc.is_deleted = 0`;
        queryParams = [userId];
      } else {
        const numericUnitId = Number(unitIdParam);
        whereSql = `WHERE d.slug LIKE 'oxford-3000-%' AND d.is_deleted = 0 AND dc.is_deleted = 0 AND dc.unit_id = ?`;
        queryParams = [userId, numericUnitId];
      }
    } else {
      // Kiểm tra bộ thẻ theo slug có tồn tại không
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
        // Lấy toàn bộ tất cả các từ trong bộ thẻ này (ví dụ cả 902 từ của A1)
        whereSql = `WHERE dc.deck_id = ? AND dc.is_deleted = 0`;
        queryParams = [userId, deckId];
      } else {
        // Cho phép truyền id của bảng deck_units HOẶC số thứ tự unit_number (1, 2, 3...)
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

    // =========================================================================
    // Bước 2: Truy vấn lấy đầy đủ thông tin từ vựng kết hợp trạng thái SRS của User
    // =========================================================================
    const cardsSql = `
      SELECT
        dc.id AS deck_card_id,
        dc.deck_id,
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

    // =========================================================================
    // Bước 3: Duyệt vòng lặp for để định dạng từng từ vựng và lọc theo filter / search
    // =========================================================================
    const filteredCards = [];

    for (let i = 0; i < cardRows.length; i++) {
      const row = cardRows[i];

      // Nếu chưa có bản ghi trong user_vocab_progress thì trạng thái là 'UNSEEN' (Chưa học)
      const status = row.user_status ? String(row.user_status) : 'UNSEEN';
      const isDueToday = Number(row.is_due_today || 0) === 1;
      const lapses = Number(row.lapses || 0);
      const isMastered = status === 'MASTERED' || status === 'IGNORED';
      const isWeak = lapses >= 3 && !isMastered;

      // Xác định nhóm màu 4 trạng thái cho từng thẻ để Frontend dễ tô màu
      let colorState = 'unseen';
      if (isMastered) {
        colorState = 'mastered';
      } else if (isDueToday) {
        colorState = 'due';
      } else if (status === 'LEARNING' || status === 'REVIEW') {
        colorState = 'learning';
      }

      // Kiểm tra điều kiện lọc theo trạng thái (filter: 'all' | 'unseen' | 'learning' | 'due' | 'mastered' | 'weak')
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

      // Ưu tiên nghĩa riêng của bộ thẻ (custom_meaning_vi) nếu có, không thì lấy nghĩa gốc (meaning_vi)
      const displayMeaningVi = row.custom_meaning_vi || row.meaning_vi || '';

      // Kiểm tra điều kiện tìm kiếm theo từ khóa (search theo từ vựng hoặc nghĩa tiếng Việt)
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
        unit_id: row.unit_id,
        unit_number: row.unit_number ? Number(row.unit_number) : null,
        unit_title: row.unit_title || null,
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
        language_metadata: parseJsonSafely(row.language_metadata, {}),
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

    // Bước 4: Trả danh sách thẻ về cho Frontend
    return res.status(200).json({
      success: true,
      total: filteredCards.length,
      data: {
        slug: slug,
        unit_id: unitIdParam,
        filter: filter,
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
