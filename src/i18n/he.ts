/**
 * Hebrew UI strings.
 *
 * Rules for this file:
 * - Every string the user can see lives here, never inline in a component.
 * - Phrases that address the child come as { f, m } pairs.
 * - No math symbols: arithmetic is rendered by the <MathExpr> component, never by text.
 * - Keep the vocabulary at the level of the youngest reader that will see it.
 *
 * Adding a language later means adding `en.ts` with the same keys; the type
 * system will point out anything missing.
 */
export const he = {
  // App
  'app.name': 'חשבון',
  'app.tagline': 'תרגול חשבון, מגן חובה ועד כיתה ו׳',

  // Home
  'home.whoIsPlaying': 'מי משחקת היום?',
  'home.addProfile': 'הוספת ילד או ילדה',
  'home.noProfilesYet': 'עדיין אין פרופילים. הורים, לחצו כאן כדי להתחיל.',
  'home.parents': 'הורים',

  // Generic actions
  'action.back': 'חזרה',
  'action.continue': 'ממשיכים',
  'action.tryAgain': { f: 'נסי שוב', m: 'נסה שוב' },
  'action.check': 'בדיקה',
  'action.hint': 'רמז',
  'action.listen': 'הקראה',
  'action.listenSlow': 'הקראה איטית',
  'action.stop': 'עצירה',
  'action.close': 'סגירה',

  // Feedback (never a red X, never a failure sound)
  'feedback.correct': { f: 'נכון! כל הכבוד', m: 'נכון! כל הכבוד' },
  'feedback.almost': { f: 'כמעט. בואי ננסה ביחד', m: 'כמעט. בוא ננסה ביחד' },
  'feedback.keepGoing': { f: 'את בדרך הנכונה', m: 'אתה בדרך הנכונה' },

  // Audio
  'audio.unavailableOffline': 'ההקראה לא זמינה עכשיו. נסו שוב כשיש אינטרנט.',
  'audio.unavailable': 'אין הקראה לשאלה הזו.',

  // Install guide (parents)
  'install.title': 'הוספה למסך הבית',
  'install.why':
    'כשהאתר מותקן על מסך הבית הוא נפתח כמו אפליקציה, עובד גם בלי אינטרנט, וההתקדמות של הילדות נשמרת לאורך זמן.',
  'install.ios.title': 'באייפד או באייפון (Safari)',
  'install.ios.step1': 'פותחים את האתר ב-Safari (לא בדפדפן אחר).',
  'install.ios.step2': 'לוחצים על כפתור השיתוף: הריבוע עם החץ למעלה.',
  'install.ios.step3': 'גוללים ברשימה ובוחרים "הוספה למסך הבית".',
  'install.ios.step4': 'לוחצים "הוספה". האייקון יופיע על מסך הבית.',
  'install.android.title': 'באנדרואיד (Chrome)',
  'install.android.step1': 'פותחים את התפריט (שלוש נקודות) ובוחרים "הוספה למסך הבית" או "התקנה".',
  'install.desktop.title': 'במחשב',
  'install.desktop.step1': 'ב-Chrome או ב-Edge לוחצים על אייקון ההתקנה בשורת הכתובת.',
  'install.alreadyInstalled': 'האתר כבר מותקן על המכשיר הזה.',
  'install.safariNote':
    'חשוב: ב-Safari נתוני אתר שלא נפתח שבעה ימים עלולים להימחק. באפליקציה המותקנת על מסך הבית זה לא קורה. בכל מקרה, במסך ההורים יש כפתור גיבוי.',

  // Playground (temporary screen used to verify RTL and math rendering)
  'playground.title': 'בדיקת תצוגה',
  'playground.expressionLabel': 'ביטוי חשבוני בתוך טקסט בעברית:',
  'playground.spokenLabel': 'איך זה מוקרא:',
  'playground.ageBand': 'קבוצת גיל',
  'playground.band.young': 'גן',
  'playground.band.middle': 'כיתות א׳–ג׳',
  'playground.band.older': 'כיתות ד׳–ו׳',
} as const;

export type HebrewKey = keyof typeof he;
