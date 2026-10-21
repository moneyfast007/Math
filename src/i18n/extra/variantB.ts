/**
 * Texts of design B of the entry screen and the parents' area ("today first",
 * ?ui=b). Shown only, never spoken: digits are fine here.
 */
export const heVariantB = {
  // Entry screen: each child's card says how today went.
  'b.home.today.done': { f: 'שיחקה היום', m: 'שיחק היום' },
  'b.home.today.notYet': 'עוד לא היום',
  'b.home.stars': '{count} כוכבים',
  'b.home.starsOne': 'כוכב אחד',
  // What is true for every parent (see the privacy policy in i18n/legal).
  'b.home.trust.ads': 'בלי פרסומות',
  'b.home.trust.tracking': 'בלי מעקב',
  'b.home.trust.signup': 'בלי הרשמה',
  'b.home.trust.label': 'לשקט של ההורים',

  // Parents' area: today, at a glance.
  'b.parent.today': 'היום',
  'b.parent.overview.all': 'כל הילדים תרגלו היום',
  'b.parent.overview.some': 'תרגלו היום: {done} מתוך {total}',
  'b.parent.overview.none': 'עוד אף אחד לא תרגל היום',
  'b.parent.overview.oneDone': { f: '{name} תרגלה היום', m: '{name} תרגל היום' },
  'b.parent.overview.oneNot': { f: '{name} עוד לא תרגלה היום', m: '{name} עוד לא תרגל היום' },
  'b.parent.jump': 'מעבר לילד או לילדה',
  'b.parent.status.done': { f: 'תרגלה היום', m: 'תרגל היום' },
  'b.parent.status.goalDone': 'היעד הושג',
  'b.parent.status.notYet': 'עוד לא היום',

  'b.parent.stat.rounds': 'סבבים היום',
  'b.parent.stat.exercises': 'תרגילים',
  'b.parent.stat.firstTry': 'נכון בניסיון הראשון',
  'b.parent.stat.daily': 'כולל החזרה של היום',
  'b.parent.notToday.never': {
    f: 'עוד לא התחילה. כשתשחק, תראו כאן איך הלך.',
    m: 'עוד לא התחיל. כשישחק, תראו כאן איך הלך.',
  },
  'b.parent.notToday.last': 'התרגול האחרון: {date}',
  'b.parent.goalLeft': 'עוד {count} סבבים ליעד',
  'b.parent.goalLeftOne': 'עוד סבב אחד ליעד',

  'b.parent.where': 'במסע',
  'b.parent.tip.title': 'מה כדאי לעשות',
  'b.parent.tip.good': {
    f: 'הולך לה טוב: אין טעות שחוזרת על עצמה. אפשר פשוט לפרגן.',
    m: 'הולך לו טוב: אין טעות שחוזרת על עצמה. אפשר פשוט לפרגן.',
  },
  'b.parent.tip.topic': 'כדאי לחזור יחד קצת על {topic}: שם יש עוד טעויות.',

  // The most common mistake, as one plain sentence of what to do.
  'b.tip.wrongOperation': {
    f: 'קורה שהיא מחברת במקום לחסר (או להפך): כדאי לבקש ממנה לומר את הסימן בקול לפני שעונה.',
    m: 'קורה שהוא מחבר במקום לחסר (או להפך): כדאי לבקש ממנו לומר את הסימן בקול לפני שעונה.',
  },
  'b.tip.offByOne': {
    f: 'התשובות שלה יוצאות לפעמים אחד יותר או אחד פחות: כדאי לספור יחד על האצבעות או על ציר מספרים, ולבדוק מאיפה מתחילים.',
    m: 'התשובות שלו יוצאות לפעמים אחד יותר או אחד פחות: כדאי לספור יחד על האצבעות או על ציר מספרים, ולבדוק מאיפה מתחילים.',
  },
  'b.tip.digitReversal': {
    f: 'לפעמים היא הופכת את סדר הספרות (31 במקום 13): כדאי לומר את המספר בקול ולכתוב קודם את העשרות.',
    m: 'לפעמים הוא הופך את סדר הספרות (31 במקום 13): כדאי לומר את המספר בקול ולכתוב קודם את העשרות.',
  },
  'b.tip.placeValue': {
    f: 'אחדות ועשרות מתבלבלות לה: כדאי לבנות יחד מספרים מצרורות של עשרה ומקלות בודדים.',
    m: 'אחדות ועשרות מתבלבלות לו: כדאי לבנות יחד מספרים מצרורות של עשרה ומקלות בודדים.',
  },
  'b.tip.remainder': {
    f: 'השארית בחילוק מבלבלת אותה: כדאי לחלק יחד חפצים אמיתיים, למשל קוביות, ולראות מה נשאר.',
    m: 'השארית בחילוק מבלבלת אותו: כדאי לחלק יחד חפצים אמיתיים, למשל קוביות, ולראות מה נשאר.',
  },
  'b.tip.carry': {
    f: 'בחיבור במאונך היא שוכחת להעביר את העשרת: כדאי לכתוב יחד את הספרה הקטנה מעל העמודה הבאה.',
    m: 'בחיבור במאונך הוא שוכח להעביר את העשרת: כדאי לכתוב יחד את הספרה הקטנה מעל העמודה הבאה.',
  },
  'b.tip.borrow': {
    f: 'בחיסור במאונך היא מחסרת את הקטן מהגדול בלי לפרוט: כדאי לפתור יחד תרגיל אחד ולומר בקול ״אין מספיק, פורטים עשרת״.',
    m: 'בחיסור במאונך הוא מחסר את הקטן מהגדול בלי לפרוט: כדאי לפתור יחד תרגיל אחד ולומר בקול ״אין מספיק, פורטים עשרת״.',
  },
  'b.tip.offByTen':
    'התשובה יוצאת לפעמים בעשר יותר או פחות: כדאי לבדוק יחד את ספרת העשרות אחרי כל תרגיל.',
  'b.tip.countedCoins': {
    f: 'היא סופרת את המטבעות במקום את מה שהם שווים: כדאי לשחק יחד בחנות עם מטבעות אמיתיים.',
    m: 'הוא סופר את המטבעות במקום את מה שהם שווים: כדאי לשחק יחד בחנות עם מטבעות אמיתיים.',
  },
  'b.tip.clockHands': {
    f: 'המחוגים מתחלפים לה: כדאי להראות לה על שעון בבית שהמחוג הקצר מראה את השעה.',
    m: 'המחוגים מתחלפים לו: כדאי להראות לו על שעון בבית שהמחוג הקצר מראה את השעה.',
  },
  'b.tip.order': {
    f: 'היא מחשבת לפי הסדר שבו התרגיל כתוב: כדאי להזכיר לה שסוגריים, כפל וחילוק באים קודם.',
    m: 'הוא מחשב לפי הסדר שבו התרגיל כתוב: כדאי להזכיר לו שסוגריים, כפל וחילוק באים קודם.',
  },
  'b.tip.shapeFormula': {
    f: 'שטח, היקף ונפח מתערבבים לה: כדאי למדוד יחד משהו בבית, את ההיקף בחוט ואת השטח באריחים.',
    m: 'שטח, היקף ונפח מתערבבים לו: כדאי למדוד יחד משהו בבית, את ההיקף בחוט ואת השטח באריחים.',
  },
  'b.tip.decimalPoint': {
    f: 'הספרות נכונות, אבל הנקודה העשרונית זזה: כדאי שתעריך קודם בערך כמה תצא התשובה.',
    m: 'הספרות נכונות, אבל הנקודה העשרונית זזה: כדאי שיעריך קודם בערך כמה תצא התשובה.',
  },

  // The child's settings, right on her card; a change is saved at once.
  'b.parent.settings.title': 'ההגדרות של {name}',
  'b.parent.settings.saved': 'נשמר',
  'b.parent.settings.edit': 'שם, דמות וכיתה',
  'b.parent.goal.none': 'יעד',
  'b.parent.goal.round': 'סבב',
  'b.parent.goal.rounds': 'סבבים',
  'b.parent.report.open': 'השבוע והמסע',
  'b.parent.report.close': 'סגירת הדוח',
  'b.parent.report.all': 'מאז ההתחלה',

  // The first child, and the technical part at the bottom.
  'b.parent.empty.title': 'נתחיל בילד או בילדה הראשונים',
  'b.parent.empty.body': 'שם, דמות וכיתה. זה לוקח דקה, ואפשר לשנות אחר כך.',
  'b.parent.empty.cta': 'יצירת פרופיל',
  'b.parent.device.title': 'המכשיר והמשפחה',
  'b.parent.device.summary': 'סנכרון, גיבוי, קוד הורים, שימוש בלי אינטרנט והתקנה',
  'b.parent.device.attention': 'כדאי להציץ',
} as const;
