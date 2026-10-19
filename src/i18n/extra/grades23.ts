/**
 * Hebrew texts added by the content fixes for grades 2–3 (merged into `he`).
 * Plain strings, or { f, m } when the sentence addresses the child.
 */
export const heGrades23 = {
  /* ---------- Grade 2: addition and subtraction to 100 ---------- */
  'level.addSub100.unitsPlain': 'ועוד ופחות אחדות, בלי המרה',
  'level.addSub100.subNoBorrow': 'חיסור דו-ספרתי בלי פריטה',
  'level.addSub100.subBorrow': 'חיסור דו-ספרתי עם פריטה',
  'hint.add100.steps': 'נעשה את זה בשני צעדים:',
  'hint.add100.makeTen': '{u} ועוד {b} זה עשר: האחדות משלימות עשרת שלמה, ולא נשארות אחדות.',
  'hint.add100.roundTen': 'למספר עגול מוסיפים אחדות: העשרות נשארות, והאחדות הן מה שמוסיפים.',
  'hint.tens100.count': 'נספור בעשרות: {b} זה {tb} עשרות. העשרות משתנות, והאחדות לא זזות.',
  'hint.numberLineTens':
    'על ישר המספרים: מהנקודה הראשונה קופצים לעשרת הבאה, ומשם בקפיצות של עשר עד הנקודה השנייה. כמה קפצנו בסך הכול?',
  'wp.start.story': {
    f: '{name} נתנה {b} ל{other}, ונשארו לה {a}. כמה {plural} היו ל{name} בהתחלה?',
    m: '{name} נתן {b} ל{other}, ונשארו לו {a}. כמה {plural} היו ל{name} בהתחלה?',
  },
  'wp.start.hint1': 'בהתחלה היה יותר: מה שנתנו ועוד מה שנשאר. מחברים.',
  'wp.need.story': {
    f: 'ל{name} יש {b}, והיא רוצה שיהיו לה {a}. כמה {plural} עוד היא צריכה?',
    m: 'ל{name} יש {b}, והוא רוצה שיהיו לו {a}. כמה {plural} עוד הוא צריך?',
  },
  'wp.need.hint1': '"כמה עוד" זה ההפרש בין מה שרוצים למה שיש: מחסרים את מה שיש.',
  'wp.compare2.story':
    'ל{name} יש {a}. ל{other} יש {b}. בכמה {plural} יש ל{name} יותר מאשר ל{other}?',
  'wp.compare2.hint1': '"בכמה יותר" זה ההפרש בין שני המספרים: מחסרים את הקטן מהגדול.',
  'wp.twoStep.story': {
    f: 'ל{name} היו {a}. היא קיבלה עוד {b}, ואחר כך נתנה {c} ל{other}. כמה {plural} יש ל{name} עכשיו?',
    m: 'ל{name} היו {a}. הוא קיבל עוד {b}, ואחר כך נתן {c} ל{other}. כמה {plural} יש ל{name} עכשיו?',
  },
  'wp.twoStep.hint1':
    'שני שלבים, לפי הסדר בסיפור: קודם מוסיפים את מה שקיבלו, ואחר כך מורידים את מה שנתנו.',
  'wp.twoStep.solution': '{a} ועוד {b} זה {s}. אחר כך, {s} פחות {c} זה {r}.',

  /* ---------- Grade 2: multiplication and division, first steps ---------- */
  'ex.repeated.is': 'זה',

  /* ---------- Grade 2: money ---------- */
  'level.money.same': 'קונים כמה מאותו דבר',
  'ex.money.value.hint2coins': 'הנה המטבעות של השקל, מהקטן לגדול.',
  'ex.money.value.hint2notes': 'הנה השטרות, מהקטן לגדול.',
  'ex.money.count.hint1notes': 'מתחילים מהשטר או מהמטבע הגדול ביותר, וממשיכים לספור ממנו.',
  'ex.money.enough.exampleNo': 'יש {have}, והמחיר הוא {p}. אין מספיק כסף.',
  'ex.money.same.story': {
    f: '{name} קנתה {k}. המחיר של כל {singular} הוא {p}. כמה היא שילמה בסך הכול?',
    m: '{name} קנה {k}. המחיר של כל {singular} הוא {p}. כמה הוא שילם בסך הכול?',
  },
  'ex.money.same.hint1': 'כולם עולים אותו מחיר: מחברים את המחיר שוב ושוב, פעם אחת לכל אחד.',
  'ex.money.same.hint2': 'אפשר לכתוב את זה כחיבור חוזר:',
  'ex.money.same.solution': '{k} פעמים {p} זה {total}.',
  'ex.money.total.story2': {
    f: '{name} קנתה {item} שעולה {a} ו{item2} שעולה {b}. כמה היא שילמה בסך הכול?',
    m: '{name} קנה {item} שעולה {a} ו{item2} שעולה {b}. כמה הוא שילם בסך הכול?',
  },
  'ex.money.totalChange.hint2': 'שני תרגילים, זה אחרי זה: קודם המחיר של שניהם ביחד, ואחר כך העודף.',
  'ex.money.totalChange.example': '{a} ועוד {b} זה {total}. {paid} פחות {total} זה {c}.',
  'ex.money.totalChange.solution2': 'הכול ביחד עולה {total}, והעודף הוא {c}.',
  'ex.money.change.adviceOver':
    'המחיר ועוד העודף הם מה ששילמנו. אבל {p} ועוד {v} זה {s}, יותר מ{paid}. כמה חסר מ{p} עד {paid}?',
  'ex.money.change.adviceUnder':
    'המחיר ועוד העודף הם מה ששילמנו. אבל {p} ועוד {v} זה {s}, פחות מ{paid}. כמה חסר מ{p} עד {paid}?',
  'ex.money.change.advicePrice': '{p} זה המחיר. העודף הוא מה שחוזר אלינו: כמה חסר מ{p} עד {paid}?',
  'ex.money.change.adviceAdded': 'העודף קטן ממה ששילמנו: את המחיר לא מוסיפים, מורידים.',
  'ex.money.totalChange.adviceTotal':
    '{v} זה המחיר של שניהם ביחד. עכשיו העודף: כמה חסר מ{v} עד {paid}?',
  'ex.money.totalChange.adviceOne':
    '{v} זה העודף על דבר אחד בלבד. קודם מחברים את שני המחירים, ואחר כך מחשבים את העודף.',

  /* ---------- Grade 2: the clock ---------- */
  'level.clock.review': 'שעות שלמות וחצאי שעה',
  'level.clock.soon': 'בעוד רבע שעה, בעוד חצי שעה',
  'level.clock.quarterElapsed': 'כמה זמן עבר? ברבעי שעה',
  'ex.clock.later.hint2': 'ליד איזה מספר יהיה המחוג הקצר?',
  'ex.clock.earlier.hint2': 'ליד איזה מספר היה המחוג הקצר?',
  'ex.clock.elapsed.hint2b': 'כמה שעות שלמות עברו? וכמה זז המחוג הארוך: חצי סיבוב הוא חצי שעה.',
  'ex.clock.inHalf.prompt': 'מה תהיה השעה בעוד חצי שעה?',
  'ex.clock.inQuarter.prompt': 'מה תהיה השעה בעוד רבע שעה?',
  'ex.clock.inHalf.hint1':
    'בעוד חצי שעה המחוג הארוך עושה חצי סיבוב. אם הוא עובר את השתים עשרה, השעה מתקדמת באחת.',
  'ex.clock.inQuarter.hint1':
    'בעוד רבע שעה המחוג הארוך עושה רבע סיבוב, שלושה מספרים קדימה. אם הוא עובר את השתים עשרה, השעה מתקדמת באחת.',
  'ex.clock.soon.hint2': 'לאן יגיע המחוג הארוך? והאם המחוג הקצר יעבור למספר הבא?',
  'ex.clock.inHalf.solution': 'השעון מראה {from}. בעוד חצי שעה תהיה השעה {to}.',
  'ex.clock.inQuarter.solution': 'השעון מראה {from}. בעוד רבע שעה תהיה השעה {to}.',
  'ex.clock.quarterElapsed.hint1': 'כל רבע סיבוב של המחוג הארוך הוא רבע שעה, וסיבוב שלם הוא שעה.',
  'ex.clock.quarterElapsed.hint2':
    'נספור ברבעי שעה: מהשעון הראשון לשני, כמה פעמים זז המחוג הארוך שלושה מספרים?',
  // Advice for a wrong time chosen: what that choice mixed up.
  'ex.clock.advice.hourNumber': 'נסתכל שוב על המחוג הקצר: על איזה מספר בדיוק הוא מצביע? זו השעה.',
  'ex.clock.advice.halfNext':
    'בחצי שעה המחוג הקצר כבר עבר את השעה, אבל עוד לא הגיע למספר הבא. אומרים את המספר שהוא כבר עבר.',
  'ex.clock.advice.halfNotWhole':
    'המחוג הארוך על שש, לא על שתים עשרה: עברה חצי שעה. אומרים ״וחצי״.',
  'ex.clock.advice.pastNext':
    'ב״ורבע״ המחוג הקצר רק עבר קצת את השעה, והוא עוד רחוק מהמספר הבא. אומרים את המספר שהוא עבר.',
  'ex.clock.advice.pastNotTo':
    'המחוג הארוך על שלוש, ולכן אומרים ״ורבע״. ״רבע ל...״ אומרים כשהמחוג הארוך על תשע.',
  'ex.clock.advice.toNotPast':
    'המחוג הארוך על תשע, ולכן אומרים ״רבע ל...״. ״ורבע״ אומרים כשהמחוג הארוך על שלוש.',
  'ex.clock.advice.toHour':
    'ב״רבע ל...״ אומרים את השעה שהמחוג הקצר מתקרב אליה, את המספר הבא, ולא את המספר שהוא כבר עבר.',
  'ex.clock.advice.pickPastNotTo':
    'בשעון הזה המחוג הארוך על שלוש, וזה ״ורבע״. ב״רבע ל...״ המחוג הארוך על תשע.',
  'ex.clock.advice.pickToNotPast':
    'בשעון הזה המחוג הארוך על תשע, וזה ״רבע ל...״. ב״ורבע״ המחוג הארוך על שלוש.',
  'ex.clock.advice.pickToHour':
    'בשעון הזה המחוג הקצר מתקרב למספר אחר. ב״רבע ל...״ המחוג הקצר כמעט הגיע לשעה שאומרים.',

  /* ---------- Grade 3: the multiplication table ---------- */
  'hint.mul.missingRows': 'יש {b} שורות, ובסך הכול {c} נקודות. כמה נקודות יש בכל שורה?',
  'hint.div.missingStart2':
    'איזה מספר מחלקים ל{b} קבוצות, כך שבכל קבוצה יש {q}? נחשב {q} כפול {b}.',
  'hint.div.arrayStart': 'בציור: {b} קבוצות, ובכל אחת {q}. כמה נקודות יש בסך הכול?',
  'hint.div.arrayDivisor': 'בציור: {a} נקודות, בשורות של {q}. כמה שורות יש?',
  'hint.mul.tensCount': '{b} זה {t} עשרות. כמה זה {a} פעמים {t} עשרות?',
  'eq.remainder.solution2': '{a} חלקי {b} זה {q}, והשארית היא {r}.',
  'wp.boxesPlus.story': {
    f: 'ל{name} יש {boxesA}, ובכל קופסה {b}. יש לה גם עוד {c}. כמה {plural} יש לה בסך הכול?',
    m: 'ל{name} יש {boxesA}, ובכל קופסה {b}. יש לו גם עוד {c}. כמה {plural} יש לו בסך הכול?',
  },
  'wp.boxesPlus.hint1':
    'שני שלבים: קודם כמה יש בכל הקופסאות ביחד, ואחר כך מוסיפים את מה שיש בנוסף.',
  'wp.boxesPlus.solution': '{a} כפול {b} זה {s}. ועוד {c} זה {r}.',

  /* ---------- Grade 3: numbers to 10,000 ---------- */
  'ex.estimate.hint2add': 'אחרי העיגול: {a} ועוד {b}.',
  'ex.estimate.hint2sub': 'אחרי העיגול: {a} פחות {b}.',
  'ex.placeValue.hint1q': 'באיזה מקום נמצאת הספרה {d}: אחדות, עשרות, מאות או אלפים?',
  'ex.placeValue.hint2place':
    'הספרה {d} נמצאת במקום ה{place}. כך נראה מספר אחר, מפורק לפי ערך המקום:',

  /* ---------- Grade 3: fractions ---------- */
  // { f, m } here follow the fraction noun's gender (חמישיות, רבעים), not the child's.
  'level.fractions1.unit': 'שברי יחידה',
  'level.fractions1.equal': 'שני רבעים הם חצי',
  'level.fractions1.sevenths': 'שביעיות ותשיעיות',
  'ex.frac.halfq.prompt': { f: 'כמה {plural} הן {frac}?', m: 'כמה {plural} הם {frac}?' },
  'ex.frac.halfq.hint1': 'בשלם אחד יש {all}.',
  'ex.frac.halfq.hint2': 'מחלקים את השלם ל{groups} שוות, ולוקחים {take}.',
  'ex.frac.halfq.solution': { f: '{a} הן {b}.', m: '{a} הם {b}.' },
  'ex.frac.name.solution1': 'השלם מחולק ל{parts} חלקים, ואחד מהם צבוע. זה {frac}.',
  'ex.frac.numerator.prompt2': { f: 'כמה {plural} צבועות?', m: 'כמה {plural} צבועים?' },
  'ex.frac.numerator.solution1': { f: 'צבועה {frac}.', m: 'צבוע {frac}.' },
  'ex.frac.numerator.solution2': { f: 'צבועות {frac}.', m: 'צבועים {frac}.' },
  'ex.frac.bigger.solution2': 'השבר {w} גדול יותר מהשבר {l}.',
  'ex.frac.whole.hint1b': {
    f: 'נספור כמה {plural} ממלאות שלם אחד.',
    m: 'נספור כמה {plural} ממלאים שלם אחד.',
  },
  'ex.frac.whole.hint2many': 'בשלם אחד יש {all}. כמה יש ב{wholes}?',
  'ex.frac.whole.solution.one': 'בשלם אחד יש {frac}.',
  'ex.frac.whole.solution.many': 'ב{wholes} יש {frac}.',
  'ex.frac.bigger.hint2both':
    'בציור, השבר הראשון למעלה והשני מתחתיו, באותו אורך. איזה מהם צבוע יותר?',
  'ex.frac.advice.countedAll': '{v} הם כל החלקים של השלם. נספור רק את החלקים הצבועים.',
  'ex.frac.advice.unshaded': '{v} הם החלקים שלא צבועים. נספור את החלקים הצבועים.',
  'ex.frac.advice.onePart': {
    f: 'מצאנו {unit} אחת מ{whole}: {part}. עכשיו ניקח {frac}.',
    m: 'מצאנו {unit} אחד מ{whole}: {part}. עכשיו ניקח {frac}.',
  },
  'ex.frac.advice.partsCount': 'מחלקים את {whole} ל{parts} שווים. כמה יש בכל חלק?',
  'ex.frac.advice.unitBigger':
    'כשמחלקים את השלם ל{more}, כל חלק קטן יותר מאשר כשמחלקים ל{fewer}. נשווה את הפסים בציור.',
  'ex.frac.advice.sameDen':
    'החלקים בשני השברים באותו גודל. נספור כמה חלקים צבועים בכל פס: איפה יש יותר?',
  'ex.frac.advice.equalWhole': 'בשלם כולו יש {all}. אבל צריך רק {frac}, חלק מהשלם.',
  'ex.frac.advice.equalNum':
    'החלקים החדשים קטנים יותר, ולכן צריך יותר מהם כדי למלא אותו גודל. נסתכל בציור של הרמז.',
  'ex.frac.advice.oneWhole': 'בשלם אחד יש {all}. אבל יש כאן {wholes}: כמה יש בכולם?',

  /* ---------- Grade 3: clock and measures ---------- */
  'ex.measure.hours.q9': 'כמה דקות יש בשעה ורבע?',
  'ex.measure.hours.q10': 'כמה דקות יש בשעה ועשרים דקות?',
  'ex.measure.hours.q11': 'כמה דקות יש בארבע שעות?',
  'ex.measure.hours.q12': 'כמה דקות יש בשעתיים ורבע?',
  'ex.measure.hours.back': 'כמה שעות הן {m}?',
  'ex.measure.hours.halves': 'כמה חצאי שעה יש בשעה וחצי?',
  'ex.measure.hours.quarters': 'כמה רבעי שעה יש בשעה?',
  'ex.measure.hours.hint.one': 'כל מספר בשעון שווה חמש דקות למחוג הארוך. כמה מספרים יש בשעון?',
  'ex.measure.hours.hint.halfHour': 'בחצי שעה המחוג הארוך עושה חצי סיבוב: חצי מהדקות של שעה שלמה.',
  'ex.measure.hours.hint.quarterHour':
    'ברבע שעה המחוג הארוך זז שלושה מספרים, וכל מספר הוא חמש דקות.',
  'ex.measure.hours.hint.threeQuarters':
    'שלושה רבעי שעה הם שלוש פעמים רבע שעה, ורבע שעה הוא חמש עשרה דקות.',
  'ex.measure.hours.hint.whole': 'בכל שעה יש שישים דקות, לא מאה. סופרים שישים לכל שעה.',
  'ex.measure.hours.hint.half': 'בכל שעה יש שישים דקות, וחצי שעה היא שלושים דקות. מחברים.',
  'ex.measure.hours.hint.quarter': 'בכל שעה יש שישים דקות, ורבע שעה הוא חמש עשרה דקות. מחברים.',
  'ex.measure.hours.hint.twenty': 'בשעה יש שישים דקות, לא מאה. מוסיפים עליהן עוד עשרים.',
  'ex.measure.hours.hint.back': 'כל שישים דקות הן שעה אחת. כמה פעמים שישים נכנס במספר הזה?',
  'ex.measure.hours.hint.halves':
    'כל חצי שעה היא שלושים דקות, ובשעה וחצי יש תשעים דקות. כמה פעמים שלושים?',
  'ex.measure.hours.hint.quarters':
    'כל רבע שעה הוא רבע סיבוב של המחוג הארוך. כמה רבעים יש בסיבוב שלם?',
  'ex.measure.hours.hintClock': 'הנה הזמן הזה בשעון: מהשעון הראשון לשני המחוג הארוך מסתובב.',
  'ex.measure.hours.ex90': 'שעה וחצי זה שישים דקות ועוד שלושים דקות: תשעים דקות.',
  'ex.measure.hours.ex75': 'שעה ורבע זה שישים דקות ועוד חמש עשרה דקות: שבעים וחמש דקות.',
  'ex.measure.hours.ex120': 'שעתיים זה שישים דקות ועוד שישים דקות: מאה ועשרים דקות.',
  'ex.measure.hours.ex240': 'מאתיים וארבעים דקות הן ארבע פעמים שישים דקות: ארבע שעות.',
  'ex.measure.hours.ex120back': 'מאה ועשרים דקות הן פעמיים שישים דקות: שתי שעות.',
  'ex.measure.mixed.solution': '{b} הם {s}, ועוד {e} זה {r}.',
  'ex.measure.m.hintWhole': 'כל מטר הוא מאה סנטימטרים. כמה זה {a} פעמים מאה?',
  'ex.measure.kg.hintWhole': 'כל קילוגרם הוא אלף גרמים. כמה זה {a} פעמים אלף?',
  'ex.measure.m.mixedExample':
    'שני מטרים הם מאתיים סנטימטרים, ועוד שלושים זה מאתיים ושלושים סנטימטרים.',
  'ex.measure.kg.mixedExample':
    'שני קילוגרמים הם אלפיים גרמים, ועוד שלוש מאות זה אלפיים ושלוש מאות גרמים.',
  'ex.measure.ruler.adviceEnd':
    '{to} הוא הסימן שבו העיפרון נגמר. אבל העיפרון לא מתחיל באפס, הוא מתחיל ב{from}. כמה סנטימטרים יש מ{from} עד {to}?',
  'ex.measure.ruler.adviceMarks':
    'נספור את הרווחים בין הסימנים, מהקצה האחד של העיפרון עד הקצה השני, ולא את הסימנים עצמם.',
  'ex.measure.elapsed.adviceNumbers':
    'זה מספר הקפיצות של המחוג הארוך ממספר למספר. כל קפיצה כזאת היא חמש דקות.',
  'ex.measure.hours.adviceHundred': 'בשעה יש שישים דקות, לא מאה. נספור שישים לכל שעה.',
  'ex.measure.adviceExtra': '{v} זה רק {b}. עכשיו נוסיף עוד {e}.',
  'ex.measure.cmp.adviceUnit':
    'המספר גדול יותר, אבל היחידה קטנה יותר. נהפוך את {big} ל{unit}, ואז נשווה.',
  'ex.measure.adviceMeter': 'במטר יש מאה סנטימטרים, לא עשרה. כמה סנטימטרים הם {a}?',
  'ex.measure.adviceKg': 'בקילוגרם יש אלף גרמים, לא מאה. כמה גרמים הם {a}?',
  'ex.measure.clock.adviceFives':
    'המחוג הארוך מצביע על מספר, אבל כל מספר בשעון שווה חמש דקות. נספור בחמש.',
  'ex.measure.clock.adviceHour': 'המחוג הקצר עוד לא הגיע למספר הבא. השעה היא המספר שהוא כבר עבר.',
} as const;
