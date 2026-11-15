/**
 * Bộ hàm kiểm tra đáp án đa ngôn ngữ (Tiếng Anh & Tiếng Trung)
 * Phục vụ Chế độ 3 (Active Recall: Word Bank & Typing) và Chế độ 4 (Guided Combo)
 */

/**
 * Tạo gợi ý khung ký tự cho từ tiếng Anh
 * Ví dụ: "resilient" -> "r _ s _ l _ e _ t"
 * @param {string} word
 * @returns {string}
 */
export function generateWordMask(word = '') {
  const cleanWord = String(word).trim();
  if (!cleanWord) return '';

  const len = cleanWord.length;
  if (len === 1) return '_';
  if (len === 2) return `${cleanWord[0]} _`;

  const chars = Array.from(cleanWord);
  const masked = chars.map((ch, idx) => {
    // Giữ nguyên khoảng trắng hoặc dấu gạch nối
    if (ch === ' ' || ch === '-') return ch;
    // Giữ chữ cái đầu và chữ cái cuối
    if (idx === 0 || idx === len - 1) return ch;
    // Giữ các vị trí chẵn xen kẽ (nhưng tránh lộ sát chữ cuối nếu độ dài chẵn)
    if (idx % 2 === 0 && idx < len - 2) return ch;
    return '_';
  });

  return masked.join(' ');
}

/**
 * Chuẩn hóa chuỗi tiếng Anh (trim, lowercase, gộp khoảng trắng thừa)
 * @param {string} str
 * @returns {string}
 */
function normalizeEnglishText(str = '') {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Kiểm tra chính tả tiếng Anh
 * @param {string} userInput
 * @param {string} targetWord
 * @returns {{ isCorrect: boolean, normalizedInput: string, targetWord: string }}
 */
export function validateEnglishSpelling(userInput = '', targetWord = '') {
  const normalizedInput = normalizeEnglishText(userInput);
  const normalizedTarget = normalizeEnglishText(targetWord);

  return {
    isCorrect: Boolean(normalizedTarget) && normalizedInput === normalizedTarget,
    normalizedInput,
    targetWord: normalizedTarget,
  };
}

/**
 * Bỏ dấu thanh điệu khỏi chuỗi Pinyin (VD: "jiān chí" -> "jian chi")
 * @param {string} pinyin
 * @returns {string}
 */
function stripPinyinTones(pinyin = '') {
  return String(pinyin)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ü/gi, 'v');
}

/**
 * Chuẩn hóa chuỗi Pinyin: chữ thường, loại bỏ khoảng trắng và dấu câu để so sánh linh hoạt
 * @param {string} str
 * @returns {string}
 */
function compactPinyin(str = '') {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/ü/g, 'v')
    .replace(/u:/g, 'v')
    .replace(/[\s'’\-.,!?;:()[\]]+/g, '');
}

/**
 * Kiểm tra đáp án tiếng Trung:
 * Chấp nhận Chữ Hán giản thể, Chữ Hán phồn thể, Pinyin có số (jian1chi2),
 * Pinyin có dấu (jiān chí) hoặc Pinyin không dấu (jianchi)
 * @param {string} userInput
 * @param {Object} targetData
 * @returns {{ isCorrect: boolean, matchedType: string | null, normalizedInput: string }}
 */
export function validateChineseAnswer(
  userInput = '',
  {
    word = '',
    traditional = '',
    pinyin_numbered = '',
    pinyin_plain = '',
    pinyin_primary = '',
    phonetic_primary = '',
  } = {}
) {
  const rawInput = String(userInput).trim();
  if (!rawInput) {
    return { isCorrect: false, matchedType: null, normalizedInput: '' };
  }

  // 1. Kiểm tra khớp chữ Hán giản thể hoặc phồn thể (bỏ khoảng trắng thừa)
  const cleanHanziInput = rawInput.replace(/\s+/g, '');
  const cleanSimplified = String(word).trim().replace(/\s+/g, '');
  const cleanTraditional = String(traditional).trim().replace(/\s+/g, '');

  if (cleanSimplified && cleanHanziInput === cleanSimplified) {
    return { isCorrect: true, matchedType: 'HANZI_SIMPLIFIED', normalizedInput: rawInput };
  }

  if (cleanTraditional && cleanHanziInput === cleanTraditional) {
    return { isCorrect: true, matchedType: 'HANZI_TRADITIONAL', normalizedInput: rawInput };
  }

  // 2. Kiểm tra Pinyin (có dấu, có số, không dấu)
  const compactInput = compactPinyin(rawInput);
  const primaryToneMarked = pinyin_primary || phonetic_primary || '';

  // 2a. Khớp Pinyin có dấu (VD: "jiān chí" hoặc "jiānchí")
  if (primaryToneMarked && compactInput === compactPinyin(primaryToneMarked)) {
    return { isCorrect: true, matchedType: 'PINYIN_TONE_MARKED', normalizedInput: compactInput };
  }

  // 2b. Khớp Pinyin có số thanh điệu (VD: "jian1chi2" hoặc "jian1 chi2")
  if (pinyin_numbered && compactInput === compactPinyin(pinyin_numbered)) {
    return { isCorrect: true, matchedType: 'PINYIN_NUMBERED', normalizedInput: compactInput };
  }

  // 2c. Khớp Pinyin không dấu (VD: "jianchi" hoặc "jian chi")
  const derivedPlainFromPrimary = primaryToneMarked
    ? compactPinyin(stripPinyinTones(primaryToneMarked))
    : '';
  const derivedPlainFromNumbered = pinyin_numbered
    ? compactPinyin(String(pinyin_numbered).replace(/[1-5]/g, ''))
    : '';
  const targetPlain = compactPinyin(pinyin_plain) || derivedPlainFromPrimary || derivedPlainFromNumbered;

  // Cho phép cả trường hợp người dùng gõ có dấu rồi được chuẩn hóa về không dấu hoặc gõ thẳng không dấu
  const compactInputToneless = compactPinyin(stripPinyinTones(rawInput));
  if (targetPlain && (compactInput === targetPlain || compactInputToneless === targetPlain)) {
    return { isCorrect: true, matchedType: 'PINYIN_PLAIN', normalizedInput: compactInput };
  }

  return { isCorrect: false, matchedType: null, normalizedInput: rawInput };
}

/**
 * Kiểm tra các mảnh chữ Hán người dùng chọn trong chế độ Word Bank
 * @param {string[]} selectedTokens - Mảng các chữ Hán người dùng bấm chọn theo thứ tự
 * @param {string} targetWord - Từ tiếng Trung mục tiêu (VD: "坚持")
 * @returns {{ isCorrect: boolean, assembledWord: string, targetWord: string }}
 */
export function validateWordBankSelection(selectedTokens = [], targetWord = '') {
  const assembledWord = Array.isArray(selectedTokens)
    ? selectedTokens.join('').replace(/\s+/g, '')
    : String(selectedTokens).replace(/\s+/g, '');
  const cleanTarget = String(targetWord).trim().replace(/\s+/g, '');

  return {
    isCorrect: Boolean(cleanTarget) && assembledWord === cleanTarget,
    assembledWord,
    targetWord: cleanTarget,
  };
}

export default {
  generateWordMask,
  validateEnglishSpelling,
  validateChineseAnswer,
  validateWordBankSelection,
};
