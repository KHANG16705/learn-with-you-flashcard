import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'oxford_3000_structured_4tiers.json');
const CONCURRENCY = 12; // Chạy 12 luồng song song để tốc độ xử lý 3.004 từ nhanh hơn
const SAVE_INTERVAL = 100; // Tự động lưu tiến độ sau mỗi 100 từ

// Bộ nhớ đệm lưu kết quả tra cứu ảnh Wikipedia theo batch để tránh lỗi HTTP 429 khi chạy 3.004 từ
const wikiBatchImageCache = new Map();

/**
 * 1. Phân loại từ vựng cần lấy ảnh (Tránh ảnh rác cho từ hư/từ ngữ pháp):
 * Chỉ gọi API tìm ảnh nếu card.part_of_speech chứa ít nhất một trong các từ loại
 * mang hình tượng cụ thể: Danh từ (n., noun.), Động từ (v. - trừ auxiliary v. và modal v.),
 * Tính từ (adj.), hoặc Số đếm (number).
 */
function shouldFetchImage(partOfSpeech = '') {
  if (!partOfSpeech) return false;

  const cleaned = String(partOfSpeech)
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // Bỏ ghi chú trong ngoặc như (#1), (money)
    .replace(/\b(auxiliary|modal)\s+v\./g, ''); // Loại bỏ auxiliary v. và modal v.

  const tokens = cleaned
    .split(/[,/]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const visualPos = new Set(['n.', 'noun.', 'noun', 'v.', 'verb', 'adj.', 'adjective', 'number']);
  return tokens.some((token) => visualPos.has(token));
}

/**
 * Kiểm tra URL ảnh Wikipedia hợp lệ (<= 500 ký tự, không phải ảnh .svg biểu tượng, cờ, disambig...)
 */
function isValidWikiImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  const trimmed = imageUrl.trim();
  if (!trimmed || trimmed.length > 500) return false;

  const invalidImagePattern =
    /(\.svg|wiktionary|question_book|disambig|commons-logo|flag_of_|ambox|padlock|edit-clear|symbol_)/i;
  return !invalidImagePattern.test(trimmed);
}

/**
 * Gọi trực tiếp endpoint chính thức:
 * https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(queryTitle)}
 */
async function queryWikipediaSummaryRest(queryTitle) {
  const normalizedKey = String(queryTitle).trim().toLowerCase();
  if (wikiBatchImageCache.has(normalizedKey)) {
    return wikiBatchImageCache.get(normalizedKey);
  }

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(queryTitle)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'FlashcardSRSApp/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data.type !== 'disambiguation' && data.thumbnail?.source) {
      const sourceUrl = String(data.thumbnail.source).trim();
      if (isValidWikiImageUrl(sourceUrl)) {
        return sourceUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 2. Hàm fetchWikipediaImage(word, senseNote) theo đúng đặc tả:
 * - Lấy từ đầu tiên nếu word có dấu phẩy (VD: "a, an" -> "a").
 * - Nếu có sense_note (VD: word="bank", sense_note="river"), ưu tiên thử "${cleanWord}_(${senseNote})"
 *   trước; nếu không có ảnh mới fallback về "${cleanWord}".
 */
async function fetchWikipediaImage(word, senseNote) {
  const cleanWord = String(word || '')
    .split(',')[0]
    .trim();
  if (!cleanWord) return null;

  if (senseNote && String(senseNote).trim() !== '') {
    const cleanSense = String(senseNote).trim();
    const senseQuery = `${cleanWord}_(${cleanSense})`;
    const senseImg = await queryWikipediaSummaryRest(senseQuery);
    if (senseImg) return senseImg;
  }

  return await queryWikipediaSummaryRest(cleanWord);
}

/**
 * Nạp trước (Batch Prefetch) ảnh Wikipedia cho danh sách từ vựng bằng gói 50 từ/request
 * để tránh bị chặn IP (HTTP 429) khi làm giàu 3.004 từ liên tiếp.
 */
async function prefetchWikipediaBatchCache(cards) {
  const queryTitlesSet = new Set();
  for (const card of cards) {
    if (!shouldFetchImage(card.part_of_speech)) continue;
    const cleanWord = String(card.word || '')
      .split(',')[0]
      .trim();
    if (!cleanWord) continue;
    if (card.sense_note && String(card.sense_note).trim() !== '') {
      queryTitlesSet.add(`${cleanWord}_(${String(card.sense_note).trim()})`);
    }
    queryTitlesSet.add(cleanWord);
  }

  const allTitles = Array.from(queryTitlesSet);
  const CHUNK_SIZE = 50;

  for (let i = 0; i < allTitles.length; i += CHUNK_SIZE) {
    const chunk = allTitles.slice(i, i + CHUNK_SIZE);
    const joinedTitles = chunk.join('|');
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=400&redirects=1&format=json&titles=${encodeURIComponent(joinedTitles)}`;

    try {
      let res = await fetch(url, {
        headers: {
          'User-Agent': 'FlashcardSRSApp/1.0 (https://localhost; contact@flashcardsrs.local)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2000));
        res = await fetch(url, {
          headers: {
            'User-Agent': 'FlashcardSRSApp/1.0 (https://localhost; contact@flashcardsrs.local)',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });
      }

      if (res.ok) {
        const data = await res.json();
        const pages = data?.query?.pages || {};
        const redirects = data?.query?.redirects || [];
        const normalized = data?.query?.normalized || [];

        const titleToThumbnail = new Map();
        for (const page of Object.values(pages)) {
          const isDisambig =
            page?.pageprops && Object.prototype.hasOwnProperty.call(page.pageprops, 'disambiguation');
          const thumbSource = page?.thumbnail?.source;
          if (!isDisambig && isValidWikiImageUrl(thumbSource)) {
            titleToThumbnail.set(String(page.title).toLowerCase(), thumbSource.trim());
          }
        }

        // Ánh xạ ngược qua bảng redirects & normalized của Wikipedia
        const redirectMap = new Map();
        for (const r of redirects) {
          redirectMap.set(String(r.from).toLowerCase(), String(r.to).toLowerCase());
        }
        const normMap = new Map();
        for (const n of normalized) {
          normMap.set(String(n.from).toLowerCase(), String(n.to).toLowerCase());
        }

        for (const rawTitle of chunk) {
          const key = rawTitle.toLowerCase();
          let resolved = normMap.get(key) || key;
          resolved = redirectMap.get(resolved) || resolved;
          const img = titleToThumbnail.get(resolved) || titleToThumbnail.get(key) || null;
          wikiBatchImageCache.set(key, img);
        }
      }
      await new Promise((r) => setTimeout(r, 220));
    } catch {
      // Nếu lỗi batch thì từng từ sẽ tự fallback về queryWikipediaSummaryRest
    }
  }
}

// Lấy Phiên âm IPA (US/UK), câu ví dụ & từ đồng nghĩa từ Free Dictionary API
async function fetchDictionaryInfo(word) {
  const cleanWord = word.split(',')[0].trim();
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];
    let ipaUS = entry.phonetic || null;
    let ipaUK = null;

    if (Array.isArray(entry.phonetics)) {
      for (const p of entry.phonetics) {
        if (p.text) {
          if (!ipaUS) ipaUS = p.text;
          if (p.audio && p.audio.includes('-us')) ipaUS = p.text;
          if (p.audio && p.audio.includes('-uk')) ipaUK = p.text;
        }
      }
    }

    let exampleSentence = null;
    const synonyms = new Set();
    const antonyms = new Set();

    if (Array.isArray(entry.meanings)) {
      for (const m of entry.meanings) {
        if (Array.isArray(m.synonyms)) m.synonyms.slice(0, 4).forEach((s) => synonyms.add(s));
        if (Array.isArray(m.antonyms)) m.antonyms.slice(0, 4).forEach((a) => antonyms.add(a));
        if (Array.isArray(m.definitions)) {
          for (const d of m.definitions) {
            if (!exampleSentence && d.example) {
              exampleSentence = d.example;
            }
          }
        }
      }
    }

    return {
      phonetic_primary: ipaUS,
      phonetic_secondary: ipaUK || ipaUS,
      example_sentence: exampleSentence,
      synonyms: Array.from(synonyms).slice(0, 5),
      antonyms: Array.from(antonyms).slice(0, 5),
    };
  } catch {
    return null;
  }
}

// Dịch tự động sang Tiếng Việt (Nghĩa của từ & Nghĩa câu ví dụ)
async function translateToVietnamese(text) {
  if (!text) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return '';
    const data = await res.json();
    return data[0].map((item) => item[0]).join('');
  } catch {
    return '';
  }
}

async function processCard(card) {
  // Điều kiện bỏ qua (skip) khi chạy lại script:
  // Nếu thẻ đã có đủ meaning_vi, phonetic_primary và đã từng xử lý trường image_url (card.image_url !== undefined)
  if (
    card.meaning_vi &&
    card.meaning_vi.trim() !== '' &&
    card.phonetic_primary &&
    card.image_url !== undefined
  ) {
    return false;
  }

  const hasMeaning = Boolean(card.meaning_vi && card.meaning_vi.trim() !== '');
  const hasIpa = Boolean(card.phonetic_primary);
  const hasImageChecked = card.image_url !== undefined;
  const queryText = card.sense_note ? `${card.word} (${card.sense_note})` : card.word;
  const needImage = shouldFetchImage(card.part_of_speech);

  // Gọi fetchWikipediaImage song song trong Promise.all cùng fetchDictionaryInfo và translateToVietnamese
  const [dictInfo, meaningVi, imageUrl] = await Promise.all([
    hasIpa && card.example_sentence ? Promise.resolve(null) : fetchDictionaryInfo(card.word),
    hasMeaning ? Promise.resolve(card.meaning_vi) : translateToVietnamese(queryText),
    hasImageChecked
      ? Promise.resolve(card.image_url)
      : needImage
        ? fetchWikipediaImage(card.word, card.sense_note)
        : Promise.resolve(null),
  ]);

  card.meaning_vi = meaningVi || card.word;
  card.image_url = imageUrl ?? null;

  if (dictInfo) {
    card.phonetic_primary = dictInfo.phonetic_primary;
    card.phonetic_secondary = dictInfo.phonetic_secondary;
    if (dictInfo.example_sentence) {
      card.example_sentence = dictInfo.example_sentence;
      card.example_meaning_vi = await translateToVietnamese(dictInfo.example_sentence);
    }
    if (card.language_metadata) {
      card.language_metadata.synonyms = dictInfo.synonyms;
      card.language_metadata.antonyms = dictInfo.antonyms;
    }
  }

  if (!card.example_sentence) {
    card.example_sentence = `This is an example sentence with the word "${card.word}".`;
    card.example_meaning_vi = `Đây là câu ví dụ với từ "${card.word}" (${card.meaning_vi}).`;
  }

  return true;
}

async function runEnrich() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ Không tìm thấy file:', DATA_FILE);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const allCards = [];

  for (const levelObj of rawData.levels) {
    for (const deck of levelObj.decks) {
      for (const unit of deck.units) {
        for (const card of unit.cards) {
          allCards.push(card);
        }
      }
    }
  }

  const cardsNeedingImage = allCards.filter((c) => c.image_url === undefined);
  if (cardsNeedingImage.length > 0) {
    console.log(
      `🖼️ Đang đồng bộ ảnh minh họa từ Wikipedia cho ${cardsNeedingImage.length} từ vựng...`
    );
    await prefetchWikipediaBatchCache(cardsNeedingImage);
  }

  console.log(
    `🚀 Bắt đầu tự động điền IPA, Nghĩa Tiếng Việt, Câu ví dụ & Ảnh minh họa cho ${allCards.length} từ...`
  );
  let processed = 0;
  let updatedCount = 0;

  for (let i = 0; i < allCards.length; i += CONCURRENCY) {
    const batch = allCards.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((card) => processCard(card)));
    processed += batch.length;
    updatedCount += results.filter(Boolean).length;

    process.stdout.write(
      `\r⏳ Tiến độ: ${processed}/${allCards.length} từ (Đã cập nhật mới: ${updatedCount})...`
    );

    if (updatedCount > 0 && processed % SAVE_INTERVAL < CONCURRENCY) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');
    }
  }

  const totalWithImages = allCards.filter((c) => Boolean(c.image_url)).length;
  fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');
  console.log(
    `\n✅ Hoàn tất làm giàu dữ liệu cho ${allCards.length} từ (Tổng số từ có ảnh minh họa: ${totalWithImages})! File đã được lưu tại: ${DATA_FILE}`
  );
}

runEnrich();
