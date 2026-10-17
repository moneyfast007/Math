/**
 * Targeted nikud for words the TTS engine reads ambiguously.
 *
 * Plain Hebrew leaves some words open: "עשרה" is esre in "אחת עשרה" (11,
 * feminine) but asara in "עשרה כדורים" (10, masculine); "עשרים" can be read
 * as esrim or asarim; "שש" as shesh or sas. Listening tests (two rounds,
 * Chirp 3 HD) showed that vocalizing only these words beats both plain text
 * and fully vocalized sentences, which change the overall delivery.
 *
 * Findings applied here (three listening rounds):
 * - The feminine teens' "עשרה" and a lone "עשר"/"עשרה" need nikud.
 * - Only a short list of other words helps (LEXICON); broad nikud hurts.
 * - When a word with a ו prefix is vocalized, the ו gets its vowel too.
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

/**
 * Words whose reading never depends on context. Only words the listening
 * rounds showed to help are here; vocalizing every number word made sentences
 * that were already fine worse (round 3: "שֶׁבַע", "חָמֵשׁ", "שְׁלוֹשִׁים" all lost
 * to plain text), and "ושתיים" reads best plain.
 */
const LEXICON: Readonly<Record<string, string>> = {
  שתים: 'שְׁתֵּים',
  שנים: 'שְׁנֵים',
  אלפים: 'אֲלָפִים',
  לשש: 'לְשֵׁשׁ',
  לחלק: 'לְחַלֵּק',
  גולות: 'גֻּלּוֹת',
  שוות: 'שָׁווֹת',
  // Round 4: vocalizing שש made things worse; it stays plain.
  // Pronunciations given by a native speaker (round 5):
  למשל: 'לְמָשָׁל',
  עשרים: 'עֶשְׂרִים',
  ארבע: 'אַרְבַּע',
  ארבעה: 'אַרְבָּעָה',
  אחת: 'אַחַת',
  שתיים: 'שְׁתַּיִם',
};

/**
 * Full vocalizations of specific sentences, hand-written to match the native
 * speaker's pronunciations (round 5). Used for the "full" comparison column.
 */
export const FULL_NIKUD: Readonly<Record<string, string>> = {
  'למשל, כאן יש ארבעה כוכבים: אחת, שתיים, שלוש, ארבע.':
    'לְמָשָׁל, כָּאן יֵשׁ אַרְבָּעָה כּוֹכָבִים: אַחַת, שְׁתַּיִם, שָׁלוֹשׁ, אַרְבַּע.',
  'שמונה ועוד חמש זה שלוש עשרה.': 'שְׁמוֹנֶה וְעוֹד חָמֵשׁ זֶה שְׁלוֹשׁ עֶשְׂרֵה.',
  'היו עשרה בלונים. לקחו שלושה בלונים. כמה בלונים נשארו?':
    'הָיוּ עֲשָׂרָה בַּלּוֹנִים. לָקְחוּ שְׁלוֹשָׁה בַּלּוֹנִים. כַּמָּה בַּלּוֹנִים נִשְׁאֲרוּ?',
  'למשל, עשר ועוד עשר זה עשרים.': 'לְמָשָׁל, עֶשֶׂר וְעוֹד עֶשֶׂר זֶה עֶשְׂרִים.',
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

const TEEN_UNITS: Readonly<Record<string, string>> = {
  שלוש: 'שְׁלוֹשׁ',
  ארבע: 'אַרְבַּע',
  חמש: 'חֲמֵשׁ',
  שש: 'שֵׁשׁ',
  שבע: 'שְׁבַע',
  שמונה: 'שְׁמוֹנֶה',
  תשע: 'תְּשַׁע',
};

export function vocalizeForTts(text: string): string {
  let previous: string | undefined;
  const tokens = text.split(' ');
  // Feminine teens: vocalize the unit together with עשרה (shlosh esre), as a native speaker spelled it.
  for (let i = 0; i + 1 < tokens.length; i++) {
    const unit = tokens[i] ?? '';
    const next = tokens[i + 1] ?? '';
    if (/^עשרה[^\u05d0-\u05ea]*$/.test(next) && unit in TEEN_UNITS) tokens[i] = TEEN_UNITS[unit] ?? unit;
  }
  return tokens
    .map((token) => {
      const { pre, word, post } = parts(token.replace(/[\u0591-\u05c7]/g, ''));
      const already = token !== pre + word + post ? token.replace(/[^\u05d0-\u05ea\u0591-\u05c7]+$/, '') : null;
      const vocalized = already ?? vocalizeWord(word, previous);
      const prefix = pre && vocalized !== word ? conjunction(vocalized) : pre;
      // A sentence boundary resets the context.
      previous = /[.?!,:]$/.test(post) ? undefined : word;
      return prefix + vocalized + post;
    })
    .join(' ');
}
