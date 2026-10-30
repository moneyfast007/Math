/**
 * Hebrew texts of gan hova's tenth world, "גרפים וספירה" (merged into `he`).
 * Picture graphs (one picture for each child, or each day), tally marks.
 */
export const heGan7 = {
  'topic.data0': 'גרפים וספירה',
  'level.data0.1': 'כמה בחרו?',
  'level.data0.2': 'מה בחרו הכי הרבה?',
  'level.data0.3': 'מה בחרו הכי מעט?',
  'level.data0.4': 'מה בחרו יותר?',
  'level.data0.5': 'כמה ענו בסך הכול?',
  'level.data0.6': 'בכמה יותר?',
  'level.data0.7': 'סימני ספירה',
  'level.data0.8': 'איזה סימן מתאים?',
  'level.data0.9': 'מזג האוויר: כמה ימים?',
  'level.data0.10': 'מזג האוויר: מה היה הכי הרבה?',

  'ex.d0.read.prompt': 'כמה ילדים בחרו {item}?',
  'ex.d0.read.hint1': 'נמצא את העמודה של {item}.',
  'ex.d0.read.hint2': 'כל תמונה היא ילד אחד. נספור את התמונות בעמודה.',
  'ex.d0.read.solution': '{n} בחרו {item}.',
  'ex.d0.read.solution1': 'ילד אחד בחר {item}.',

  'ex.d0.most.prompt': 'מה בחרו הכי הרבה ילדים?',
  'ex.d0.least.prompt': 'מה בחרו הכי מעט ילדים?',
  'ex.d0.most.hint1': 'נחפש את העמודה הכי גבוהה.',
  'ex.d0.least.hint1': 'נחפש את העמודה הכי נמוכה.',
  'ex.d0.extreme.hint2': 'נשווה את העמודות: באיזו יש הכי הרבה תמונות, ובאיזו הכי מעט?',
  'ex.d0.most.solution': 'הכי הרבה ילדים בחרו {item}.',
  'ex.d0.least.solution': 'הכי מעט ילדים בחרו {item}.',
  'adv.d0.extreme': 'נסתכל שוב על הגובה של כל העמודות.',

  'ex.d0.more.prompt': 'מה בחרו יותר ילדים: {a} או {b}?',
  'ex.d0.more.hint1': 'נשווה את שתי העמודות.',
  'ex.d0.more.hint2': 'העמודה הגבוהה יותר היא זו שבחרו בה יותר ילדים.',
  'ex.d0.more.solution': 'יותר ילדים בחרו {w} מאשר {l}.',
  'adv.d0.more': 'בעמודה הזאת יש פחות תמונות. נשווה שוב.',

  'ex.d0.total.prompt': 'כמה ילדים ענו בסך הכול?',
  'ex.d0.total.hint1': 'נספור את כל התמונות בכל העמודות.',
  'ex.d0.total.hint2': 'נספור עמודה אחרי עמודה, ונמשיך לספור בלי להתחיל מחדש.',
  'ex.d0.total.solution': 'בסך הכול ענו {n}.',

  'ex.d0.diff.prompt': 'בכמה ילדים יותר בחרו {a} מאשר {b}?',
  'ex.d0.diff.hint1': 'נשווה את שתי העמודות, תמונה מול תמונה.',
  'ex.d0.diff.hint2': 'נספור כמה תמונות נשארו בעמודה הגבוהה, בלי זוג.',
  'ex.d0.diff.solution': '{x} בחרו {a}, ו{y} בחרו {b}: יותר ב{d}.',

  'ex.d0.tally.prompt': 'כמה קווים יש בסימן הספירה?',
  'ex.d0.tally.hint1': 'נספור כל קו פעם אחת.',
  'ex.d0.tally.hint2': 'קו אלכסוני שחוצה ארבעה קווים הוא החמישי: ביחד חמישה.',
  'ex.d0.tally.solution': 'יש כאן {n}.',
  'adv.d0.tally.twice': 'אולי ספרנו קו אחד פעמיים. נספור שוב לאט.',
  'adv.d0.tally.skipped': 'אולי דילגנו על קו. נספור שוב לאט.',

  'ex.d0.match.prompt': 'איזה סימן ספירה מראה {n}?',
  'ex.d0.match.hint1': 'נספור את הקווים בכל סימן ספירה.',
  'ex.d0.match.hint2': 'נחפש את הסימן שיש בו בדיוק {n}.',
  'ex.d0.match.solution': 'בסימן הזה יש {n}.',
  'adv.d0.match': 'נספור שוב את הקווים בסימן הזה.',

  'ex.d0.weather.title': 'מזג האוויר השבוע',
  'ex.d0.weather.sunny': 'שמשי',
  'ex.d0.weather.cloudy': 'מעונן',
  'ex.d0.weather.rainy': 'גשום',
  'ex.d0.weather.read.prompt': 'בכמה ימים השבוע היה {w}?',
  'ex.d0.weather.read.hint1': 'נמצא את העמודה של {w}.',
  'ex.d0.weather.read.hint2': 'כל תמונה היא יום אחד. נספור את התמונות בעמודה.',
  'ex.d0.weather.read.solution': 'השבוע היה {w} ב{n}.',
  'ex.d0.weather.most.prompt': 'איך היה מזג האוויר ברוב ימי השבוע?',
  'ex.d0.weather.least.prompt': 'איזה מזג אוויר היה הכי מעט ימים?',
  'ex.d0.weather.most.solution': 'רוב השבוע היה {w}.',
  'ex.d0.weather.least.solution': 'רק ב{n} היה {w}.',
} as const;
