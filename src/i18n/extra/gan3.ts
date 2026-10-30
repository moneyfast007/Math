/**
 * Hebrew texts of gan hova's sixth world, "מספרים עד 20" (merged into `he`).
 * Everything here is read aloud: no digits, short sentences, "we" counting together.
 */
export const heGan3 = {
  'topic.count20': 'מספרים עד 20',
  'level.count20.1': 'נקודות של קובייה',
  'level.count20.2': 'שתי קוביות',
  'level.count20.3': 'עשר ועוד',
  'level.count20.4': 'סופרים עד 20',
  'level.count20.5': 'המספר שאחרי ושלפני',
  'level.count20.6': 'איזה מספר חסר?',
  'level.count20.7': 'איזה מספר גדול יותר?',
  'level.count20.8': 'אותו מספר פעמיים',
  'level.count20.9': 'קפיצות קדימה',
  'level.count20.10': 'קפיצות אחורה',

  // One die.
  'ex.die.prompt': 'כמה נקודות יש על הקובייה?',
  'ex.die.solution': 'על הקובייה יש {a}.',
  'ex.die.hint1': 'נגע בכל נקודה פעם אחת, ונספור.',
  'adv.die.twice': 'אולי ספרנו נקודה אחת פעמיים. נספור שוב לאט, ונגע בכל נקודה פעם אחת.',
  'adv.die.skipped': 'אולי דילגנו על נקודה. נספור שוב לאט, ונגע בכל נקודה.',
  'ex.die.hint2':
    'על קובייה הנקודות תמיד מסודרות באותה צורה. אחרי שמכירים את הצורה, יודעים כמה יש בלי לספור.',

  // Two dice.
  'ex.dice2.prompt': 'כמה נקודות יש בשתי הקוביות ביחד?',
  'ex.dice2.solution': 'בקובייה הראשונה {a}, ובשנייה {b}. ביחד {c} נקודות.',
  'ex.dice2.hint1': 'נספור את הנקודות בקובייה אחת, ונמשיך לספור בקובייה השנייה.',
  'ex.dice2.hint2': 'נתחיל מהקובייה שיש בה יותר, ונקפוץ על ישר המספרים כמו בקובייה השנייה.',
  'adv.dice2.one': 'ספרנו רק קובייה אחת. נמשיך לספור גם את הנקודות בקובייה השנייה.',

  // Ten and more.
  'ex.tenMore.hint1': 'בקבוצה הגדולה יש {ten}. נתחיל מעשר, ונמשיך לספור.',
  'ex.tenMore.hint2': 'נעמוד על עשר, ונקפוץ קפיצה אחת על כל ציור בקבוצה הקטנה.',
  'ex.tenMore.solution': 'יש כאן {all}: {ten} ועוד {k}.',

  // Which number is missing.
  'ex.missing.prompt': 'איזה מספר חסר בשורה?',
  'ex.missing.solution': 'בשורה: {a}, {b}, {c}, {d}.',
  'ex.missing.hint1': 'נקרא את המספרים לפי הסדר, מימין לשמאל, ונגיע למקום הריק.',
  'ex.missing.hint2': 'על ישר המספרים כל מספר גדול באחד מהמספר שלפניו.',
  'adv.missing.shown': 'המספר {v} כבר נמצא בשורה. איזה מספר בא במקום הריק?',
  'adv.missing.near': 'נקרא שוב את השורה לאט, מספר אחרי מספר, ונראה מה בא במקום הריק.',

  // The same number twice.
  'ex.double.prompt': 'בכל קבוצה יש {a}. כמה {plural} יש ביחד?',
  'ex.double.solution': '{n} ועוד {n} זה {c}.',
  'ex.double.hint1': 'נספור את הקבוצה הראשונה, ונמשיך לספור בקבוצה השנייה.',
  'ex.double.hint2': 'נעמוד על {n}, ונקפוץ עוד {k}.',
  'adv.double.one': 'ספרנו רק קבוצה אחת. בקבוצה השנייה יש עוד אותו מספר.',

  // Hops on the number line.
  'ex.hopFwd.prompt': 'נעמוד על {s} ונקפוץ {k} קדימה. לאן נגיע?',
  'ex.hopBack.prompt': 'נעמוד על {s} ונקפוץ {k} אחורה. לאן נגיע?',
  'ex.hopFwd.solution': '{s} ועוד {k} זה {c}.',
  'ex.hopBack.solution': '{s} פחות {k} זה {c}.',
  'ex.hop.hint1': 'כל קפיצה היא צעד אחד. נספור את הקפיצות בקול.',
  'adv.hop.stay': 'זה המספר שעמדנו עליו. עכשיו נקפוץ.',
  'adv.hop.count': 'נספור שוב את הקפיצות, אחת אחת.',
  'adv.hopFwd.back': 'קפצנו אחורה. קדימה זה אל המספרים הגדולים.',
  'adv.hopBack.fwd': 'קפצנו קדימה. אחורה זה אל המספרים הקטנים.',
} as const;
