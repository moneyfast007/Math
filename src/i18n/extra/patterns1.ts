/**
 * Hebrew texts of the grade 1 world "דפוסים וסדרות" (merged into `he`). Everything
 * here is also spoken, so nothing holds digits; numbers come through `{slots}`.
 */
export const hePatterns1 = {
  'topic.patterns1': 'דפוסים וסדרות',
  'level.patterns1.1': 'דגם של צורה וצבע',
  'level.patterns1.2': 'דגם שגדל',
  'level.patterns1.3': 'סופרים קדימה',
  'level.patterns1.4': 'סופרים אחורה',
  'level.patterns1.5': 'קפיצות של 2',
  'level.patterns1.6': 'קפיצות של 5',
  'level.patterns1.7': 'קפיצות של 10',
  'level.patterns1.8': 'זוגי ואי-זוגי',
  'level.patterns1.9': 'מה הכלל?',
  'level.patterns1.10': 'מספר חסר בסדרה',

  // Level 1: a pattern of shape and colour together
  'ex.p1.two.prompt': 'מה בא אחר כך בדגם?',
  'ex.p1.two.sayIt': {
    f: 'אמרי את הדגם בקול: {seq}, ומה עכשיו?',
    m: 'אמור את הדגם בקול: {seq}, ומה עכשיו?',
  },
  'ex.p1.two.hint2': 'גם הצורה וגם הצבע חוזרים. זה החלק שחוזר שוב ושוב:',
  'ex.p1.two.example': '{seq}, ומה עכשיו? {unit} חוזרים, ולכן עכשיו בא {next}.',
  'ex.p1.two.solution': 'עכשיו בא {thing}.',
  'ex.p1.two.adv.color': 'הצורה נכונה, אבל איזה צבע בא עכשיו?',
  'ex.p1.two.adv.shape': 'הצבע נכון, אבל איזו צורה באה עכשיו?',

  // Level 2: a growing pattern
  'ex.p1.grow.spoken': 'כל קבוצה גדלה. כמה {plural} יהיו בקבוצה הבאה?',
  'ex.p1.grow.hint1': {
    f: 'ספרי כמה {plural} יש בכל קבוצה. בכמה היא גדלה כל פעם?',
    m: 'ספור כמה {plural} יש בכל קבוצה. בכמה היא גדלה כל פעם?',
  },
  'ex.p1.grow.hint2': 'על ישר המספרים: כל קבוצה היא קפיצה. לאן מגיעה הקפיצה הבאה?',
  'ex.p1.grow.solution': 'בכל פעם עוד {step}, ולכן בקבוצה הבאה יש {ans}.',
  'ex.p1.grow.adv.byOne': 'כאן כל קבוצה גדלה ביותר מאחת. כמה נוספים בכל פעם?',

  // Number sequences (levels 3–7 and 10)
  'ex.p1.seq.missing.prompt': 'איזה מספר חסר בסדרה?',
  'ex.p1.seq.next.prompt': 'מה המספר הבא בסדרה?',
  'ex.p1.seq.missing.spoken': '{seq}. איזה מספר חסר?',
  'ex.p1.seq.next.spoken': '{seq}. מה המספר הבא?',
  'ex.p1.seq.gap': 'מה',
  'ex.p1.fwd.hint1': {
    f: 'סופרים קדימה, כל פעם עוד אחת. קראי את המספרים בקול.',
    m: 'סופרים קדימה, כל פעם עוד אחת. קרא את המספרים בקול.',
  },
  'ex.p1.back.hint1': {
    f: 'סופרים אחורה, כל פעם אחת פחות. קראי את המספרים בקול.',
    m: 'סופרים אחורה, כל פעם אחת פחות. קרא את המספרים בקול.',
  },
  'ex.p1.jump.hint1': 'בסדרה הזאת קופצים בכל פעם {step} קדימה.',
  'ex.p1.jump.hint1back': 'בסדרה הזאת קופצים בכל פעם {step} אחורה.',
  'ex.p1.mixed.hint1': {
    f: 'בדקי קודם: בכמה המספרים גדלים או קטנים בכל פעם?',
    m: 'בדוק קודם: בכמה המספרים גדלים או קטנים בכל פעם?',
  },
  'ex.p1.line.fwd': 'על ישר המספרים, קדימה: כל קפיצה היא {step}.',
  'ex.p1.line.back': 'על ישר המספרים, אחורה: כל קפיצה היא {step}.',
  'ex.p1.seq.example.fwd': '{a}, {b}, {c}: בכל פעם עוד {step}, ולכן אחר כך בא {d}.',
  'ex.p1.seq.example.back': '{a}, {b}, {c}: בכל פעם {step} פחות, ולכן אחר כך בא {d}.',
  'ex.p1.seq.solution.fwd': '{prev} ועוד {step} זה {ans}.',
  'ex.p1.seq.solution.back': '{prev} פחות {step} זה {ans}.',
  'ex.p1.adv.wrongWay.fwd': 'המספרים בסדרה הזאת הולכים וגדלים: קופצים קדימה.',
  'ex.p1.adv.wrongWay.back': 'המספרים בסדרה הזאת הולכים וקטנים: קופצים אחורה.',
  'ex.p1.adv.byOne': 'כאן לא קופצים באחת. בכמה קופצים בכל פעם?',

  // Level 8: even and odd
  'ex.p1.yes': 'כן',
  'ex.p1.no': 'לא',
  'ex.p1.even.is': 'האם המספר {n} זוגי?',
  'ex.p1.even.is.hint1': 'מספר זוגי אפשר לסדר בזוגות, בלי שאף אחד נשאר לבד.',
  'ex.p1.even.is.hint2': 'נסדר אותם בזוגות. האם מישהו נשאר בלי זוג?',
  'ex.p1.even.is.example': '{e} זוגי: כולם בזוגות. {o} אי-זוגי: אחד נשאר בלי זוג.',
  'ex.p1.even.is.solutionYes': 'המספר {n} זוגי: כולם בזוגות.',
  'ex.p1.even.is.solutionNo': 'המספר {n} אי-זוגי: אחד נשאר בלי זוג.',
  'ex.p1.even.which': 'איזה מספר זוגי?',
  'ex.p1.odd.which': 'איזה מספר אי-זוגי?',
  'ex.p1.even.which.spoken': '{a}, {b} או {c}. איזה מספר זוגי?',
  'ex.p1.odd.which.spoken': '{a}, {b} או {c}. איזה מספר אי-זוגי?',
  'ex.p1.even.which.hint1': {
    f: 'הסתכלי רק על ספרת האחדות: הספרה הימנית.',
    m: 'הסתכל רק על ספרת האחדות: הספרה הימנית.',
  },
  'ex.p1.even.which.hint2': 'מספר זוגי נגמר באפס, שתיים, ארבע, שש או שמונה.',
  'ex.p1.odd.which.hint2': 'מספר אי-זוגי נגמר באחת, שלוש, חמש, שבע או תשע.',
  'ex.p1.even.which.solution': 'המספר {n} זוגי, כי הוא נגמר ב{u}.',
  'ex.p1.odd.which.solution': 'המספר {n} אי-זוגי, כי הוא נגמר ב{u}.',

  // Level 9: what is the rule?
  'ex.p1.rule.prompt': 'בכמה קופצים בסדרה?',
  'ex.p1.rule.spoken': '{seq}. בכמה קופצים בכל פעם?',
  'ex.p1.rule.hint1': {
    f: 'בדקי: בכמה גדל כל מספר מהמספר שלפניו?',
    m: 'בדוק: בכמה גדל כל מספר מהמספר שלפניו?',
  },
  'ex.p1.rule.hint2': 'נספור את הקפיצות הקטנות מ{a} עד {b}.',
  'ex.p1.rule.example': 'שלוש, שש, תשע, שתים עשרה: בכל פעם עוד שלוש. אלה קפיצות של שלוש.',
  'ex.p1.rule.solution': 'בכל פעם עוד {step}: אלה קפיצות של {step}.',
} as const;
