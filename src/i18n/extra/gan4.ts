/**
 * Hebrew texts of gan hova's seventh world, "מודדים ומשווים" (merged into `he`).
 * Read aloud: no digits; { f, m } agrees with the thing named first in the sentence.
 */
export const heGan4 = {
  'topic.measure0': 'מודדים ומשווים',
  'level.measure0.1': 'מה כבד יותר?',
  'level.measure0.2': 'מה קל יותר?',
  'level.measure0.3': 'מאזניים: מי כבד?',
  'level.measure0.4': 'מאזניים: מי קל?',
  'level.measure0.5': 'איפה יש יותר מים?',
  'level.measure0.6': 'איפה יש פחות מים?',
  'level.measure0.7': 'מלאה, ריקה או חצי',
  'level.measure0.8': 'הכי גבוה, הכי נמוך',
  'level.measure0.9': 'כמה צעדים?',
  'level.measure0.10': 'כמה קוביות במגדל?',

  // Heavy and light, from what we know.
  'ex.m0.life.heavy.prompt': 'מה בדרך כלל כבד יותר: {a} או {b}?',
  'ex.m0.life.light.prompt': 'מה בדרך כלל קל יותר: {a} או {b}?',
  'ex.m0.life.heavy.solution': { f: '{w} כבדה יותר מ{l}.', m: '{w} כבד יותר מ{l}.' },
  'ex.m0.life.light.solution': { f: '{w} קלה יותר מ{l}.', m: '{w} קל יותר מ{l}.' },
  'ex.m0.life.heavy.hint1': 'נדמיין שאנחנו מנסים להרים כל אחד מהם. את מה קשה יותר להרים?',
  'ex.m0.life.light.hint1': 'נדמיין שאנחנו מנסים להרים כל אחד מהם. את מה קל יותר להרים?',
  'ex.m0.life.hint2': 'דברים גדולים הם בדרך כלל כבדים יותר, ודברים קטנים הם בדרך כלל קלים יותר.',
  'adv.m0.life.heavy': 'נדמיין שוב: את מה היה קשה יותר להרים?',
  'adv.m0.life.light': 'נדמיין שוב: את מה היה קל יותר להרים?',

  // Heavy and light on a balance.
  'ex.m0.bal.heavy.prompt': 'במאזניים: מי כבד יותר, {a} או {b}?',
  'ex.m0.bal.light.prompt': 'במאזניים: מי קל יותר, {a} או {b}?',
  'ex.m0.bal.hint1': 'במאזניים, הצד הכבד יותר יורד למטה, והצד הקל יותר עולה למעלה.',
  'ex.m0.bal.heavy.hint2': 'החצים מראים איזה צד ירד. מה יש בצד שירד?',
  'ex.m0.bal.light.hint2': 'החצים מראים איזה צד עלה. מה יש בצד שעלה?',
  'ex.m0.bal.heavy.solution': {
    f: '{w} כבדה יותר מ{l}: הצד שלה ירד למטה.',
    m: '{w} כבד יותר מ{l}: הצד שלו ירד למטה.',
  },
  'ex.m0.bal.light.solution': {
    f: '{w} קלה יותר מ{l}: הצד שלה עלה למעלה.',
    m: '{w} קל יותר מ{l}: הצד שלו עלה למעלה.',
  },
  'adv.m0.bal.heavy': 'הצד הזה עלה למעלה. הצד הכבד הוא זה שירד.',
  'adv.m0.bal.light': 'הצד הזה ירד למטה. הצד הקל הוא זה שעלה.',

  // Glasses of water.
  'ex.m0.cups.more.prompt': 'באיזו כוס יש יותר מים?',
  'ex.m0.cups.less.prompt': 'באיזו כוס יש פחות מים?',
  'ex.m0.cups.hint1': 'נסתכל עד לאן מגיעים המים בכל כוס.',
  'ex.m0.cups.more.hint2': 'בכוס שהמים בה מגיעים גבוה יותר, יש יותר מים.',
  'ex.m0.cups.less.hint2': 'בכוס שהמים בה נמוכים יותר, יש פחות מים.',
  'ex.m0.cups.more.solution': 'יותר מים יש בכוס {d}.',
  'ex.m0.cups.less.solution': 'פחות מים יש בכוס {d}.',
  'adv.m0.cups.more': 'נסתכל שוב: באיזו כוס המים מגיעים גבוה יותר?',
  'adv.m0.cups.less': 'נסתכל שוב: באיזו כוס המים נמוכים יותר?',
  // How full a glass is: on a button, and after "בכוס" in a sentence.
  'ex.m0.cup.0': 'כוס ריקה',
  'ex.m0.cup.1': 'כוס עם מעט מים',
  'ex.m0.cup.2': 'כוס שמלאה עד חצי',
  'ex.m0.cup.3': 'כוס כמעט מלאה',
  'ex.m0.cup.4': 'כוס מלאה',
  'ex.m0.cupIn.0': 'הריקה',
  'ex.m0.cupIn.1': 'שיש בה מעט מים',
  'ex.m0.cupIn.2': 'שמלאה עד חצי',
  'ex.m0.cupIn.3': 'שכמעט מלאה',
  'ex.m0.cupIn.4': 'המלאה',

  // Full, empty, half.
  'ex.m0.fill.full.prompt': 'איזו כוס מלאה?',
  'ex.m0.fill.empty.prompt': 'איזו כוס ריקה?',
  'ex.m0.fill.half.prompt': 'איזו כוס מלאה עד חצי?',
  'ex.m0.fill.full.hint1': 'בכוס מלאה, המים מגיעים עד למעלה.',
  'ex.m0.fill.empty.hint1': 'בכוס ריקה אין בכלל מים.',
  'ex.m0.fill.half.hint1': 'בכוס שמלאה עד חצי, המים מגיעים לאמצע הכוס.',
  'ex.m0.fill.hint2': 'נסתכל על כל כוס בתורה, ונראה עד לאן מגיעים בה המים.',
  'ex.m0.fill.full.solution': 'בכוס המלאה, המים מגיעים עד למעלה.',
  'ex.m0.fill.empty.solution': 'בכוס הריקה אין מים בכלל.',
  'ex.m0.fill.half.solution': 'בכוס שמלאה עד חצי, המים מגיעים לאמצע.',
  'adv.m0.fill': 'נסתכל שוב עד לאן מגיעים המים בכוס הזאת.',

  // The tallest and the lowest of three.
  'ex.m0.tall.most.prompt': 'מה הכי גבוה?',
  'ex.m0.tall.least.prompt': 'מה הכי נמוך?',
  'ex.m0.tall.hint1': 'נסתכל עד לאן מגיע כל אחד מהם.',
  'ex.m0.tall.most.hint2': 'מה שמגיע מעל הקו הוא הכי גבוה.',
  'ex.m0.tall.least.hint2': 'מה שלא מגיע עד הקו הוא הכי נמוך.',
  'ex.m0.tall.most.solution': 'ה{w} מגיע הכי למעלה.',
  'ex.m0.tall.least.solution': 'ה{w} נשאר הכי למטה.',

  // Steps from one place to another.
  'ex.m0.steps.prompt': 'כמה צעדים יש מה{a} עד ה{b}?',
  'ex.m0.steps.solution': 'מה{a} עד ה{b} יש {n}.',
  'ex.m0.steps.hint1': 'נגע בכל צעד פעם אחת, ונספור.',
  'ex.m0.steps.hint2': 'נתחיל לספור ליד ה{a}, ונמשיך עד שנגיע אל ה{b}.',
  'adv.m0.steps.twice': 'אולי ספרנו צעד אחד פעמיים. נספור שוב לאט.',
  'adv.m0.steps.skipped': 'אולי דילגנו על צעד. נספור שוב לאט, ונגע בכל צעד.',

  // Cubes in a tower.
  'ex.m0.tower.prompt': 'כמה קוביות יש במגדל?',
  'ex.m0.tower.solution': 'במגדל יש {n}.',
  'ex.m0.tower.hint1': 'נספור את הקוביות מלמטה למעלה, אחת אחת.',
  'ex.m0.tower.hint2': 'כל קובייה היא קומה אחת במגדל. כמה קומות יש בו?',
  'adv.m0.tower.twice': 'אולי ספרנו קובייה אחת פעמיים. נספור שוב מלמטה.',
  'adv.m0.tower.skipped': 'אולי דילגנו על קובייה. נספור שוב מלמטה, אחת אחת.',
} as const;
