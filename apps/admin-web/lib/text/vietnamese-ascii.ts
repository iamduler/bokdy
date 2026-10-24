/** Strip Vietnamese diacritics (incl. đ/Đ) for English name auto-fill. Mirrors BE vnASCII. */
const VN_ASCII: Record<string, string> = {
  à: "a",
  á: "a",
  ả: "a",
  ã: "a",
  ạ: "a",
  ă: "a",
  ằ: "a",
  ắ: "a",
  ẳ: "a",
  ẵ: "a",
  ặ: "a",
  â: "a",
  ầ: "a",
  ấ: "a",
  ẩ: "a",
  ẫ: "a",
  ậ: "a",
  è: "e",
  é: "e",
  ẻ: "e",
  ẽ: "e",
  ẹ: "e",
  ê: "e",
  ề: "e",
  ế: "e",
  ể: "e",
  ễ: "e",
  ệ: "e",
  ì: "i",
  í: "i",
  ỉ: "i",
  ĩ: "i",
  ị: "i",
  ò: "o",
  ó: "o",
  ỏ: "o",
  õ: "o",
  ọ: "o",
  ô: "o",
  ồ: "o",
  ố: "o",
  ổ: "o",
  ỗ: "o",
  ộ: "o",
  ơ: "o",
  ờ: "o",
  ớ: "o",
  ở: "o",
  ỡ: "o",
  ợ: "o",
  ù: "u",
  ú: "u",
  ủ: "u",
  ũ: "u",
  ụ: "u",
  ư: "u",
  ừ: "u",
  ứ: "u",
  ử: "u",
  ữ: "u",
  ự: "u",
  ỳ: "y",
  ý: "y",
  ỷ: "y",
  ỹ: "y",
  ỵ: "y",
  đ: "d",
};

export function toVietnameseASCII(input: string): string {
  let out = "";
  for (const ch of input.normalize("NFC")) {
    const lower = ch.toLowerCase();
    const mapped = VN_ASCII[lower];
    if (mapped) {
      out += ch === lower ? mapped : mapped.toUpperCase();
      continue;
    }
    out += ch;
  }
  return out;
}

/** Lowercase + strip Vietnamese diacritics (incl. đ/Đ) for accent-insensitive search. */
export function normalizeForSearch(input: string): string {
  return toVietnameseASCII(input).toLowerCase();
}

/** cmdk/Command filter: 1 = match, 0 = hide. */
export function commandSearchFilter(value: string, search: string): number {
  if (!search.trim()) return 1;
  return normalizeForSearch(value).includes(normalizeForSearch(search)) ? 1 : 0;
}
