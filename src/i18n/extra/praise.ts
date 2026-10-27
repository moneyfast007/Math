/**
 * Praise for a right answer, in many words rather than one line again and again
 * (feedback.*: recorded, so a young child hears it). Picked in PracticeScreen,
 * never the same line twice in a row.
 */
export const hePraise = {
  // Right on the first try.
  'feedback.praise.1': { f: 'נכון! כל הכבוד', m: 'נכון! כל הכבוד' },
  'feedback.praise.2': { f: 'מצוין!', m: 'מצוין!' },
  'feedback.praise.3': { f: 'בדיוק!', m: 'בדיוק!' },
  'feedback.praise.4': { f: 'צדקת!', m: 'צדקת!' },
  'feedback.praise.5': { f: 'יופי של תשובה!', m: 'יופי של תשובה!' },
  'feedback.praise.6': { f: 'איזה יופי!', m: 'איזה יופי!' },
  'feedback.praise.7': { f: 'נהדר!', m: 'נהדר!' },
  'feedback.praise.8': { f: 'ידעת את זה!', m: 'ידעת את זה!' },
  'feedback.praise.9': { f: 'ככה עושים את זה!', m: 'ככה עושים את זה!' },
  'feedback.praise.10': { f: 'אלופה!', m: 'אלוף!' },
  // Every third right answer in a row (first tries).
  'feedback.streak.1': { f: 'שלוש ברצף! וואו!', m: 'שלוש ברצף! וואו!' },
  'feedback.streak.2': { f: 'אין עלייך!', m: 'אין עליך!' },
  // Right after a wrong try: praised for not giving up.
  'feedback.later.1': { f: 'נכון! תיקנת את עצמך.', m: 'נכון! תיקנת את עצמך.' },
  'feedback.later.2': { f: 'נכון! לא ויתרת', m: 'נכון! לא ויתרת' },
  'feedback.later.3': { f: 'יפה שניסית שוב!', m: 'יפה שניסית שוב!' },
} as const;

export const PRAISE_COUNT = 10;
export const STREAK_COUNT = 2;
export const LATER_COUNT = 3;
