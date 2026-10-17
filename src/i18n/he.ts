/**
 * Hebrew UI strings.
 *
 * Rules for this file:
 * - Every string the user can see lives here, never inline in a component.
 * - Phrases that address the child come as { f, m } pairs.
 * - No math symbols: arithmetic is rendered by the <MathExpr> component, never by text.
 * - Keep the vocabulary at the level of the youngest reader that will see it.
 *
 * Adding a language later means adding `en.ts` with the same keys; the type
 * system will point out anything missing.
 */
export const he = {
  // App
  'app.name': 'פלוסי',
  'app.tagline': 'תרגול מתמטיקה, מגן חובה ועד כיתה ו׳',

  // Home
  // Gendered by the profiles on the device: feminine only if every profile is feminine.
  'home.whoIsPlaying': { f: 'מי משחקת היום?', m: 'מי משחק היום?' },
  'home.parents': 'הורים',
  'home.parentsHoldHint': 'לחיצה ארוכה',
  'home.firstRun.title': 'ברוכים הבאים!',
  'home.firstRun.body': 'כדי להתחיל, הורה יוצר פרופיל לכל ילד או ילדה. זה לוקח דקה.',
  'home.firstRun.cta': 'יצירת פרופיל ראשון',

  // Child home (the exercise engine replaces the placeholder in phase 3)
  'child.hello': 'שלום {name}!',
  'child.ready': { f: 'מוכנה לשחק?', m: 'מוכן לשחק?' },
  'child.comingSoon': 'המשחקים יגיעו ממש בקרוב.',
  'child.switch': 'מי משחק?',

  // Generic actions
  'action.back': 'חזרה',
  'action.continue': 'ממשיכים',
  'action.tryAgain': { f: 'נסי שוב', m: 'נסה שוב' },
  'action.check': 'בדיקה',
  'action.hint': 'רמז',
  'action.listen': 'הקראה',
  'action.listenSlow': 'הקראה איטית',
  'action.stop': 'עצירה',
  'action.close': 'סגירה',
  'action.confirm': 'אישור',
  'action.cancel': 'ביטול',
  'action.backspace': 'מחיקת ספרה',

  // Parent gate
  'gate.title': 'כניסת הורים',
  'gate.explain': 'האזור הזה מיועד להורים.',
  'gate.question': 'כמה זה?',
  'gate.pinPrompt': 'הקלידו את קוד ההורים',
  'gate.wrong': 'לא נכון. נסו שוב.',

  // Parent area
  'parent.title': 'אזור הורים',
  'parent.exit': 'יציאה',
  'parent.children': 'הילדים',
  'parent.addChild': 'הוספת ילד או ילדה',
  'parent.edit': 'עריכה',
  'parent.limitReached': 'אפשר עד {max} פרופילים.',
  'parent.noPracticeYet': { f: 'עדיין לא תרגלה.', m: 'עדיין לא תרגל.' },
  'parent.topicsPracticedOne': { f: 'תרגלה נושא אחד', m: 'תרגל נושא אחד' },
  'parent.topicsPracticed': { f: 'תרגלה {count} נושאים', m: 'תרגל {count} נושאים' },
  'parent.attempts': '{count} תרגילים',
  'parent.successRate': 'הצלחה: {percent}',
  'parent.lastPracticed': 'תרגול אחרון: {date}',
  'parent.struggling': 'נושאים לחיזוק:',
  'parent.strong': 'נושאים חזקים:',
  'parent.commonMistakes': 'טעויות נפוצות:',

  'parent.backup.title': 'גיבוי',
  'parent.backup.body':
    'ההתקדמות נשמרת רק במכשיר הזה. כדאי לשמור גיבוי מדי פעם, ובוודאי לפני החלפת מכשיר.',
  'parent.backup.export': 'שמירת גיבוי',
  'parent.backup.import': 'שחזור מגיבוי',
  'parent.backup.last': 'גיבוי אחרון: {date}',
  'parent.backup.never': 'עדיין לא נשמר גיבוי.',
  'parent.backup.stale': 'עברו יותר משבועיים מהגיבוי האחרון.',
  'parent.backup.exported': 'הגיבוי נשמר.',
  'parent.backup.confirmTitle': 'לשחזר מהגיבוי?',
  'parent.backup.confirmBody':
    'הנתונים שבמכשיר יוחלפו בנתונים מהקובץ ({count} פרופילים). אי אפשר לבטל את הפעולה.',
  'parent.backup.confirm': 'שחזור',
  'parent.backup.imported': 'השחזור הושלם.',
  'parent.backup.importError': 'לא הצלחנו לקרוא את הקובץ: {reason}',

  'parent.security.title': 'נעילת אזור ההורים',
  'parent.security.noPin':
    'כרגע הכניסה היא לחיצה ארוכה ותרגיל כפל. ילדה בכיתה ד׳ יכולה לפתור אותו, ולכן קוד בן 4 ספרות בטוח יותר.',
  'parent.security.hasPin': 'מוגדר קוד הורים.',
  'parent.security.setPin': 'הגדרת קוד',
  'parent.security.changePin': 'שינוי קוד',
  'parent.security.removePin': 'ביטול הקוד',
  'parent.security.newPin': 'בחרו קוד בן 4 ספרות',
  'parent.security.repeatPin': 'הקלידו את הקוד שוב',
  'parent.security.mismatch': 'הקודים לא תואמים. נתחיל מחדש.',
  'parent.security.saved': 'הקוד נשמר.',

  'parent.device.title': 'המכשיר',
  'parent.device.installed': 'האתר מותקן על מסך הבית.',
  'parent.device.notInstalled': 'האתר לא מותקן על מסך הבית.',
  'parent.device.persisted': 'הדפדפן התחייב לשמור את הנתונים.',
  'parent.device.notPersisted': 'הדפדפן עלול למחוק את הנתונים אם האתר לא ייפתח זמן רב.',
  'parent.device.unavailable':
    'אין גישה לאחסון במכשיר (אולי גלישה פרטית). הנתונים יימחקו כשהדפדפן ייסגר.',
  'parent.device.writeFailed': 'שמירת הנתונים נכשלה. מומלץ לשמור גיבוי עכשיו.',
  'parent.device.recovered':
    'הנתונים שבמכשיר היו פגומים, ולכן התחלנו מחדש. עותק שלהם נשמר בצד. אם יש לכם גיבוי, שחזרו ממנו.',
  'parent.device.installGuide': 'איך מוסיפים למסך הבית',
  'parent.device.playground': 'בדיקת תצוגה',

  // Profile form
  'profile.newTitle': 'פרופיל חדש',
  'profile.editTitle': 'עריכת פרופיל',
  'profile.name': 'שם',
  'profile.namePlaceholder': 'למשל: נועה',
  'profile.nameRequired': 'צריך לכתוב שם.',
  'profile.avatar': 'דמות',
  'profile.grade': 'כיתה',
  'profile.gender': 'פנייה',
  'profile.gender.f': 'בלשון נקבה',
  'profile.gender.m': 'בלשון זכר',
  'profile.allowLevelChange': 'מותר לשנות רמת קושי לבד',
  'profile.save': 'שמירה',
  'profile.delete': 'מחיקת הפרופיל',
  'profile.deleteTitle': 'למחוק את הפרופיל של {name}?',
  'profile.deleteBody': 'כל ההתקדמות של {name} תימחק. אי אפשר לבטל, אלא אם יש גיבוי.',
  'profile.deleteConfirm': 'מחיקה',

  // Grades
  'grade.0': 'גן חובה',
  'grade.1': 'כיתה א׳',
  'grade.2': 'כיתה ב׳',
  'grade.3': 'כיתה ג׳',
  'grade.4': 'כיתה ד׳',
  'grade.5': 'כיתה ה׳',
  'grade.6': 'כיתה ו׳',

  // Avatars (screen-reader names)
  'avatar.fox': 'שועל',
  'avatar.panda': 'פנדה',
  'avatar.koala': 'קואלה',
  'avatar.lion': 'אריה',
  'avatar.tiger': 'נמר',
  'avatar.frog': 'צפרדע',
  'avatar.monkey': 'קוף',
  'avatar.unicorn': 'חד קרן',
  'avatar.octopus': 'תמנון',
  'avatar.turtle': 'צב',
  'avatar.rabbit': 'ארנב',
  'avatar.cat': 'חתול',

  // Mistake kinds, as parents read them
  'mistake.wrongOperation': 'פעולה לא נכונה (למשל חיבור במקום חיסור)',
  'mistake.offByOne': 'טעות של אחד',
  'mistake.digitReversal': 'החלפת סדר הספרות',
  'mistake.placeValue': 'ערך המקום (אחדות ועשרות)',
  'mistake.remainder': 'שארית בחילוק',
  'mistake.other': 'אחר',

  // Topics
  'topic.addSub20': 'חיבור וחיסור עד 20',

  // Levels of "add-sub-20"
  'level.addSub20.1': 'סופרים עד 5',
  'level.addSub20.2': 'סופרים עד 10',
  'level.addSub20.3': 'חיבור עד 5 עם ציורים',
  'level.addSub20.4': 'חיבור עד 10 עם ציורים',
  'level.addSub20.5': 'חיסור עד 10 עם ציורים',
  'level.addSub20.6': 'חיבור עד 10',
  'level.addSub20.7': 'חיסור עד 10',
  'level.addSub20.8': 'חיבור וחיסור עד 20',
  'level.addSub20.9': 'מעבר עשרת',
  'level.addSub20.10': 'מספר חסר',

  // Exercise prompts (shown) and spoken templates. {a}, {b}: number-and-noun phrases.
  'ex.count.prompt': 'כמה {plural} יש?',
  'ex.objAdd.prompt': 'כמה {plural} יש ביחד?',
  'ex.objSub.prompt': 'כמה {plural} נשארו?',
  'ex.arith.prompt': 'כמה זה?',
  'ex.missing.prompt': 'איזה מספר חסר?',
  'spoken.objAdd': '{a} ועוד {b}. כמה {plural} יש ביחד?',
  'spoken.objSub': 'היו {a}. לקחו {b}. כמה {plural} נשארו?',
  'spoken.missAdd': '{a} ועוד כמה זה {c}?',
  'spoken.missSub': '{c} פחות כמה זה {b}?',
  'spoken.example': 'למשל, {sentence}',

  // Hints. Written in the first person plural ("נספור"), so they need no gender.
  'hint.count.1': 'נספור לאט, ונגע בכל אחד פעם אחת.',
  'hint.count.2': 'סידרנו אותם בשורות של חמש. ככה קל יותר לספור.',
  'hint.count.3': 'למשל, כאן יש {phrase}: {sequence}.',
  'hint.objAdd.1': 'נספור את כל ה{plural} ביחד, מהראשון ועד האחרון.',
  'hint.objSub.1': 'נספור רק את ה{plural} שנשארו, בלי אלה שלקחו.',
  'hint.objects.2': 'סידרנו את הציורים בשורות של חמש. ככה קל יותר לספור.',
  'hint.add.1': 'נתחיל מהמספר הגדול, ונספור קדימה.',
  'hint.sub.1': 'נתחיל מהמספר הגדול, ונספור אחורה.',
  'hint.addCross.1': 'נשלים קודם לעשר, ואחר כך נוסיף את מה שנשאר.',
  'hint.subCross.1': 'נרד קודם לעשר, ואחר כך נוריד את מה שנשאר.',
  'hint.missAdd.1': 'כמה צריך להוסיף ל-{a} כדי להגיע ל-{c}?',
  'hint.missAdd.1.spoken': 'כמה צריך להוסיף ל{a} כדי להגיע ל{c}?',
  'hint.missSub.1': 'כמה צריך להוריד מ-{c} כדי להגיע ל-{b}?',
  'hint.missSub.1.spoken': 'כמה צריך להוריד מ{c} כדי להגיע ל{b}?',
  'hint.numberLine': 'נקפוץ על ישר המספרים. כל קפיצה היא אחד.',
  'hint.numberLineGap': 'על ישר המספרים: כמה קפיצות יש מהנקודה הראשונה עד השנייה?',
  'hint.example': 'הנה תרגיל דומה, פתור:',

  // Explanations after a wrong answer (gendered: they address the child)
  'explain.wrongOperation.add': { f: 'שימי לב לסימן: כאן מחברים.', m: 'שים לב לסימן: כאן מחברים.' },
  'explain.wrongOperation.sub': { f: 'שימי לב לסימן: כאן מחסרים.', m: 'שים לב לסימן: כאן מחסרים.' },
  'explain.offByOne': { f: 'ממש קרוב! נסי לספור שוב לאט.', m: 'ממש קרוב! נסה לספור שוב לאט.' },
  'explain.digitReversal': {
    f: 'הספרות נכונות, אבל בדקי את הסדר שלהן.',
    m: 'הספרות נכונות, אבל בדוק את הסדר שלהן.',
  },
  'explain.reveal': 'התשובה היא {answer}.',

  // Child home: the next station
  'child.nextStation': 'התחנה הבאה',
  'child.start': 'יאללה, מתחילים!',
  'child.levelLabel': 'שלב {level}: {name}',
  'child.otherLevel': 'שלב אחר',
  'child.pickLevel': 'באיזה שלב לתרגל?',

  // Practice round
  'practice.exit': 'סיום',
  'practice.progress': 'תרגיל {n} מתוך {total}',
  'practice.answerLabel': 'התשובה',
  'practice.choicesLabel': 'בחירת תשובה',
  'practice.hintTitle': 'רמז {n}',
  'practice.next': 'הבא',
  'practice.levelUp.title': { f: 'מוכנה לאתגר?', m: 'מוכן לאתגר?' },
  'practice.levelUp.body': 'הצלחת ארבעה תרגילים ברצף! רוצה לנסות שלב קשה יותר?',
  'practice.levelUp.yes': 'כן, לשלב הבא',
  'practice.levelUp.no': 'עוד קצת כאן',
  'practice.levelDown.title': 'ננסה משהו קצת אחר?',
  'practice.levelDown.body': 'נתרגל רגע שלב קל יותר, ואחר כך נחזור.',
  'practice.levelDown.yes': 'כן, ננסה',
  'practice.levelDown.no': 'נשארים כאן',
  'practice.levelChanged.up': 'עברנו לשלב הבא!',
  'practice.levelChanged.down': 'נתרגל רגע שלב קל יותר.',
  'practice.done.title': 'כל הכבוד, {name}!',
  'practice.done.body': 'פתרת {count} תרגילים.',
  'practice.done.again': 'עוד סבב',
  'practice.done.home': 'חזרה',

  // Feedback (never a red X, never a failure sound)
  'feedback.correct': { f: 'נכון! כל הכבוד', m: 'נכון! כל הכבוד' },
  'feedback.almost': { f: 'כמעט. בואי ננסה ביחד', m: 'כמעט. בוא ננסה ביחד' },
  'feedback.keepGoing': { f: 'את בדרך הנכונה', m: 'אתה בדרך הנכונה' },

  // Audio
  'audio.unavailableOffline': 'ההקראה לא זמינה עכשיו. נסו שוב כשיש אינטרנט.',
  'audio.unavailable': 'אין הקראה לשאלה הזו.',

  // Install guide (parents)
  'install.title': 'הוספה למסך הבית',
  'install.why':
    'כשהאתר מותקן על מסך הבית הוא נפתח כמו אפליקציה, עובד גם בלי אינטרנט, וההתקדמות של הילדות נשמרת לאורך זמן.',
  'install.ios.title': 'באייפד או באייפון (Safari)',
  'install.ios.step1': 'פותחים את האתר ב-Safari (לא בדפדפן אחר).',
  'install.ios.step2': 'לוחצים על כפתור השיתוף: הריבוע עם החץ למעלה.',
  'install.ios.step3': 'גוללים ברשימה ובוחרים "הוספה למסך הבית".',
  'install.ios.step4': 'לוחצים "הוספה". האייקון יופיע על מסך הבית.',
  'install.android.title': 'באנדרואיד (Chrome)',
  'install.android.step1': 'פותחים את התפריט (שלוש נקודות) ובוחרים "הוספה למסך הבית" או "התקנה".',
  'install.desktop.title': 'במחשב',
  'install.desktop.step1': 'ב-Chrome או ב-Edge לוחצים על אייקון ההתקנה בשורת הכתובת.',
  'install.alreadyInstalled': 'האתר כבר מותקן על המכשיר הזה.',
  'install.safariNote':
    'חשוב: ב-Safari נתוני אתר שלא נפתח שבעה ימים עלולים להימחק. באפליקציה המותקנת על מסך הבית זה לא קורה. בכל מקרה, במסך ההורים יש כפתור גיבוי.',

  // Playground (temporary screen used to verify RTL and math rendering)
  'playground.title': 'בדיקת תצוגה',
  'playground.expressionLabel': 'ביטוי חשבוני בתוך טקסט בעברית:',
  'playground.spokenLabel': 'איך זה מוקרא:',
  'playground.ageBand': 'קבוצת גיל',
  'playground.band.young': 'גן',
  'playground.band.middle': 'כיתות א׳–ג׳',
  'playground.band.older': 'כיתות ד׳–ו׳',
} as const;

export type HebrewKey = keyof typeof he;
