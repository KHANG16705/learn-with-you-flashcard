CREATE DATABASE IF NOT EXISTS flashcard_srs_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE flashcard_srs_db;

-- 1. Bảng Người dùng
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  google_id VARCHAR(128) NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  preferred_lang ENUM('EN', 'ZH') NOT NULL DEFAULT 'EN',
  daily_new_cards_limit SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Kho Từ vựng gốc dùng chung
CREATE TABLE vocabularies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  language ENUM('EN', 'ZH') NOT NULL,
  word VARCHAR(191) NOT NULL,
  part_of_speech VARCHAR(50) NOT NULL DEFAULT '',
  phonetic_primary VARCHAR(191) NULL,
  phonetic_secondary VARCHAR(191) NULL,
  meaning_vi TEXT NOT NULL,
  audio_word_url VARCHAR(500) NULL,
  language_metadata JSON NULL,
  distractors JSON NULL,
  creator_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vocab_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_vocab_lookup (language, word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Bộ thẻ Hệ thống & Thư mục Sổ tay cá nhân
CREATE TABLE decks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(191) NOT NULL UNIQUE,
  title_vi VARCHAR(255) NOT NULL,
  title_target VARCHAR(255) NULL,
  description TEXT NULL,
  language ENUM('EN', 'ZH') NOT NULL,
  level_tag VARCHAR(50) NOT NULL DEFAULT 'CUSTOM',
  tags JSON NULL,
  total_cards INT UNSIGNED NOT NULL DEFAULT 0,
  is_system TINYINT(1) NOT NULL DEFAULT 1,
  creator_id BIGINT UNSIGNED NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_deck_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_deck_catalog (language, is_system, is_deleted, level_tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Chặng học nhỏ (Units - 20 từ/Unit)
CREATE TABLE deck_units (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  deck_id BIGINT UNSIGNED NOT NULL,
  unit_number SMALLINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  card_count SMALLINT UNSIGNED NOT NULL DEFAULT 20,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_unit_deck FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
  UNIQUE KEY uk_deck_unit (deck_id, unit_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng Liên kết Thẻ vào Bộ thẻ & Câu ví dụ ngữ cảnh
CREATE TABLE deck_cards (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  deck_id BIGINT UNSIGNED NOT NULL,
  unit_id BIGINT UNSIGNED NULL,
  vocab_id BIGINT UNSIGNED NOT NULL,
  order_index SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  custom_meaning_vi TEXT NULL,
  example_sentence TEXT NULL,
  example_pinyin TEXT NULL,
  example_meaning_vi TEXT NULL,
  audio_example_url VARCHAR(500) NULL,
  image_url VARCHAR(500) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_dc_deck FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
  CONSTRAINT fk_dc_unit FOREIGN KEY (unit_id) REFERENCES deck_units(id) ON DELETE SET NULL,
  CONSTRAINT fk_dc_vocab FOREIGN KEY (vocab_id) REFERENCES vocabularies(id) ON DELETE CASCADE,
  UNIQUE KEY uk_deck_vocab (deck_id, vocab_id),
  INDEX idx_deck_unit_order (deck_id, unit_id, is_deleted, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng Tiến độ Học SRS & Từ yếu của từng User (Lazy Init)
CREATE TABLE user_vocab_progress (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  vocab_id BIGINT UNSIGNED NOT NULL,
  status ENUM('LEARNING', 'REVIEW', 'MASTERED', 'IGNORED') NOT NULL DEFAULT 'LEARNING',
  interval_days INT UNSIGNED NOT NULL DEFAULT 0,
  ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.50,
  repetitions SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  lapses SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  last_reviewed_at DATETIME NULL,
  next_review_at DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_uvp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uvp_vocab FOREIGN KEY (vocab_id) REFERENCES vocabularies(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_vocab (user_id, vocab_id),
  INDEX idx_user_due_srs (user_id, status, next_review_at),
  INDEX idx_user_weak_words (user_id, lapses)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng Nhật ký Học tập hàng ngày (Phục vụ Thống kê & Heatmap)
CREATE TABLE user_study_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  study_date DATE NOT NULL,
  language ENUM('EN', 'ZH') NOT NULL,
  new_cards_learned SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  cards_reviewed SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  correct_answers SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  total_attempts SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  study_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_date_lang (user_id, study_date, language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng Từ điển nền Offline (Phục vụ Popup Tra nhanh & Auto-fill Sổ tay)
CREATE TABLE dictionary_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  language ENUM('EN', 'ZH') NOT NULL,
  word VARCHAR(191) NOT NULL,
  part_of_speech VARCHAR(50) NULL,
  phonetic_primary VARCHAR(191) NULL,
  phonetic_secondary VARCHAR(191) NULL,
  meaning_vi TEXT NOT NULL,
  metadata JSON NULL,
  INDEX idx_dict_lookup (language, word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
