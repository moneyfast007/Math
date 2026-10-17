/**
 * Targeted nikud for words the TTS engine reads ambiguously.
 *
 * Plain Hebrew leaves some words open: "עשרה" is esre in "אחת עשרה" (11,
 * feminine) but asara in "עשרה כדורים" (10, masculine); "עשרים" can be read
 * as esrim or asarim; "שש" as shesh or sas. Listening tests (two rounds,
 * Chirp 3 HD) showed that vocalizing only these words beats both plain text
 * and fully vocalized sentences, which change the overall delivery.
 *
 * Findings applied here:
 * - Number words (tens, hundreds, thousands, ambiguous units) always get nikud.
 * - The conjunction ו gets its own vowel (וּ before sheva and ב/ו/מ/פ, וְ otherwise);
 *   leaving it bare next to a vocalized word made the reading worse.
 * - Masculine teens ("אחד עשר") are read correctly as plain text and are left alone.
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
  // Units that plain text leaves ambiguous
  שתים: 'שְׁתֵּים',
  שתיים: 'שְׁתַּיִם',
  שנים: 'שְׁנֵים',
  שניים: 'שְׁנַיִם',
  חמש: 'חָמֵשׁ',
  שש: 'שֵׁשׁ',
  שבע: 'שֶׁבַע',
  תשע: 'תֵּשַׁע',
  שלושה: 'שְׁלוֹשָׁה',
  ארבעה: 'אַרְבָּעָה',
  חמישה: 'חֲמִשָּׁה',
  שישה: 'שִׁשָּׁה',
  שבעה: 'שִׁבְעָה',
  תשעה: 'תִּשְׁעָה',
  // Tens
  עשרים: 'עֶשְׂרִים',
  שלושים: 'שְׁלוֹשִׁים',
  ארבעים: 'אַרְבָּעִים',
  חמישים: 'חֲמִשִּׁים',
  שישים: 'שִׁשִּׁים',
  שבעים: 'שִׁבְעִים',
  שמונים: 'שְׁמוֹנִים',
  תשעים: 'תִּשְׁעִים',
  // Hundreds and thousands
  מאה: 'מֵאָה',
  מאתיים: 'מָאתַיִם',
  מאות: 'מֵאוֹת',
  אלף: 'אֶלֶף',
  אלפיים: 'אַלְפַּיִם',
  אלפים: 'אֲלָפִים',
  // Other words the listening tests flagged
  לשש: 'לְשֵׁשׁ',
  לחלק: 'לְחַלֵּק',
  גולות: 'גֻּלּוֹת',
  ננסה: 'נְנַסֶּה',
  נספור: 'נִסְפֹּר',
  שוות: 'שָׁווֹת',
};

const SHEVA = 'ְ';
const LABIALS = new Set(['ב', 'ו', 'מ', 'פ']);

/** The vowel of the conjunction ו before a (possibly vocalized) word. */
function conjunction(vocalizedWord: string): string {
  const first = vocalizedWord[0] ?? '';
  // Marks attached to the first letter: dagesh, shin/sin dots, then the vowel.
  const marks = /^[א-ת]([֑-ׇ]*)/.exec(vocalizedWord)?.[1] ?? '';
  if (marks.includes(SHEVA) || LABIALS.has(first)) return 'וּ';
  return 'וְ';
}

/** Splits a token into an optional conjunction prefix ו, the word, and trailing punctuation. */
function parts(token: string): { pre: string; word: string; post: string } {
  const m = /^(ו?)([א-ת]+)([^א-ת]*)$/.exec(token);
  if (!m) return { pre: '', word: token, post: '' };
  const pre = m[1] ?? '';
  const word = m[2] ?? '';
  // "ועוד", "ושש": the ו is a prefix only if the rest is a known word.
  if (pre && !(word in LEXICON) && word !== 'עשרה' && word !== 'עשר') {
    return { pre: '', word: pre + word, post: m[3] ?? '' };
  }
  return { pre, word, post: m[3] ?? '' };
}

function vocalizeWord(word: string, previous: string | undefined): string {
  if (word === 'עשרה') {
    // After a feminine unit it is the teen suffix (esre); alone it is masculine ten (asara).
    return previous !== undefined && FEMININE_UNITS.has(previous) ? 'עֶשְׂרֵה' : 'עֲשָׂרָה';
  }
  if (word === 'עשר') {
    // Masculine teens read correctly as plain text; alone it is feminine ten (eser).
    return previous !== undefined && MASCULINE_UNITS.has(previous) ? 'עשר' : 'עֶשֶׂר';
  }
  return LEXICON[word] ?? word;
}

export function vocalizeForTts(text: string): string {
  let previous: string | undefined;
  return text
    .split(' ')
    .map((token) => {
      const { pre, word, post } = parts(token);
      const vocalized = vocalizeWord(word, previous);
      const prefix = pre && vocalized !== word ? conjunction(vocalized) : pre;
      // A sentence boundary resets the context.
      previous = /[.?!,:]$/.test(post) ? undefined : word;
      return prefix + vocalized + post;
    })
    .join(' ');
}
