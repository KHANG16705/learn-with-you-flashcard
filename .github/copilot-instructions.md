# AI Coding Assistant Instructions & Architecture Guardrails
## Project: Bilingual (English & Mandarin Chinese) Flashcard SRS Platform (Web -> Mobile App)

You are an expert Full-Stack JavaScript Developer working on this repository. Before generating or modifying any code, strictly adhere to the following architecture, database schema, and business logic rules.

---

## 1. Core Product & Architecture Principles (STRICT RULES)
1. **Distraction-Free & Personalization First:**
   - **NO Gamification Clutter:** Do NOT implement leaderboards, EXP points, levels, diamonds, avatar frames, or paid `PRO` locks. All system decks are 100% free.
   - **Login-First Workflow:** Every user must authenticate via JWT (Email/Password or Google OAuth) before studying so progress is tracked immediately in MySQL.
2. **Decoupled Tech Stack:**
   - **Frontend Web (`/frontend-web`):** React.js (v18+ with Vite), JavaScript (ES6+), React Router DOM v6, Tailwind CSS, Framer Motion (3D card flip), Zustand (state management), Axios, `hanzi-writer` (Chinese stroke order animation & quiz), `Intl.Segmenter` (Chinese sentence word segmentation), Recharts & `react-activity-calendar` (Personal Analytics).
   - **Backend API (`/backend`):** Node.js (v20 LTS) + Express.js using ES Modules (`import`/`export`).
   - **Database Access:** Use **`mysql2/promise` Connection Pool ONLY** (`/backend/src/config/db.js`). **DO NOT install or use heavy ORMs** (like Prisma, Sequelize, or TypeORM). Execute parameterized raw SQL queries for maximum performance (<5ms).
   - **Shared Logic (`/shared`):** All pure logic (`srsEngine.js`, `answerValidator.js`, `constants.js`) MUST be framework-agnostic ES Modules so they can be imported by `/backend`, `/frontend-web`, and the future React Native (Expo) `/mobile-app`.

---

## 2. Database Schema & Lazy Initialization Rules (`backend/scripts/schema.sql`)
Always use the exact table and column names defined in `backend/scripts/schema.sql` (MySQL 8.0+, `utf8mb4_unicode_ci`):
1. **`users`**: `id`, `email`, `password_hash`, `google_id`, `display_name`, `avatar_url`, `preferred_lang` (`'EN'`|`'ZH'`), `daily_new_cards_limit`, `timezone`, `created_at`, `updated_at`.
2. **`vocabularies` (Shared Master Vocabulary Pool)**:
   - `id`, `language` (`'EN'`|`'ZH'`), `word`, `part_of_speech`, `phonetic_primary` (US IPA or tone-marked Pinyin), `phonetic_secondary` (UK IPA or Sino-Vietnamese / Âm Hán Việt), `meaning_vi`, `audio_word_url`, `language_metadata` (JSON), `distractors` (JSON array of 3 distractors), `creator_id`.
   - *Rule:* A word is stored ONCE in `vocabularies` and linked to multiple decks via `deck_cards`. Learning a word in one deck automatically marks it learned across all decks.
3. **`decks`**: `id`, `slug`, `title_vi`, `title_target`, `description`, `language`, `level_tag`, `tags` (JSON), `total_cards`, `is_system` (`1` = system deck, `0` = user personal notebook folder), `creator_id`, `is_deleted`, `created_at`, `updated_at`.
4. **`deck_units`**: `id`, `deck_id`, `unit_number`, `title`, `card_count` (20 cards per unit).
5. **`deck_cards`**: `id`, `deck_id`, `unit_id`, `vocab_id`, `order_index`, `custom_meaning_vi`, `example_sentence`, `example_pinyin`, `example_meaning_vi`, `audio_example_url`, `image_url`, `is_deleted`.
6. **`user_vocab_progress` (Lazy Initialization)**:
   - `id`, `user_id`, `vocab_id`, `status` (`'LEARNING'`, `'REVIEW'`, `'MASTERED'`, `'IGNORED'`), `interval_days`, `ease_factor` (default `2.50`), `repetitions`, `lapses`, `last_reviewed_at`, `next_review_at`, `updated_at`.
   - *Rule:* Never pre-populate `UNSEEN` rows. A card is `UNSEEN` when `LEFT JOIN user_vocab_progress` yields `uvp.id IS NULL`. Use `INSERT INTO user_vocab_progress ... ON DUPLICATE KEY UPDATE ...` when recording progress.
7. **`user_study_logs`**: `id`, `user_id`, `study_date`, `language`, `new_cards_learned`, `cards_reviewed`, `correct_answers`, `total_attempts`, `study_seconds`.
8. **`dictionary_entries`**: `id`, `language`, `word`, `part_of_speech`, `phonetic_primary`, `phonetic_secondary`, `meaning_vi`, `metadata` (JSON).

### Standard SQL Queries to Use in Controllers:
- **Deck 4-Color Progress Overview (`deckController.js`):**
  ```sql
  SELECT
    COUNT(dc.id) AS total_cards,
    SUM(CASE WHEN uvp.id IS NULL THEN 1 ELSE 0 END) AS unseen_count,
    SUM(CASE WHEN uvp.status = 'LEARNING' AND uvp.next_review_at > NOW() THEN 1 ELSE 0 END) AS learning_count,
    SUM(CASE WHEN uvp.status IN ('LEARNING', 'REVIEW') AND uvp.next_review_at <= NOW() THEN 1 ELSE 0 END) AS due_today_count,
    SUM(CASE WHEN uvp.status IN ('MASTERED', 'IGNORED') THEN 1 ELSE 0 END) AS mastered_count
  FROM deck_cards dc
  LEFT JOIN user_vocab_progress uvp
    ON dc.vocab_id = uvp.vocab_id AND uvp.user_id = ?
  WHERE dc.deck_id = ? AND dc.is_deleted = 0;
  ```
- **Weak Words / Leech Workout Query (`lapses >= 3`):**
  ```sql
  SELECT v.*, uvp.lapses, uvp.ease_factor
  FROM user_vocab_progress uvp
  INNER JOIN vocabularies v ON uvp.vocab_id = v.id
  WHERE uvp.user_id = ? AND v.language = ? AND uvp.lapses >= 3 AND uvp.status NOT IN ('MASTERED', 'IGNORED')
  ORDER BY uvp.lapses DESC, uvp.ease_factor ASC LIMIT 20;
  ```

---

## 3. Spaced Repetition Algorithm (`shared/srsEngine.js`)
Implement the modified SM-2 formula for ratings `q` in `{0: Again/Quên, 1: Hard/Khó, 2: Good/Nhớ, 3: Easy/Rất dễ}`:
- **`q = 0` (Quên):** `repetitions = 0`, `interval_days = 0`, `ease_factor = Math.max(1.3, ease_factor - 0.2)`, `lapses += 1`, `status = 'LEARNING'`, `next_review_at = NOW() + 10 minutes`.
- **`q = 1` (Khó):** `interval_days = Math.max(1, Math.round(interval_days * 1.2))`, `ease_factor = Math.max(1.3, ease_factor - 0.15)`, `status = 'REVIEW'`.
- **`q = 2` (Nhớ):**
  - If `repetitions === 0` -> `interval_days = 1`
  - Else if `repetitions === 1` -> `interval_days = 3`
  - Else -> `interval_days = Math.round(interval_days * ease_factor)`
  - `repetitions += 1`, `status = interval_days > 21 ? 'MASTERED' : 'REVIEW'`.
- **`q = 3` (Rất dễ):**
  - If `repetitions === 0` -> `interval_days = 4`
  - Else -> `interval_days = Math.round(interval_days * ease_factor * 1.3)`
  - `repetitions += 1`, `ease_factor += 0.15`, `status = interval_days > 21 ? 'MASTERED' : 'REVIEW'`.

---

## 4. Coding Conventions & UX Requirements
- **Keyboard Shortcuts in Study Modes:** Always bind `Space` (Flip card), `1` / `2` / `3` / `4` (Select quiz option or grade SRS), and `R` (Replay audio).
- **Audio Preloading:** Preload the next card's `.mp3` audio in the browser so audio playback has zero latency when advancing cards.
- **Language-Specific JSON Metadata (`vocabularies.language_metadata`):**
  - For Chinese (`ZH`): Expect `{"traditional": "堅持", "radical": "土", "strokes": 7, "pinyin_numbered": "jian1chi2", "pinyin_plain": "jianchi", "character_breakdown": [{"char": "坚", "hanviet": "kiên", "meaning": "cứng cỏi"}], "word_bank_tokens": ["坚", "持", "竖", "特", "待", "持"]}`.
  - For English (`EN`): Expect `{"synonyms": [...], "antonyms": [...], "collocations": [...]}`.
