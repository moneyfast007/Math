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

  // World 1 (grade 1): the missing number, its worked example in the same shape.
  'ex.missAdd.exampleSolved': 'כמה צריך להוסיף ל{a} כדי להגיע ל{c}? {b}, כי {a} ועוד {b} זה {c}.',
  'ex.missSub.exampleSolved': 'כמה צריך להוריד מ{c} כדי להגיע ל{b}? {a}, כי {c} פחות {a} זה {b}.',

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
