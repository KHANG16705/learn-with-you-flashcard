import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'oxford_3000_structured_4tiers.json');

async function seedDecks() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ Không tìm thấy file dữ liệu:', DATA_FILE);
    console.error('👉 Hãy copy file oxford_3000_structured_4tiers.json vào thư mục backend/scripts/data/ trước.');
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const connection = await pool.getConnection();

  try {
    console.log(`🚀 Bắt đầu nạp dữ liệu "${payload.dataset_name}" vào MySQL...`);
    await connection.beginTransaction();

    let totalDecksInserted = 0;
    let totalUnitsInserted = 0;
    let totalVocabsProcessed = 0;
    let totalDeckCardsInserted = 0;

    for (const levelObj of payload.levels) {
      for (const deck of levelObj.decks) {
        // 1. Nạp hoặc cập nhật Bộ thẻ (Bảng decks)
        const [deckResult] = await connection.execute(
          `INSERT INTO decks (slug, title_vi, title_target, description, language, level_tag, tags, total_cards, is_system)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title_vi = VALUES(title_vi),
             title_target = VALUES(title_target),
             description = VALUES(description),
             level_tag = VALUES(level_tag),
             tags = VALUES(tags),
             total_cards = VALUES(total_cards),
             id = LAST_INSERT_ID(id)`,
          [
            deck.slug,
            deck.title_vi,
            deck.title_target ?? null,
            deck.description ?? null,
            deck.language || 'EN',
            deck.level_tag,
            JSON.stringify(deck.tags || []),
            deck.total_cards || 0,
            deck.is_system ?? 1
          ]
        );
        const deckId = deckResult.insertId;
        totalDecksInserted++;
        console.log(`\n📦 Đang xử lý Bộ thẻ: ${deck.title_vi} (deck_id = ${deckId}, ${deck.total_units} Units)`);

        // Xóa các chặng Unit cũ của bộ thẻ này trước khi nạp lại danh sách Unit theo Chủ đề mới
        // (Bảng user_vocab_progress liên kết theo vocab_id nên tiến độ học của User được giữ nguyên 100%)
        await connection.execute(`DELETE FROM deck_units WHERE deck_id = ?`, [deckId]);

        for (const unit of deck.units) {
          // 2. Nạp hoặc cập nhật Chặng 20 từ (Bảng deck_units)
          const [unitResult] = await connection.execute(
            `INSERT INTO deck_units (deck_id, unit_number, title, card_count)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               title = VALUES(title),
               card_count = VALUES(card_count),
               id = LAST_INSERT_ID(id)`,
            [deckId, unit.unit_number, unit.title, unit.card_count]
          );
          const unitId = unitResult.insertId;
          totalUnitsInserted++;

          for (const card of unit.cards) {
            const word = card.word.trim();
            const lang = card.language || 'EN';
            const pos = card.part_of_speech || '';
            const meaningVi = card.meaning_vi && card.meaning_vi.trim() !== ''
              ? card.meaning_vi.trim()
              : `[${card.cefr_level}] ${word} (${pos})`;

            // 3. Kiểm tra hoặc thêm mới vào Kho từ vựng gốc (Bảng vocabularies)
            const [existingVocab] = await connection.execute(
              `SELECT id FROM vocabularies
               WHERE language = ? AND word = ? AND part_of_speech = ? AND creator_id IS NULL
               LIMIT 1`,
              [lang, word, pos]
            );

            let vocabId;
            if (existingVocab.length > 0) {
              vocabId = existingVocab[0].id;
              await connection.execute(
                `UPDATE vocabularies
                 SET phonetic_primary = COALESCE(?, phonetic_primary),
                     phonetic_secondary = COALESCE(?, phonetic_secondary),
                     meaning_vi = ?,
                     language_metadata = ?,
                     distractors = ?
                 WHERE id = ?`,
                [
                  card.phonetic_primary ?? null,
                  card.phonetic_secondary ?? null,
                  meaningVi,
                  JSON.stringify(card.language_metadata || {}),
                  JSON.stringify(card.distractors || []),
                  vocabId
                ]
              );
            } else {
              const [vocabInsert] = await connection.execute(
                `INSERT INTO vocabularies
                 (language, word, part_of_speech, phonetic_primary, phonetic_secondary, meaning_vi, audio_word_url, language_metadata, distractors, creator_id)
                 VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)`,
                [
                  lang,
                  word,
                  pos,
                  card.phonetic_primary ?? null,
                  card.phonetic_secondary ?? null,
                  meaningVi,
                  JSON.stringify(card.language_metadata || {}),
                  JSON.stringify(card.distractors || [])
                ]
              );
              vocabId = vocabInsert.insertId;
            }
            totalVocabsProcessed++;

            // 4. Liên kết từ vựng vào Bộ thẻ & Unit (Bảng deck_cards) kèm image_url
            await connection.execute(
              `INSERT INTO deck_cards
               (deck_id, unit_id, vocab_id, order_index, custom_meaning_vi, example_sentence, example_pinyin, example_meaning_vi, audio_example_url, image_url, is_deleted)
               VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, 0)
               ON DUPLICATE KEY UPDATE
                 unit_id = VALUES(unit_id),
                 order_index = VALUES(order_index),
                 custom_meaning_vi = VALUES(custom_meaning_vi),
                 example_sentence = COALESCE(VALUES(example_sentence), example_sentence),
                 example_meaning_vi = COALESCE(VALUES(example_meaning_vi), example_meaning_vi),
                 image_url = COALESCE(VALUES(image_url), image_url),
                 is_deleted = 0`,
              [
                deckId,
                unitId,
                vocabId,
                card.order_index,
                card.custom_meaning_vi ?? null,
                card.example_sentence ?? null,
                card.example_meaning_vi ?? null,
                card.image_url ?? null
              ]
            );
            totalDeckCardsInserted++;

            // 5. Đồng bộ sang bảng Từ điển nền (dictionary_entries) phục vụ tra nhanh & Auto-fill
            await connection.execute(
              `INSERT INTO dictionary_entries (language, word, part_of_speech, phonetic_primary, phonetic_secondary, meaning_vi, metadata)
               SELECT ?, ?, ?, ?, ?, ?, ?
               FROM DUAL
               WHERE NOT EXISTS (
                 SELECT 1 FROM dictionary_entries WHERE language = ? AND word = ? AND part_of_speech = ? LIMIT 1
               )`,
              [
                lang,
                word,
                pos,
                card.phonetic_primary ?? null,
                card.phonetic_secondary ?? null,
                meaningVi,
                JSON.stringify(card.language_metadata || {}),
                lang,
                word,
                pos
              ]
            );
          }
        }
      }
    }

    await connection.commit();
    console.log('\n==================================================');
    console.log('🎉 HOÀN TẤT NẠP DỮ LIỆU OXFORD 3000 VÀO MYSQL!');
    console.log(`- Tổng số Bộ thẻ (decks): ${totalDecksInserted}`);
    console.log(`- Tổng số Chặng 20 từ (deck_units): ${totalUnitsInserted}`);
    console.log(`- Tổng số Từ vựng (vocabularies): ${totalVocabsProcessed}`);
    console.log(`- Tổng số Thẻ liên kết (deck_cards): ${totalDeckCardsInserted}`);
    console.log('==================================================');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Lỗi trong quá trình seed dữ liệu (Đã Rollback):', error);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

seedDecks();
