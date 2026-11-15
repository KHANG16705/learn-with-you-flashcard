import { pool } from '../config/db.js';

/**
 * Hàm phụ: Chuyển dữ liệu cột tags trong MySQL sang mảng JavaScript an toàn
 * Tại sao cần hàm này: Tùy cấu hình MySQL, cột JSON có thể trả về dạng chuỗi '["#a1"]' hoặc mảng sẵn
 */
function parseTagsSafely(rawTags) {
  if (!rawTags) {
    return [];
  }
  if (Array.isArray(rawTags)) {
    return rawTags;
  }
  try {
    const parsed = JSON.parse(rawTags);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách bộ thẻ ở Trang Khám Phá kèm số liệu Banner Nhắc Ôn Tập Hôm Nay
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

export default {
  getCatalogDecks,
};
