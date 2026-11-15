import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'oxford_3000_structured_4tiers.json');
const SAVE_INTERVAL = 200; // Tự động lưu tiến độ sau mỗi 200 từ

// Bộ nhớ đệm lưu kết quả tra cứu ảnh Wikipedia theo batch
const wikiBatchImageCache = new Map();

/**
 * Hàm tạm nghỉ giúp giãn nhịp gọi API công cộng, tránh bị giới hạn lượt (HTTP 429)
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Chuẩn hóa từ khóa tiếng Anh để tra từ điển (lấy từ đầu tiên trước dấu phẩy, bỏ ký hiệu ™, chuẩn hóa dấu nháy)
 */
function normalizeLookupWord(rawWord) {
  if (!rawWord) return '';
  return String(rawWord)
    .split(',')[0]
    .replace(/™/g, '')
    .replace(/’/g, "'")
    .trim()
    .toLowerCase();
}

/**
 * 1. Phân loại từ vựng cần lấy ảnh (Tránh ảnh rác cho từ hư/từ ngữ pháp)
 */
function shouldFetchImage(partOfSpeech = '') {
  if (!partOfSpeech) return false;

  const cleaned = String(partOfSpeech)
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(auxiliary|modal)\s+v\./g, '');

  const tokens = cleaned
    .split(/[,/]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const visualPos = new Set(['n.', 'noun.', 'noun', 'v.', 'verb', 'adj.', 'adjective', 'number']);
  return tokens.some((token) => visualPos.has(token));
}

function isValidWikiImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  const trimmed = imageUrl.trim();
  if (!trimmed || trimmed.length > 500) return false;

  const invalidImagePattern =
    /(\.svg|wiktionary|question_book|disambig|commons-logo|flag_of_|ambox|padlock|edit-clear|symbol_)/i;
  return !invalidImagePattern.test(trimmed);
}

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

async function fetchWikipediaImage(word, senseNote) {
  const cleanWord = String(word || '').split(',')[0].trim();
  if (!cleanWord) return null;

  if (senseNote && String(senseNote).trim() !== '') {
    const cleanSense = String(senseNote).trim();
    const senseImg = await queryWikipediaSummaryRest(`${cleanWord}_(${cleanSense})`);
    if (senseImg) return senseImg;
  }

  return await queryWikipediaSummaryRest(cleanWord);
}

async function prefetchWikipediaBatchCache(cards) {
  const queryTitlesSet = new Set();
  for (const card of cards) {
    if (!shouldFetchImage(card.part_of_speech)) continue;
    const cleanWord = String(card.word || '').split(',')[0].trim();
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
        await sleep(2000);
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
      await sleep(220);
    } catch {
      // Bỏ qua nếu lỗi mạng
    }
  }
}

/**
 * Tải kho phiên âm IPA chuẩn (US & UK, > 125.000 từ) từ open-dict-data/ipa-dict
 */
async function loadIpaDictionaries() {
  console.log('📖 Đang tải bộ phiên âm IPA chuẩn (US & UK) từ ipa-dict...');
  const parseIpaFile = (text) => {
    const map = new Map();
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const tabIndex = line.indexOf('\t');
      if (tabIndex > 0) {
        const word = line.slice(0, tabIndex).trim().toLowerCase();
        const ipa = line.slice(tabIndex + 1).split(',')[0].trim();
        if (word && ipa && !map.has(word)) {
          map.set(word, ipa);
        }
      }
    }
    return map;
  };

  try {
    const [usRes, ukRes] = await Promise.all([
      fetch('https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_US.txt', {
        signal: AbortSignal.timeout(15000),
      }),
      fetch('https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_UK.txt', {
        signal: AbortSignal.timeout(15000),
      }),
    ]);

    const usText = usRes.ok ? await usRes.text() : '';
    const ukText = ukRes.ok ? await ukRes.text() : '';
    const usMap = parseIpaFile(usText);
    const ukMap = parseIpaFile(ukText);
    console.log(`✅ Đã nạp ${usMap.size} phiên âm US và ${ukMap.size} phiên âm UK.`);
    return { usMap, ukMap };
  } catch (err) {
    console.warn('⚠️ Không tải được ipa-dict, sẽ dùng fallback từ điển API:', err.message);
    return { usMap: new Map(), ukMap: new Map() };
  }
}

/**
 * Tra cứu IPA từ Map cho từ đơn hoặc cụm 2 từ (ví dụ: "because of", "ice cream")
 */
function lookupIpaFromMap(cleanWord, primaryMap, secondaryMap) {
  if (!cleanWord) return null;

  if (primaryMap.has(cleanWord)) return primaryMap.get(cleanWord);
  if (secondaryMap.has(cleanWord)) return secondaryMap.get(cleanWord);

  // Thử bỏ dấu gạch nối (VD: wi-fi -> wifi)
  const noHyphen = cleanWord.replace(/-/g, '');
  if (primaryMap.has(noHyphen)) return primaryMap.get(noHyphen);

  // Nếu là cụm nhiều từ (VD: "because of", "ice cream"), ghép IPA từng từ lại
  const parts = cleanWord.split(/[\s-]+/).filter(Boolean);
  if (parts.length > 1) {
    const partIpas = [];
    for (let i = 0; i < parts.length; i++) {
      const pIpa = primaryMap.get(parts[i]) || secondaryMap.get(parts[i]);
      if (pIpa) {
        partIpas.push(pIpa.replace(/^\/|\/$/g, ''));
      }
    }
    if (partIpas.length === parts.length) {
      return `/${partIpas.join(' ')}/`;
    }
  }

  return null;
}

/**
 * Tải từ điển Wordset (A-Z, ~107.000 từ) để lấy sẵn câu ví dụ và từ đồng nghĩa chất lượng cao
 */
async function loadWordsetDictionary() {
  console.log('📚 Đang tải bộ từ điển câu ví dụ & từ đồng nghĩa (Wordset A-Z)...');
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const dict = new Map();

  try {
    await Promise.all(
      letters.map(async (ch) => {
        const res = await fetch(
          `https://raw.githubusercontent.com/wordset/wordset-dictionary/master/data/${ch}.json`,
          { signal: AbortSignal.timeout(15000) }
        );
        if (res.ok) {
          const data = await res.json();
          for (const [key, val] of Object.entries(data)) {
            dict.set(key.toLowerCase(), val);
          }
        }
      })
    );
    console.log(`✅ Đã nạp ${dict.size} mục từ điển Wordset.`);
  } catch (err) {
    console.warn('⚠️ Lỗi tải một phần Wordset:', err.message);
  }
  return dict;
}

/**
 * Chuẩn hóa câu ví dụ cho đẹp (viết hoa chữ cái đầu, thêm dấu chấm nếu thiếu)
 */
function formatExampleSentence(sentence) {
  if (!sentence) return '';
  let text = String(sentence).trim().replace(/^["']|["']$/g, '');
  if (!text) return '';
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!/[.!?]$/.test(text)) {
    text += '.';
  }
  return text;
}

/**
 * Kiểm tra xem thẻ hiện tại đã có IPA thật (không phải fallback /từ/) chưa
 */
function hasRealIpa(card) {
  if (!card.phonetic_primary) return false;
  const fallbackIpa = `/${normalizeLookupWord(card.word)}/`;
  const rawFallback = `/${String(card.word || '').split(',')[0].trim().toLowerCase()}/`;
  return card.phonetic_primary !== fallbackIpa && card.phonetic_primary !== rawFallback;
}

/**
 * Kiểm tra xem thẻ hiện tại đã có câu ví dụ thật (không phải câu mẫu chung) chưa
 */
function hasRealExample(card) {
  if (!card.example_sentence) return false;
  return !card.example_sentence.startsWith('This is an example sentence with the word');
}

/**
 * Kiểm tra xem thẻ hiện tại đã có nghĩa tiếng Việt thật (không bị rơi về từ tiếng Anh) chưa
 */
function hasRealMeaning(card) {
  if (!card.meaning_vi || card.meaning_vi.trim() === '') return false;
  const meaningLower = card.meaning_vi.trim().toLowerCase();
  const wordLower = String(card.word || '').trim().toLowerCase();
  const cleanWordLower = normalizeLookupWord(card.word);
  if (meaningLower === wordLower || meaningLower === cleanWordLower) return false;
  if (/^\[[ab][12]\]\s/i.test(meaningLower)) return false;
  return true;
}

/**
 * Gọi Free Dictionary API có kiểm soát tốc độ và tự thử lại khi gặp 429
 */
async function fetchDictionaryInfo(word) {
  const cleanWord = normalizeLookupWord(word);
  if (!cleanWord) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.status === 429) {
        await sleep(1800 * (attempt + 1));
        continue;
      }
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
                exampleSentence = formatExampleSentence(d.example);
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
  return null;
}

/**
 * Fallback cuối cùng lấy câu ví dụ song ngữ Anh-Việt thật từ Tatoeba
 */
async function fetchTatoebaExample(word) {
  const cleanWord = normalizeLookupWord(word);
  if (!cleanWord) return null;

  try {
    const url = `https://tatoeba.org/en/api_v0/search?from=eng&to=vie&query=${encodeURIComponent(cleanWord)}&orphans=no&sort=relevance`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return null;
    const data = await res.json();
    const first = data?.results?.[0];
    if (first && first.text) {
      const viTrans = first.translations?.flat()?.[0]?.text || '';
      return {
        example_sentence: formatExampleSentence(first.text),
        example_meaning_vi: viTrans.trim(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Dịch đơn lẻ 1 đoạn text sang Tiếng Việt (có retry khi 429)
 */
async function translateSingle(text) {
  if (!text) return '';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (res.status === 429) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      if (!res.ok) return '';
      const data = await res.json();
      return data[0].map((item) => item[0]).join('').trim();
    } catch {
      await sleep(500);
    }
  }
  return '';
}

/**
 * Dịch hàng loạt theo lô (batch) ngăn cách bằng ký tự xuống dòng để cực nhanh và tránh 429
 */
async function translateBatch(textList) {
  if (!textList || textList.length === 0) return [];
  if (textList.length === 1) {
    return [await translateSingle(textList[0])];
  }

  // Làm sạch ký tự xuống dòng bên trong từng item để không làm lệch số dòng
  const sanitized = textList.map((t) => String(t).replace(/[\r\n]+/g, ' ').trim());
  const joined = sanitized.join('\n');

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(joined)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.status === 429) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      if (!res.ok) break;
      const data = await res.json();
      const translatedFull = data[0].map((item) => item[0]).join('');
      const lines = translatedFull.split('\n').map((l) => l.trim());
      if (lines.length === sanitized.length) {
        return lines;
      }
      break;
    } catch {
      await sleep(500);
    }
  }

  // Nếu Google gộp/tách dòng bị lệch số lượng thì chia nhỏ hơn để dịch từng item
  const fallbackResults = [];
  for (let i = 0; i < sanitized.length; i++) {
    fallbackResults.push(await translateSingle(sanitized[i]));
    await sleep(120);
  }
  return fallbackResults;
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

  // -------------------------------------------------------------------------
  // BƯỚC 1: Đồng bộ ảnh minh họa Wikipedia nếu có từ nào chưa xử lý image_url
  // -------------------------------------------------------------------------
  const cardsNeedingImage = allCards.filter((c) => c.image_url === undefined);
  if (cardsNeedingImage.length > 0) {
    console.log(`🖼️ Đang đồng bộ ảnh minh họa từ Wikipedia cho ${cardsNeedingImage.length} từ...`);
    await prefetchWikipediaBatchCache(cardsNeedingImage);
    for (const card of cardsNeedingImage) {
      card.image_url = shouldFetchImage(card.part_of_speech)
        ? (await fetchWikipediaImage(card.word, card.sense_note)) ?? null
        : null;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');
  }

  // -------------------------------------------------------------------------
  // BƯỚC 2: Nạp từ điển IPA (125.000+ từ) và Wordset (107.000+ từ)
  // -------------------------------------------------------------------------
  const [{ usMap, ukMap }, wordsetDict] = await Promise.all([
    loadIpaDictionaries(),
    loadWordsetDictionary(),
  ]);

  let ipaFilled = 0;
  let exampleFromWordset = 0;

  for (let i = 0; i < allCards.length; i++) {
    const card = allCards[i];
    const cleanWord = normalizeLookupWord(card.word);

    // 2A. Điền IPA chuẩn US & UK nếu thẻ chưa có IPA thật
    if (!hasRealIpa(card)) {
      const ipaUS = lookupIpaFromMap(cleanWord, usMap, ukMap);
      const ipaUK = lookupIpaFromMap(cleanWord, ukMap, usMap);
      if (ipaUS) {
        card.phonetic_primary = ipaUS;
        card.phonetic_secondary = ipaUK || ipaUS;
        ipaFilled++;
      }
    }

    // 2B. Điền câu ví dụ & từ đồng nghĩa từ Wordset nếu chưa có ví dụ thật
    if (!hasRealExample(card)) {
      const entry = wordsetDict.get(cleanWord);
      if (entry && Array.isArray(entry.meanings)) {
        let pickedExample = '';
        const syns = new Set(card.language_metadata?.synonyms || []);

        for (let j = 0; j < entry.meanings.length; j++) {
          const m = entry.meanings[j];
          if (!pickedExample && m.example) {
            pickedExample = formatExampleSentence(m.example);
          }
          if (Array.isArray(m.synonyms)) {
            for (const s of m.synonyms.slice(0, 4)) syns.add(s);
          }
        }

        if (pickedExample) {
          card.example_sentence = pickedExample;
          card.example_meaning_vi = ''; // Đánh dấu cần dịch lại câu ví dụ mới
          exampleFromWordset++;
        }
        if (card.language_metadata && syns.size > 0) {
          card.language_metadata.synonyms = Array.from(syns).slice(0, 5);
        }
      }
    }
  }

  console.log(
    `✅ Sau bước từ điển Offline: Đã bổ sung ${ipaFilled} IPA chuẩn, ${exampleFromWordset} câu ví dụ thật từ Wordset.`
  );
  fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');

  // -------------------------------------------------------------------------
  // BƯỚC 3: Với những từ còn thiếu ví dụ thật hoặc IPA, gọi Free Dictionary API + Tatoeba
  // -------------------------------------------------------------------------
  const cardsStillNeedingDict = [];
  for (let i = 0; i < allCards.length; i++) {
    const c = allCards[i];
    if (!hasRealIpa(c) || !hasRealExample(c)) {
      cardsStillNeedingDict.push(c);
    }
  }

  if (cardsStillNeedingDict.length > 0) {
    console.log(
      `🌐 Còn ${cardsStillNeedingDict.length} từ cần tìm thêm ví dụ/IPA qua DictionaryAPI & Tatoeba...`
    );
    const dictCache = new Map();
    const CONCURRENCY = 4;

    for (let i = 0; i < cardsStillNeedingDict.length; i += CONCURRENCY) {
      const batch = cardsStillNeedingDict.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (card) => {
          const key = normalizeLookupWord(card.word);
          if (!dictCache.has(key)) {
            let info = await fetchDictionaryInfo(card.word);
            if (!info || !info.example_sentence) {
              const tato = await fetchTatoebaExample(card.word);
              if (tato && tato.example_sentence) {
                info = {
                  ...(info || {}),
                  example_sentence: tato.example_sentence,
                  example_meaning_vi: tato.example_meaning_vi,
                };
              }
            }
            dictCache.set(key, info);
          }

          const cached = dictCache.get(key);
          if (cached) {
            if (!hasRealIpa(card) && cached.phonetic_primary) {
              card.phonetic_primary = cached.phonetic_primary;
              card.phonetic_secondary = cached.phonetic_secondary || cached.phonetic_primary;
            }
            if (!hasRealExample(card) && cached.example_sentence) {
              card.example_sentence = cached.example_sentence;
              card.example_meaning_vi = cached.example_meaning_vi || '';
            }
            if (card.language_metadata) {
              if (cached.synonyms?.length && (!card.language_metadata.synonyms || card.language_metadata.synonyms.length === 0)) {
                card.language_metadata.synonyms = cached.synonyms;
              }
              if (cached.antonyms?.length && (!card.language_metadata.antonyms || card.language_metadata.antonyms.length === 0)) {
                card.language_metadata.antonyms = cached.antonyms;
              }
            }
          }
        })
      );

      process.stdout.write(
        `\r⏳ Tìm ví dụ/IPA online: ${Math.min(i + CONCURRENCY, cardsStillNeedingDict.length)}/${cardsStillNeedingDict.length} từ...`
      );
      if ((i + CONCURRENCY) % SAVE_INTERVAL < CONCURRENCY) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');
      }
      await sleep(160);
    }
    console.log('');
    fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');
  }

  // -------------------------------------------------------------------------
  // BƯỚC 4: Dịch hàng loạt Nghĩa tiếng Việt (meaning_vi) cho các từ còn thiếu
  // -------------------------------------------------------------------------
  const cardsNeedingMeaning = [];
  for (let i = 0; i < allCards.length; i++) {
    if (!hasRealMeaning(allCards[i])) {
      cardsNeedingMeaning.push(allCards[i]);
    }
  }

  if (cardsNeedingMeaning.length > 0) {
    console.log(`🇻🇳 Đang dịch nghĩa tiếng Việt theo lô cho ${cardsNeedingMeaning.length} từ...`);
    const BATCH_SIZE = 25;
    for (let i = 0; i < cardsNeedingMeaning.length; i += BATCH_SIZE) {
      const batch = cardsNeedingMeaning.slice(i, i + BATCH_SIZE);
      const queries = batch.map((card) =>
        card.sense_note
          ? `${card.word.split(',')[0].trim()} (${card.sense_note})`
          : card.word.split(',')[0].trim()
      );
      const translated = await translateBatch(queries);

      for (let j = 0; j < batch.length; j++) {
        if (translated[j] && translated[j].trim() !== '') {
          batch[j].meaning_vi = translated[j].trim();
        }
      }

      process.stdout.write(
        `\r⏳ Dịch nghĩa từ: ${Math.min(i + BATCH_SIZE, cardsNeedingMeaning.length)}/${cardsNeedingMeaning.length} từ...`
      );
      await sleep(220);
    }
    console.log('');
    fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');
  }

  // -------------------------------------------------------------------------
  // BƯỚC 5: Dịch hàng loạt Nghĩa câu ví dụ (example_meaning_vi) cho các câu mới
  // -------------------------------------------------------------------------
  const cardsNeedingExVi = [];
  for (let i = 0; i < allCards.length; i++) {
    const c = allCards[i];
    if (
      c.example_sentence &&
      (!c.example_meaning_vi || c.example_meaning_vi.trim() === '' || c.example_meaning_vi.startsWith('Đây là câu ví dụ với từ'))
    ) {
      cardsNeedingExVi.push(c);
    }
  }

  if (cardsNeedingExVi.length > 0) {
    console.log(`📝 Đang dịch nghĩa tiếng Việt cho ${cardsNeedingExVi.length} câu ví dụ...`);
    const BATCH_SIZE = 15;
    for (let i = 0; i < cardsNeedingExVi.length; i += BATCH_SIZE) {
      const batch = cardsNeedingExVi.slice(i, i + BATCH_SIZE);
      const queries = batch.map((c) => c.example_sentence);
      const translated = await translateBatch(queries);

      for (let j = 0; j < batch.length; j++) {
        if (translated[j] && translated[j].trim() !== '') {
          batch[j].example_meaning_vi = translated[j].trim();
        }
      }

      process.stdout.write(
        `\r⏳ Dịch câu ví dụ: ${Math.min(i + BATCH_SIZE, cardsNeedingExVi.length)}/${cardsNeedingExVi.length} câu...`
      );
      if ((i + BATCH_SIZE) % 150 < BATCH_SIZE) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');
      }
      await sleep(220);
    }
    console.log('');
  }

  // Lưu file lần cuối và báo cáo tổng kết chất lượng thực tế
  fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');

  let finalRealMeaning = 0;
  let finalRealIpa = 0;
  let finalRealExample = 0;
  let finalWithImage = 0;

  for (let i = 0; i < allCards.length; i++) {
    const c = allCards[i];
    if (hasRealMeaning(c)) finalRealMeaning++;
    if (hasRealIpa(c)) finalRealIpa++;
    if (hasRealExample(c)) finalRealExample++;
    if (c.image_url) finalWithImage++;
  }

  console.log('\n==================================================');
  console.log(`🎉 HOÀN TẤT BỔ SUNG DỮ LIỆU THẬT CHO ${allCards.length} TỪ!`);
  console.log(`- Có nghĩa tiếng Việt thật: ${finalRealMeaning}/${allCards.length}`);
  console.log(`- Có phiên âm IPA chuẩn từ điển: ${finalRealIpa}/${allCards.length}`);
  console.log(`- Có câu ví dụ thật: ${finalRealExample}/${allCards.length}`);
  console.log(`- Có ảnh minh họa Wikipedia: ${finalWithImage}/${allCards.length}`);
  console.log('==================================================');
}

runEnrich();
