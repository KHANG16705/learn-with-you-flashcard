import { pool } from '../config/db.js';

/**
 * Đánh dấu hoặc Bỏ đánh dấu 1 từ vựng là "Đã biết" (Mark as Known)
 * Đường dẫn: PATCH /api/v1/study/cards/:vocabId/mark-known
 * Ý nghĩa:
 * - Nếu từ chưa thuộc (hoặc chưa học): Chuyển sang trạng thái 'IGNORED' (tính vào nhóm Đã thuộc 🟢)
 * - Nếu từ đang ở trạng thái 'IGNORED' (hoặc người dùng muốn bỏ đánh dấu): Xóa khỏi bảng tiến độ để quay về 'UNSEEN' (Chưa học ⚪)
 */
export async function toggleMarkKnown(req, res) {
  try {
    // Bước 1: Lấy mã người dùng và mã từ vựng (vocabId) từ URL
    const userId = req.user.id;
    const vocabId = Number(req.params.vocabId);

    if (!vocabId || Number.isNaN(vocabId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã từ vựng (vocabId) không hợp lệ',
      });
    }

    // Bước 2: Kiểm tra xem từ vựng này có tồn tại trong bảng vocabularies không
    const [vocabRows] = await pool.execute(
      `SELECT id, word, language FROM vocabularies WHERE id = ? LIMIT 1`,
      [vocabId]
    );

    if (vocabRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy từ vựng này trong hệ thống',
      });
    }

    // Bước 3: Kiểm tra trạng thái hiện tại của từ vựng đối với người dùng này
    const [progressRows] = await pool.execute(
      `SELECT id, status FROM user_vocab_progress WHERE user_id = ? AND vocab_id = ? LIMIT 1`,
      [userId, vocabId]
    );

    const currentStatus = progressRows.length > 0 ? progressRows[0].status : 'UNSEEN';

    // Cho phép truyền rõ is_known từ body, hoặc tự động đảo trạng thái (toggle) khi bấm nút
    let shouldMarkKnown = true;
    if (typeof req.body?.is_known === 'boolean') {
      shouldMarkKnown = req.body.is_known;
    } else if (typeof req.body?.isKnown === 'boolean') {
      shouldMarkKnown = req.body.isKnown;
    } else {
      // Nếu đang là 'IGNORED' hoặc 'MASTERED' thì bấm lần nữa sẽ bỏ đánh dấu về 'UNSEEN'
      if (currentStatus === 'IGNORED' || currentStatus === 'MASTERED') {
        shouldMarkKnown = false;
      } else {
        shouldMarkKnown = true;
      }
    }

    let newStatus = 'UNSEEN';

    // Bước 4: Cập nhật vào bảng user_vocab_progress
    if (shouldMarkKnown) {
      // Đánh dấu là Đã biết ('IGNORED') -> Không đưa vào hàng đợi ôn tập nữa và tính vào cột Đã thuộc
      const upsertSql = `
        INSERT INTO user_vocab_progress
          (user_id, vocab_id, status, interval_days, ease_factor, repetitions, lapses, last_reviewed_at, next_review_at)
        VALUES
          (?, ?, 'IGNORED', 365, 2.50, 1, 0, NOW(), NULL)
        ON DUPLICATE KEY UPDATE
          status = 'IGNORED',
          next_review_at = NULL,
          updated_at = NOW()
      `;
      await pool.execute(upsertSql, [userId, vocabId]);
      newStatus = 'IGNORED';
    } else {
      // Bỏ đánh dấu Đã biết -> Xóa bản ghi tiến độ để từ quay về trạng thái Chưa học ('UNSEEN')
      const deleteSql = `
        DELETE FROM user_vocab_progress
        WHERE user_id = ? AND vocab_id = ?
      `;
      await pool.execute(deleteSql, [userId, vocabId]);
      newStatus = 'UNSEEN';
    }

    // Bước 5: Trả kết quả về cho giao diện cập nhật tức thì
    return res.status(200).json({
      success: true,
      message:
        newStatus === 'IGNORED'
          ? 'Đã đánh dấu từ vựng là Đã biết'
          : 'Đã bỏ đánh dấu Đã biết (quay về Chưa học)',
      data: {
        vocab_id: vocabId,
        status: newStatus,
        is_known: newStatus === 'IGNORED',
      },
    });
  } catch (error) {
    console.error('Lỗi khi đánh dấu Đã biết (toggleMarkKnown):', error);
    return res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi cập nhật trạng thái từ vựng',
    });
  }
}

export default {
  toggleMarkKnown,
};
