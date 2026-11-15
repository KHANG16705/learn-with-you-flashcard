tiếpimport { CARD_STATUS, SRS_RATING, SRS_DEFAULTS } from './constants.js';

/**
 * Chuyển đổi đối tượng Date sang chuỗi chuẩn DATETIME của MySQL (YYYY-MM-DD HH:mm:ss)
 * @param {Date} date
 * @returns {string}
 */
export function formatMySQLDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Tính toán tham số SRS tiếp theo theo công thức SM-2 cải tiến
 * @param {Object} currentProgress - Trạng thái hiện tại của thẻ
 * @param {number} rating - Điểm đánh giá: 0 (Quên), 1 (Khó), 2 (Nhớ), 3 (Rất dễ)
 * @param {Date} [now=new Date()] - Thời điểm đánh giá
 * @returns {Object} Kết quả SRS mới
 */
export function calculateSRS(currentProgress = {}, rating, now = new Date()) {
  let interval_days = Number(currentProgress?.interval_days ?? 0);
  let ease_factor = Number(currentProgress?.ease_factor ?? SRS_DEFAULTS.INITIAL_EASE_FACTOR);
  let repetitions = Number(currentProgress?.repetitions ?? 0);
  let lapses = Number(currentProgress?.lapses ?? 0);
  let status = currentProgress?.status || CARD_STATUS.LEARNING;

  const nowDate = now instanceof Date ? new Date(now.getTime()) : new Date(now);
  const numericRating = Number(rating);
  let nextReviewDate = new Date(nowDate.getTime());

  switch (numericRating) {
    case SRS_RATING.AGAIN: {
      // 0 - Quên (Again): Reset chuỗi nhớ, ôn lại sau 10 phút
      repetitions = 0;
      interval_days = 0;
      ease_factor = Math.max(
        SRS_DEFAULTS.MIN_EASE_FACTOR,
        Number((ease_factor - 0.20).toFixed(2))
      );
      lapses = lapses + 1;
      status = CARD_STATUS.LEARNING;
      nextReviewDate = new Date(nowDate.getTime() + 10 * 60 * 1000);
      break;
    }

    case SRS_RATING.HARD: {
      // 1 - Khó (Hard): Tăng nhẹ khoảng cách ngày ôn, giảm hệ số dễ
      interval_days = Math.max(1, Math.round(interval_days * 1.2));
      ease_factor = Math.max(
        SRS_DEFAULTS.MIN_EASE_FACTOR,
        Number((ease_factor - 0.15).toFixed(2))
      );
      status = CARD_STATUS.REVIEW;
      nextReviewDate = new Date(nowDate.getTime() + interval_days * 24 * 60 * 60 * 1000);
      break;
    }

    case SRS_RATING.GOOD: {
      // 2 - Nhớ (Good): Tăng theo lộ trình SM-2 chuẩn
      if (repetitions === 0) {
        interval_days = 1;
      } else if (repetitions === 1) {
        interval_days = 3;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetitions = repetitions + 1;
      ease_factor = Number(ease_factor.toFixed(2));
      status =
        interval_days > SRS_DEFAULTS.MASTERED_INTERVAL_THRESHOLD
          ? CARD_STATUS.MASTERED
          : CARD_STATUS.REVIEW;
      nextReviewDate = new Date(nowDate.getTime() + interval_days * 24 * 60 * 60 * 1000);
      break;
    }

    case SRS_RATING.EASY: {
      // 3 - Rất dễ (Easy): Nhảy bậc nhanh, thưởng thêm hệ số dễ
      if (repetitions === 0) {
        interval_days = 4;
      } else {
        interval_days = Math.round(interval_days * ease_factor * 1.3);
      }
      repetitions = repetitions + 1;
      ease_factor = Number((ease_factor + 0.15).toFixed(2));
      status =
        interval_days > SRS_DEFAULTS.MASTERED_INTERVAL_THRESHOLD
          ? CARD_STATUS.MASTERED
          : CARD_STATUS.REVIEW;
      nextReviewDate = new Date(nowDate.getTime() + interval_days * 24 * 60 * 60 * 1000);
      break;
    }

    default:
      throw new Error(`Invalid SRS rating: ${rating}. Expected 0, 1, 2, or 3.`);
  }

  return {
    status,
    interval_days,
    ease_factor,
    repetitions,
    lapses,
    is_leech: lapses >= SRS_DEFAULTS.LEECH_LAPSE_THRESHOLD,
    last_reviewed_at: formatMySQLDateTime(nowDate),
    next_review_at: formatMySQLDateTime(nextReviewDate),
  };
}

/**
 * Tính nhãn thời gian ôn tập dự kiến hiển thị trên 4 nút đánh giá SRS ở UI
 * @param {Object} currentProgress
 * @returns {Object} Ví dụ: { 0: '< 10p', 1: '1 ngày', 2: '1 ngày', 3: '4 ngày', again: '< 10p', ... }
 */
export function getButtonPreviewIntervals(currentProgress = {}) {
  const hardPreview = calculateSRS(currentProgress, SRS_RATING.HARD);
  const goodPreview = calculateSRS(currentProgress, SRS_RATING.GOOD);
  const easyPreview = calculateSRS(currentProgress, SRS_RATING.EASY);

  const againLabel = '< 10p';
  const hardLabel = `${hardPreview.interval_days} ngày`;
  const goodLabel = `${goodPreview.interval_days} ngày`;
  const easyLabel = `${easyPreview.interval_days} ngày`;

  return {
    [SRS_RATING.AGAIN]: againLabel,
    [SRS_RATING.HARD]: hardLabel,
    [SRS_RATING.GOOD]: goodLabel,
    [SRS_RATING.EASY]: easyLabel,
    again: againLabel,
    hard: hardLabel,
    good: goodLabel,
    easy: easyLabel,
  };
}

export default {
  calculateSRS,
  getButtonPreviewIntervals,
  formatMySQLDateTime,
};
