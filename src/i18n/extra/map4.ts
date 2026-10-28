/**
 * Grade 4's review world before the school's test (fractions, mixed numbers,
 * number names, sequences). Silent: shown, never read aloud, so the texts may
 * carry digits. Only the world's and the stations' names are under spoken
 * prefixes (they also show on the map and the worlds screen).
 */
export const heMap4 = {
  // Between two numbers to choose from ("which is bigger?"), shown in the exercise.
  'math.or': 'או',
  // The two worlds and their stations (spoken prefixes: shown on the map, recorded later).
  'topic.map4.fractions': 'שברים ומספרים מעורבים',
  'topic.map4.numbers': 'מספרים טבעיים',
  'level.map4f.1': 'המונה והמכנה',
  'level.map4f.2': 'איזה שבר בציור?',
  'level.map4f.3': 'מספר מעורב בציור',
  'level.map4f.4': 'קטן מאחד, שווה לאחד או גדול?',
  'level.map4f.5': 'שברים במילים ובספרות',
  'level.map4f.6': 'צמצום והרחבה',
  'level.map4f.7': 'השוואת שברים',
  'level.map4f.8': 'משבר למספר מעורב',
  'level.map4f.9': 'ממספר מעורב לשבר',
  'level.map4f.10': 'בעיות מילוליות בשברים',
  'level.map4n.1': 'שם המספר: מספרות למילים',
  'level.map4n.2': 'שם המספר: ממילים לספרות',
  'level.map4n.3': 'סדרות: המספר החסר',
  'level.map4n.4': 'סדרות: מה החוק?',
  'level.map4n.5': 'חיבור במאונך',
  'level.map4n.6': 'חיסור במאונך',
  'level.map4n.7': 'סדר פעולות',
  'level.map4n.8': 'סדר פעולות עם סוגריים',
  'level.map4n.9': 'בעיות מילוליות בחיבור',
  'level.map4n.10': 'בעיות מילוליות בחיסור',

  // Where it opens: its section on the worlds screen; the parent's switch.
  'map4.bonus': 'עולם בונוס: תרגול מיפוי מתמטיקה',
  'map4.title': 'תרגול למיפוי במתמטיקה',
  'map4.parts': 'שני שלבים: שברים ומספרים מעורבים · מספרים טבעיים',
  'map4.grade': 'כיתה ד׳',
  'map4.intro':
    'שני עולמות עם כל הנושאים של המיפוי. אפשר לתרגל אותם בכל זמן, והמסע הרגיל מחכה במקומו.',
  'map4.stations': '{done} מתוך {total} תחנות',
  'map4.done': 'כל התחנות הושלמו ✓',
  'map4.notYet': 'עוד לא התחלת',
  'map4.back': 'חזרה למסע',
  'map4.here': 'תרגול למיפוי · {name}',
  'c.settings.testPrep': 'תרגול למיפוי (כיתה ד׳)',
  'c.settings.testPrepOn': 'מוצג',
  'c.settings.testPrepOff': 'מוסתר',
  'c.settings.testPrepHint': 'שני עולמות תרגול לקראת המיפוי, בעמוד "כל העולמות".',

  // 1. The numerator and the denominator.
  'r4.num.prompt': 'מה המונה? (כמה חלקים צבועים)',
  'r4.den.prompt': 'מה המכנה? (לכמה חלקים שווים חילקו את השלם)',
  'r4.num.hint1': 'המונה הוא המספר למעלה. הוא אומר כמה חלקים לקחנו.',
  'r4.den.hint1': 'המכנה הוא המספר למטה. הוא אומר לכמה חלקים שווים חילקו את השלם.',
  'r4.num.hint2': 'ספרו רק את החלקים הצבועים.',
  'r4.den.hint2': 'ספרו את כל החלקים, גם את הלבנים.',
  'r4.example': 'הנה תרגיל דומה שכבר פתרנו:',

  // 2. Which fraction is drawn.
  'r4.pic.prompt': 'איזה שבר מתאים לציור?',
  'r4.pic.hint1': 'המכנה: כמה חלקים יש בסך הכול. המונה: כמה מהם צבועים.',
  'r4.pic.hint2': 'בציור יש {d} חלקים, ו־{n} מהם צבועים.',

  // 3. A mixed number drawn.
  'r4.mixed.prompt': 'איזה מספר מעורב מתאים לציור?',
  'r4.mixed.hint1': 'כל פס צבוע עד הסוף הוא שלם אחד. ספרו את השלמים, ואז את החלקים בפס האחרון.',
  'r4.mixed.hint2': 'שלמים: {w}. בפס האחרון צבועים {r} חלקים מתוך {d}.',

  // 4. Less than, equal to or more than one.
  'r4.one.prompt': 'השבר קטן מ־1, שווה ל־1 או גדול מ־1?',
  'r4.one.less': 'קטן מ־1',
  'r4.one.equal': 'שווה ל־1',
  'r4.one.more': 'גדול מ־1',
  'r4.one.hint1': 'השוו את המונה למכנה.',
  'r4.one.hint2':
    'מונה קטן מהמכנה: פחות משלם. מונה שווה למכנה: בדיוק שלם. מונה גדול מהמכנה: יותר משלם.',

  // 5–6. Fractions in words and in digits.
  'r4.toDigits.prompt': 'איך כותבים בספרות: {words}?',
  'r4.toWords.prompt': 'איך קוראים את השבר?',
  'r4.words.hint1': 'המונה (למעלה) אומר כמה חלקים, והמכנה (למטה) אומר את שם החלק.',
  'r4.words.hint2':
    'שמות החלקים: 2 חצי, 3 שליש, 4 רבע, 5 חמישית, 6 שישית, 7 שביעית, 8 שמינית, 9 תשיעית, 10 עשירית.',

  // 7. Numbers in words.
  'r4.name.prompt': 'איך קוראים את המספר?',
  'r4.name.hint1': 'קוראים קודם את האלפים (המספר שלפני הפסיק), אחר כך את מה שאחריו.',
  'r4.name.hint2': 'לפני הפסיק: {thousands}. אחרי הפסיק: {rest}.',
  'r4.name.thousandsWord': 'אלף',

  // 8–9. Sequences.
  'r4.seq.next.prompt': 'מה המספר הבא בסדרה?',
  'r4.seq.gap.prompt': 'איזה מספר חסר בסדרה?',
  'r4.seq.rule.prompt': 'מה החוק של הסדרה?',
  'r4.seq.hint1': 'בדקו בכמה המספר משתנה מאחד לבא אחריו.',
  'r4.seq.hint2Up': 'בכל צעד מוסיפים {step}.',
  'r4.seq.hint2Down': 'בכל צעד מחסירים {step}.',
  'r4.seq.ruleHint2': 'האם המספרים גדלים או קטנים? בכמה בכל צעד?',
  'r4.seq.up': 'מוסיפים {step}',
  'r4.seq.down': 'מחסירים {step}',

  // 10. Word problems.
  'r4.story.hint1': 'כל החלקים באותו גודל, אז מחברים או מחסירים רק את המונים.',
  'r4.story.hint2Add': 'כמה {plural} ועוד כמה {plural}?',
  'r4.story.hint2Sub': 'כמה {plural} פחות כמה {plural}?',
  'r4.story.hint2Whole': 'שלם אחד הוא {whole}.',
  'r4.story.eat': '{a} {va} {x} מהעוגה, ו{b} {vb} {y} ממנה. איזה חלק מהעוגה נאכל?',
  'r4.story.paint': '{a} {v} {x} מהגדר ביום ראשון, ועוד {y} ביום שני. איזה חלק מהגדר נצבע?',
  'r4.story.juice': 'בבקבוק היו {x} ליטר מיץ. שתו ממנו {y} ליטר. כמה מיץ נשאר בבקבוק?',
  'r4.story.road': 'הדרך לבית הספר היא שלם אחד. {a} {v} {x} מהדרך. איזה חלק מהדרך נשאר?',
  'r4.story.pizza': 'מהפיצה נשארו {x}. {a} {v} עוד {y}. כמה נשאר מהפיצה עכשיו?',
} as const;
