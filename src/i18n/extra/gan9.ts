/**
 * Hebrew texts of gan hova's twelfth world, "סיפורים חשבוניים" (merged into
 * `he`). Short stories read aloud: getting more, giving some away, both
 * children together, who has more, a story with no picture, which exercise
 * tells the story, and a story in two steps.
 */
export const heGan9 = {
  'topic.story0': 'סיפורים חשבוניים',
  'level.story0.1': 'קיבלו עוד: עד 5',
  'level.story0.2': 'קיבלו עוד: עד 10',
  'level.story0.3': 'נתנו לחבר: עד 5',
  'level.story0.4': 'נתנו לחבר: עד 10',
  'level.story0.5': 'כמה יש לשניהם ביחד?',
  'level.story0.6': 'למי יש יותר, ובכמה?',
  'level.story0.7': 'סיפור בלי תמונה: קיבלו',
  'level.story0.8': 'סיפור בלי תמונה: נתנו',
  'level.story0.9': 'איזה תרגיל מתאים?',
  'level.story0.10': 'סיפור בשני שלבים',

  'ex.s0.get.story': {
    f: 'ל{name} היו {a}. היא קיבלה עוד {b}. כמה {plural} יש ל{name} עכשיו?',
    m: 'ל{name} היו {a}. הוא קיבל עוד {b}. כמה {plural} יש ל{name} עכשיו?',
  },
  'ex.s0.give.story': {
    f: 'ל{name} היו {a}. היא נתנה {b} לחברה. כמה {plural} נשארו ל{name}?',
    m: 'ל{name} היו {a}. הוא נתן {b} לחבר. כמה {plural} נשארו ל{name}?',
  },
  'ex.s0.both.story': 'ל{name} יש {a}, ול{other} יש {b}. כמה {plural} יש לשניהם ביחד?',
  'ex.s0.more.story': 'ל{name} יש {a}. ל{other} יש {b}. בכמה {plural} יש ל{name} יותר?',
  'ex.s0.two.story': {
    f: 'ל{name} היו {a}. היא קיבלה עוד {b}, ואחר כך נתנה {c} לחברה. כמה {plural} יש לה עכשיו?',
    m: 'ל{name} היו {a}. הוא קיבל עוד {b}, ואחר כך נתן {c} לחבר. כמה {plural} יש לו עכשיו?',
  },
  'ex.s0.which.prompt': 'איזה תרגיל מתאים לסיפור?',

  'ex.s0.get.hint1': 'היו, וקיבלו עוד: עכשיו יש יותר. נתחיל ממה שהיה, ונמשיך לספור.',
  'ex.s0.give.hint1': 'היו, ונתנו חלק: עכשיו יש פחות. נוריד את מה שנתנו.',
  'ex.s0.both.hint1': 'ביחד פירושו: של שניהם. נספור את של הראשון, ונמשיך לספור את של השני.',
  'ex.s0.more.hint1': 'נשים אחד מול אחד. כמה נשארים בלי זוג?',
  'ex.s0.two.hint1': 'נעשה את זה לאט, צעד אחרי צעד: קודם קיבלו, ואחר כך נתנו.',
  'ex.s0.which.hint1': 'קיבלו עוד, או שהיו ביחד? זה ועוד. נתנו או הלכו? זה פחות.',
  'ex.s0.line.add': 'על ישר המספרים: נתחיל מ{a}, ונקפוץ קדימה {b}.',
  'ex.s0.line.sub': 'על ישר המספרים: נתחיל מ{a}, ונקפוץ אחורה {b}.',
  'ex.s0.picture.hint2': 'הנה הסיפור בציור. נספור.',

  'ex.s0.add.solution': '{a} ועוד {b} זה {c}.',
  'ex.s0.sub.solution': '{a} פחות {b} זה {c}.',
  'ex.s0.two.solution': '{a} ועוד {b} זה {s}, ופחות {c} זה {d}.',
  'ex.s0.which.solution': 'הסיפור הוא {a} {op} {b}.',
  'ex.s0.op.plus': 'ועוד',
  'ex.s0.op.minus': 'פחות',

  'adv.s0.get.less': 'כשמקבלים עוד, יש יותר ממה שהיה, לא פחות. ננסה שוב.',
  'adv.s0.give.more': 'כשנותנים, נשאר פחות ממה שהיה, לא יותר. ננסה שוב.',
  'adv.s0.first': 'זה מה שהיה בהתחלה. מה קרה אחר כך?',
  'adv.s0.which': 'בתרגיל הזה יש {op}. נחשוב שוב: קיבלו, או נתנו?',
} as const;
