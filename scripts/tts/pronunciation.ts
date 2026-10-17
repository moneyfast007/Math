/**
 * Targeted nikud for words the TTS engine reads ambiguously.
 *
 * Plain Hebrew leaves some words open: "עשרה" is esre in "אחת עשרה" (11,
 * feminine) but asara in "עשרה כדורים" (10, masculine). The voice comparison
 * showed Chirp 3 HD reads plain text best overall but stumbles exactly here.
 * Rather than vocalizing everything (which changes the overall delivery), we
 * vocalize only these words, based on their neighbors.
 *
 * This runs only on the way to the TTS service. The app keeps the plain text,
 * and the audio file is still named by the hash of the plain text.
 */

const FEMININE_UNITS = new Set(['אחת', 'שתים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע']);
const MASCULINE_UNITS = new Set([
  'אחד',
  'שנים',
  'שלושה',
  'ארבעה',
  'חמישה',
  'שישה',
  'שבעה',
  'שמונה',
  'תשעה',
]);

/** Words whose reading never depends on context. */
const LEXICON: Readonly<Record<string, string>> = {
  שתים: 'שְׁתֵּים',
  שתיים: 'שְׁתַּיִם',
  שנים: 'שְׁנֵים',
  לחלק: 'לְחַלֵּק',
  גולות: 'גֻּלּוֹת',
};

/** Splits a token into an optional conjunction prefix ו, the word, and trailing punctuation. */
function parts(token: string): { pre: string; word: string; post: string } {
  const m = /^(ו?)([א-ת]+)([^א-ת]*)$/.exec(token);
  if (!m) return { pre: '', word: token, post: '' };
  return { pre: m[1] ?? '', word: m[2] ?? '', post: m[3] ?? '' };
}

function vocalizeWord(word: string, previous: string | undefined): string {
  if (word === 'עשרה') {
    // After a feminine unit it is the teen suffix (esre); alone it is masculine ten (asara).
    return previous !== undefined && FEMININE_UNITS.has(previous) ? 'עֶשְׂרֵה' : 'עֲשָׂרָה';
  }
  if (word === 'עשר') {
    // After a masculine unit it is the teen suffix (asar); alone it is feminine ten (eser).
    return previous !== undefined && MASCULINE_UNITS.has(previous) ? 'עָשָׂר' : 'עֶשֶׂר';
  }
  return LEXICON[word] ?? word;
}

export function vocalizeForTts(text: string): string {
  const tokens = text.split(' ');
  let previous: string | undefined;
  return tokens
    .map((token) => {
      const { pre, word, post } = parts(token);
      const out = pre + vocalizeWord(word, previous) + post;
      // A sentence boundary resets the context.
      previous = /[.?!,:]$/.test(post) ? undefined : word;
      return out;
    })
    .join(' ');
}
