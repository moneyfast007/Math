/**
 * Hebrew texts of gan hova's eleventh world, "פירוק מספרים" (merged into `he`).
 * A number is two numbers together: what hides in the box, the fingers of the
 * second hand, pairs of dice, the number's house, the friends of ten.
 */
export const heGan8 = {
  'topic.bonds0': 'פירוק מספרים',
  'level.bonds0.1': 'מה מסתתר בקופסה? עד 5',
  'level.bonds0.2': 'מה מסתתר בקופסה? עד 10',
  'level.bonds0.3': 'אצבעות בשתי ידיים',
  'level.bonds0.4': 'איזה זוג עושה 4 או 5?',
  'level.bonds0.5': 'איזה זוג עושה 6, 7 או 8?',
  'level.bonds0.6': 'איזה זוג לא מתאים?',
  'level.bonds0.7': 'בית המספר עד 5',
  'level.bonds0.8': 'בית המספר עד 10',
  'level.bonds0.9': 'חברים של 10',
  'level.bonds0.10': 'כמה חסר?',

  // 1, 2: some outside, the rest hidden in the box.
  'ex.b0.hide.spoken': {
    f: 'יש {t} בסך הכול. {v} בחוץ. כמה מסתתרות בקופסה?',
    m: 'יש {t} בסך הכול. {v} בחוץ. כמה מסתתרים בקופסה?',
  },
  'ex.b0.hide.hint1': 'נספור את מה שבחוץ, ונמשיך לספור על האצבעות עד שנגיע ל{t}.',
  'ex.b0.hide.solution': '{v} ועוד {h} זה {t}. בקופסה יש {h}.',
  'adv.b0.hide.all': 'זה המספר של כולם ביחד. חלק כבר בחוץ: כמה נשארו בקופסה?',
  'adv.b0.hide.out': 'זה המספר של מה שבחוץ. השאלה כמה מסתתר בתוך הקופסה.',

  // 3: one hand of five, and the other hand.
  'ex.b0.hand.spoken': 'הרמתי {t} אצבעות. ביד אחת חמש. כמה אצבעות ביד השנייה?',
  'ex.b0.hand.hint1': 'ביד אחת חמש אצבעות. נמשיך לספור מחמש עד {t}.',
  'ex.b0.hand.hint2': 'נרים חמש אצבעות ביד אחת, ונוסיף אצבעות ביד השנייה עד שיהיו {t}.',
  'adv.b0.hand.all': 'זה המספר של כל האצבעות. ביד אחת כבר חמש: כמה ביד השנייה?',
  'ex.b0.hand.solution': 'חמש ועוד {h} זה {t}. ביד השנייה {h}.',

  // 4, 5: which pair of dice makes the number.
  'ex.b0.pair.spoken': 'באיזה זוג קוביות יש בסך הכול {t}?',
  'ex.b0.pair.hint1': 'בכל זוג נספור את הנקודות בשתי הקוביות ביחד.',
  'ex.b0.pair.hint2': 'נתחיל מהקובייה שיש בה יותר, ונמשיך לספור בקובייה השנייה.',
  'ex.b0.pair.solution': '{a} ועוד {b} זה {t}.',
  'adv.b0.pair': 'בזוג הזה יש {a} ועוד {b}, וזה {s}. אנחנו מחפשים {t}.',

  // 6: the pair that does not make it.
  'ex.b0.odd.spoken': 'שני זוגות עושים {t}, ואחד לא. איזה זוג לא מתאים?',
  'ex.b0.odd.hint1': 'נספור את הנקודות בכל זוג, ונבדוק איפה יש {t}.',
  'ex.b0.odd.solution': 'בזוג הזה יש {a} ועוד {b}, וזה {s}, ולא {t}.',
  'adv.b0.odd': 'בזוג הזה יש {a} ועוד {b}, וזה בדיוק {t}. נחפש זוג אחר.',

  // 7, 8: the number's house.
  'ex.b0.house.spoken': 'בבית של {t} גרים {a} ועוד כמה?',
  'ex.b0.house.hint1': 'בגג כתוב המספר של כל הבית. בחלון אחד {a}: כמה חסר עד {t}?',
  'ex.b0.house.solution': '{a} ועוד {h} זה {t}.',

  // 9, 10: the friends of ten, and what is missing.
  'ex.b0.ten.spoken': '{a} ועוד כמה זה עשר?',
  'ex.b0.missing.spoken': '{a} ועוד כמה זה {t}?',
  'ex.b0.missing.hint1': 'נתחיל מ{a}, ונספור על האצבעות עד {t}.',
  'ex.b0.ten.hint1': 'במסגרת יש עשר משבצות, ו{a} מהן מלאות. כמה משבצות ריקות?',
  'adv.b0.missing.whole': 'זה המספר שאנחנו רוצים להגיע אליו. כמה צריך להוסיף ל{a}?',
} as const;
