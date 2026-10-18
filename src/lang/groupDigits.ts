/**
 * Big numbers on screen get thousands separators, as in Israeli textbooks:
 * 529206 → 529,206. Only whole numbers of five digits or more, so 2025 and
 * 3456 stay as they are, and digits after a decimal point are never touched.
 * Applied when text is shown; exercises keep plain digits (the child types
 * them without commas).
 */
export function groupDigits(text: string): string {
  return text.replace(/(\.?)(\d{5,})/g, (whole, point: string, digits: string) =>
    point ? whole : digits.replace(/\B(?=(\d{3})+$)/g, ','),
  );
}
