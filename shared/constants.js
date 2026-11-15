/**
 * Hằng số dùng chung cho toàn hệ thống (Backend, Frontend Web, Mobile App)
 */

export const CARD_STATUS = Object.freeze({
  UNSEEN: 'UNSEEN',
  LEARNING: 'LEARNING',
  REVIEW: 'REVIEW',
  MASTERED: 'MASTERED',
  IGNORED: 'IGNORED',
});

export const SRS_RATING = Object.freeze({
  AGAIN: 0, // Quên
  HARD: 1,  // Khó
  GOOD: 2,  // Nhớ
  EASY: 3,  // Rất dễ
});

export const STUDY_MODES = Object.freeze({
  FLASHCARD: 'flashcard',
  QUIZ: 'quiz',
  TYPING: 'typing',
  COMBO: 'combo',
  WEAK_WORDS: 'weak_words',
  DUE_REVIEW: 'due_review',
});

export const LANGUAGES = Object.freeze({
  EN: 'EN',
  ZH: 'ZH',
});

export const SRS_DEFAULTS = Object.freeze({
  INITIAL_EASE_FACTOR: 2.50,
  MIN_EASE_FACTOR: 1.30,
  MASTERED_INTERVAL_THRESHOLD: 21,
  LEECH_LAPSE_THRESHOLD: 3,
});

export default {
  CARD_STATUS,
  SRS_RATING,
  STUDY_MODES,
  LANGUAGES,
  SRS_DEFAULTS,
};
