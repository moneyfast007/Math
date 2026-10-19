/**
 * Hebrew texts added by the content fixes for gan and grade 1 (merged into `he`).
 * Plain strings, or { f, m } when the sentence addresses the child.
 */
export const heGan1 = {
  // World 1 (gan): counting, making five and ten.
  'hint.count.2few': 'נגע בכל ציור, ונספור יחד.',
  'ex.makeN.hint1frame': 'במסגרת יש מקום ל{target}. נספור את המשבצות הריקות.',

  // World "צורות ודגמים" (gan): the curriculum's word is "דגם", not "דפוס".
  'topic.shapes.patterns': 'צורות ודגמים',
  'level.shapes.colorPattern': 'דגם של צבעים',
  'level.shapes.shapePattern': 'דגם של צורות',
  'level.shapes.missingInPattern': 'מה חסר בדגם?',
  'ex.pattern.missing.model': 'מה חסר בדגם?',
  'ex.pattern.sayIt.model': 'אומרים את הדגם בקול: {seq}',
  'ex.pattern.exampleSolved': '{seq}, מה? {unit} חוזרים שוב ושוב, ולכן עכשיו בא {next}.',
  'ex.shapes.looksLike': 'ככה נראה {name}:',
  'ex.shapes.corners.countThem': 'נספור את הפינות של כל צורה.',
  'ex.shapes.same.example2': 'שני אלה {names}, גם אם אחד קטן יותר, מסובב ובצבע אחר.',
  'ex.pencils.exampleShort': 'העיפרון שמגיע הכי נמוך הוא הקצר ביותר.',

  // World 1 (gan): advice for the typical wrong answers, said for the exercise's numbers.
  'adv.count.twice': 'אולי ספרנו ציור אחד פעמיים. נספור שוב לאט, ונגע בכל ציור פעם אחת.',
  'adv.count.skipped': 'אולי דילגנו על ציור. נספור שוב לאט, ונגע בכל ציור.',
  'adv.more.check': 'יש {a} ו{b}. נספור שוב כל קבוצה: איזה מספר גדול יותר?',
  'adv.fewer.check': 'בקבוצה הזאת יש יותר. השאלה איפה יש פחות: יש {a} ו{b}.',
  'adv.oneMore.same': {
    f: 'בהתחלה היו {a}. הוסיפו עוד אחת, ונספור גם אותה.',
    m: 'בהתחלה היו {a}. הוסיפו עוד אחד, ונספור גם אותו.',
  },
  'adv.oneMore.over': {
    f: 'הוסיפו רק אחת. נספור שוב לאט, ונגע בכל ציור פעם אחת.',
    m: 'הוסיפו רק אחד. נספור שוב לאט, ונגע בכל ציור פעם אחת.',
  },
  'adv.oneLess.same': {
    f: 'היו {a}, ולקחו אחת. את המחוקה כבר לא סופרים.',
    m: 'היו {a}, ולקחו אחד. את המחוק כבר לא סופרים.',
  },
  'adv.oneLess.under': {
    f: 'לקחו רק אחת. נספור שוב את אלה שלא מחוקות.',
    m: 'לקחו רק אחד. נספור שוב את אלה שלא מחוקים.',
  },
  'adv.makeN.counted': 'במסגרת יש כבר {a}. השאלה כמה חסר עד {target}: נספור את המשבצות הריקות.',
  'adv.makeN.near': '{a} ועוד {v} זה {s}, ולא {target}. נספור שוב את המשבצות הריקות.',
  'adv.after.before': '{v} בא לפני {n}. אנחנו מחפשים את המספר שבא אחריו.',
  'adv.after.self': 'זה המספר שבשאלה. איזה מספר אומרים מיד אחרי {n}?',
  'adv.after.skip': 'דילגנו על מספר. נספור מ{n} צעד אחד קדימה.',
  'adv.before.after': '{v} בא אחרי {n}. אנחנו מחפשים את המספר שבא לפניו.',
  'adv.before.self': 'זה המספר שבשאלה. איזה מספר אומרים ממש לפני {n}?',
  'adv.before.skip': 'דילגנו על מספר. נספור מ{n} צעד אחד אחורה.',
  'adv.bigger.check':
    'נספור מאחת: אחת, שתיים, שלוש... למי מגיעים קודם, ל{a} או ל{b}? הגדול הוא זה שמגיעים אליו אחר כך.',

  // World 1 (grade 1): levels 6–10, friends of ten and ten-plus before crossing ten.
  'level.addSub20.addSub10': 'חיבור וחיסור עד 10',
  'level.addSub20.friends10': 'חברים של 10',
  'level.addSub20.tenPlus': 'עשר ועוד',
  'level.addSub20.teens': 'עד 20 בלי מעבר עשרת',
  'level.addSub20.crossTen': 'מעבר עשרת',
  // The missing number, its worked example in the same shape.
  'ex.missAdd.exampleSolved': 'כמה צריך להוסיף ל{a} כדי להגיע ל{c}? {b}, כי {a} ועוד {b} זה {c}.',
  'hint.friends10.frame': 'במסגרת יש עשר משבצות. נספור את המשבצות הריקות.',
  'hint.friends10.sub': 'עשר זה {b} ועוד כמה?',
  'hint.friends10.subPicture': 'הנה עשרה ציורים. נספור את אלה שלא מחוקים.',
  'hint.tenPlus.add': 'עשר זה עשרת אחת. ועוד {u} אחדות: איזה מספר זה?',
  'hint.tenPlus.subOnes': 'ב{a} יש עשרת אחת ו{u} אחדות. מורידים את כל האחדות: מה נשאר?',
  'hint.tenPlus.subTen': 'ב{a} יש עשרת אחת ו{u} אחדות. מורידים את העשרת: מה נשאר?',
  'hint.tenPlus.picture': 'הנה עשרת שלמה, ולידה האחדות.',
  'hint.tenPlus.subPicture': 'סידרנו בשורות של חמש. נספור את מה שלא מחוק.',
  // Crossing ten, broken up openly: 9 + 5 = 9 + 1 + 4.
  'hint.addCross.split': 'נפרק את {small}: {to10} ו{rest}. {big} ועוד {to10} זה עשר, ועוד {rest}.',
  'hint.subCross.split': 'נפרק את {b}: {u} ו{rest}. {a} פחות {u} זה עשר, ואז נוריד עוד {rest}.',
  'ex.addCross.exampleSolved': '{a} ועוד {b}: {big} ועוד {to10} זה עשר, ועשר ועוד {rest} זה {c}.',
  'ex.subCross.exampleSolved': '{a} פחות {b}: {a} פחות {u} זה עשר, ועשר פחות {rest} זה {c}.',
  'adv.missAdd.added': 'חיברנו את {a} ו{c}. השאלה כמה צריך להוסיף ל{a} כדי להגיע ל{c}.',
  'adv.friends10.check': 'נבדוק: {a} ועוד {v} זה {s}, ולא עשר.',
  'adv.tenPlus.addOne': 'העשר הוא עשרת שלמה, ולא אחד. עשרת אחת ועוד {u} אחדות: איזה מספר זה?',
  'adv.tenPlus.zero': 'האחדות נגמרו, אבל העשרת נשארה. כמה זה עשרת אחת?',
  'adv.tenPlus.one': 'נשארה עשרת שלמה, והיא שווה יותר מאחד. כמה אחדות יש בעשרת?',
  'adv.tenPlus.minusOne': 'הורדנו אחד, אבל צריך להוריד עשר: את כל העשרת.',
  'adv.subCross.flip':
    'הורדנו {u} מ{b}, אבל צריך להוריד {b} מ{a}. נרד קודם לעשר, ואחר כך נוריד את מה שנשאר.',

  // World "מספרים עד 100" (grade 1).
  'ex.after.hint1.tens':
    'אחרי מספר בא המספר שגדול ממנו באחד. כשספרת האחדות היא תשע, עוברים לעשרת הבאה.',
  'ex.before.hint1.tens':
    'לפני מספר בא המספר שקטן ממנו באחד. כשספרת האחדות היא אפס, חוזרים לעשרת הקודמת.',
  'ex.build.hint2.sides':
    'במספר דו-ספרתי, ספרת העשרות היא הספרה השמאלית, וספרת האחדות היא הספרה הימנית.',
  'ex.decompose.hint1.sides': 'הספרה השמאלית אומרת כמה עשרות יש, והספרה הימנית אומרת כמה אחדות.',
  'ex.tensAdd.hint1.add': '{a} זה {ta} עשרות, ו{b} זה {tb} עשרות. כמה עשרות יש ביחד?',
  'ex.tensAdd.hint1.sub': '{a} זה {ta} עשרות. מורידים {tb} עשרות: כמה עשרות נשארות?',
  'ex.marked.hint2.ticks':
    'הישר מתחיל ב{from}. כל קו קטן הוא עוד אחד, והקווים הארוכים הם העשרות. הקו הבינוני באמצע הוא העשרת ועוד חמש.',

  // World "שעון וכסף" (grade 1): whole hours before half hours; change from 10 and from 20.
  'level.clockMoney1.hourLater': 'מה השעה בעוד שעה?',
  'level.clockMoney1.halfHours': 'חצאי שעה',
  'level.clockMoney1.change': 'עודף מ-10 ומ-20',
} as const;
