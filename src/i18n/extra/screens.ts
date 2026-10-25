/**
 * Texts of the redesigned non-exercise screens: the welcome, the child picker,
 * the parent area's sections, the album's empty slots (merged into `he`).
 * Anything passed to a speaker button holds no digits.
 */
export const heScreens = {
  // Welcome (first launch, no profiles yet). Spoken as is: no digits.
  'welcome.greeting':
    'היי, אני פלוסי! איתי כל תרגיל הוא הרפתקה קטנה, כל טעות היא עוד צעד, ולאט לאט נהיים אלופים. בואו נשחק!',
  'welcome.forParents': 'הורה יוצר פרופיל לכל ילד או ילדה. זה לוקח דקה.',
  'welcome.haveData': 'כבר יש לכם פלוסי במכשיר אחר, או קובץ גיבוי?',
  'welcome.connect': 'התחברות או שחזור מגיבוי',

  // Child picker. Mixed boys and girls: a form that is the same for both.
  'home.whoIsPlaying.mixed': 'מי רוצה לשחק היום?',
  'home.pickHint': 'נוגעים בכרטיס ויוצאים למסע',
  'home.parentsHold': 'לחיצה ארוכה לכניסה',
  'home.parentsTip.title': 'טיפ להורים:',
  'home.parentsTip.body':
    'לחיצה ארוכה על "אזור הורים" שלמטה פותחת את ההתקדמות של כל ילד ואת ההגדרות.',
  'home.parentsTip.close': 'סגירת הטיפ',

  // Parent area: sections
  'parentArea.tabs': 'החלקים של אזור ההורים',
  'parentArea.tab.children': 'ילדים',
  'parentArea.tab.progress': 'התקדמות',
  'parentArea.tab.settings': 'הגדרות',
  'parentArea.more': 'עוד פרטים',
  'parentArea.empty.title': 'עוד אין כאן ילדים',
  'parentArea.empty.body': 'מוסיפים פרופיל לכל ילד או ילדה: שם, דמות וכיתה.',
  'parentArea.empty.haveData': 'יש לכם פלוסי במכשיר אחר, או קובץ גיבוי?',
  'parentArea.empty.toSettings': 'לסנכרון ולשחזור',
  'parentArea.allWorldsDone': { f: 'סיימה את כל העולמות!', m: 'סיים את כל העולמות!' },
  'parentArea.progress.title': 'ההתקדמות של הילדים',
  'parentArea.progress.empty': 'כשיהיו ילדים, ההתקדמות שלהם תופיע כאן.',
  'parentArea.settings.title': 'הגדרות',
  'parentArea.offline.short':
    'האפליקציה עובדת גם בלי אינטרנט. ההורדה צריכה רק בשביל ההקראה: שומרים את ההקלטות במכשיר, והן יתנגנו גם בלי חיבור.',

  // Album: the next sticker to earn (shown, not spoken: outside the recorded 'album.' keys)
  'stickerSlot.next': 'המדבקה הבאה',
} as const;
