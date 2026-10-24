/**
 * Hebrew texts added after the second round of the persona review (merged into `he`):
 * why a station on the map is still closed, the day's goal reached.
 */
export const heRound3 = {
  'journey.note.stationLocked': 'עוד לא הגעת לתחנה {n}. כל תחנה שעוברים פותחת את הבאה.',
  'journey.note.reviewLeft': 'אתגר הסיום ייפתח אחרי עוד {n} תחנות.',
  'journey.note.reviewLeftOne': 'אתגר הסיום ייפתח אחרי עוד תחנה אחת.',
  // Practice: which station this is; after a station, what is left before the challenge.
  'practice.station': 'תחנה {n} · {name}',
  'practice.done.left': 'נשארו עוד {n} תחנות, ואז אתגר הסיום נפתח.',
  'practice.done.leftOne': 'נשארה עוד תחנה אחת, ואז אתגר הסיום נפתח.',
  'practice.done.toStation': 'לתחנה {n}',
  // Album: the stars collected and a medal for every ten (shown, not spoken).
  'medals.title': 'מדליות כוכבים',
  'medals.stars': '{count} כוכבים',
  'medals.starsOne': 'כוכב אחד',
  'medals.label': 'מדליה של {n} כוכבים',
  'medals.next': 'עוד {n} כוכבים למדליה הבאה',
  'medals.nextOne': 'עוד כוכב אחד למדליה הבאה',
  // The end of a round.
  'practice.done.medal': 'מדליית כוכבים חדשה באלבום!',
  'goal.doneAlready': 'סיימת את היעד של היום. אפשר להמשיך בשביל הכיף!',
  'goal.reachedChild': 'סיימת להיום',
  // A code of their own instead of the multiplication question at the parents' gate.
  'pinOffer.body': 'בכניסה לאזור ההורים מופיע תרגיל כפל. רוצים במקומו קוד אישי?',
  'pinOffer.banner': 'רוצים קוד בן 4 ספרות במקום תרגיל הכפל בכניסה?',
  'pinOffer.choose': 'בחירת קוד',
  'pinOffer.later': 'לא עכשיו',
  // Parents (C): the week at a glance.
  'c.week.title': 'השבוע',
  'c.week.days': 'ימי תרגול',
  'c.week.goal': 'יעד: {goal} סבבים ביום · הושג ב-{days} מתוך 7 ימים',
  'c.week.goalOne': 'יעד: סבב אחד ביום · הושג ב-{days} מתוך 7 ימים',
  // "הפלוסי שלי": the colour of the child's Plusi (shown, not spoken).
  'plusiColor.title': 'הפלוסי שלי',
  'plusiColor.intro': 'באיזה צבע פלוסי ילווה אותך?',
  'plusiColor.note': 'עוד צבעים נפתחים עם מדליות הכוכבים באלבום.',
  'plusiColor.paint': 'רוצה לצבוע אותי?',
  'plusiColor.open': 'הפלוסי שלי',
  'plusiColor.locked': 'נפתח במדליה {n}',
  'plusiColor.lockedOne': 'נפתח במדליה הראשונה',
  'plusiColor.usual': 'הצבע הרגיל',
  'plusiColor.pink': 'ורוד',
  'plusiColor.blue': 'כחול',
  'plusiColor.green': 'ירוק',
  'plusiColor.purple': 'סגול',
  'plusiColor.red': 'אדום',
  'plusiColor.gold': 'זהב',
  'plusiColor.navy': 'כחול לילה',
  // Parents (C), progress: the family at a glance and one step to take.
  'c.family.title': 'מי איך',
  'c.family.today': { f: 'תרגלה היום ✓', m: 'תרגל היום ✓' },
  'c.family.yesterday': { f: 'תרגלה אתמול', m: 'תרגל אתמול' },
  'c.family.days': { f: 'לא תרגלה {n} ימים', m: 'לא תרגל {n} ימים' },
  'c.family.new': { f: 'עוד לא התחילה', m: 'עוד לא התחיל' },
  'c.progress.comeBack': {
    f: 'כמה ימים בלי תרגול. כדאי להציע לה היום סבב קצר אחד, כדי לחזור לשגרה.',
    m: 'כמה ימים בלי תרגול. כדאי להציע לו היום סבב קצר אחד, כדי לחזור לשגרה.',
  },
  'c.progress.firstStep': {
    f: 'כדאי לשבת איתה לסבב הראשון. זה לוקח כחמש דקות.',
    m: 'כדאי לשבת איתו לסבב הראשון. זה לוקח כחמש דקות.',
  },
  'parent.journey.later': 'ועוד {n} עולמות שעוד לא התחילו, לפי הסדר.',
  'parent.journey.laterOne': 'ועוד עולם אחד שעוד לא התחיל.',
  'parent.security.savedHint':
    'הקוד נשמר. שימו אותו במקום בטוח: בלעדיו אי אפשר להיכנס לאזור ההורים. אפשר לשנות אותו בהגדרות ← קוד הורים.',
  // The new-child form: the extra settings folded.
  'profile.more': 'הגדרות נוספות',
  'profile.moreHint': 'אורך הסבב, יעד יומי ועוד. אפשר להשאיר כמו שזה ולשנות בכל זמן.',
  // The journey's way out: back to the entry screen.
  'journeyBar.exit': 'יציאה',
  'journey.exitLabel': 'יציאה למסך הכניסה',
  // Entry screen C.
  'c.home.start': 'מתחילים',
  // Back after two days or more without playing: Plusi says he missed her (once that day).
  'c.welcomeBack.title': { f: 'ברוכה השבה, {name}!', m: 'ברוך שובך, {name}!' },
  'journey.welcomeBack.spoken': { f: 'התגעגעתי! ברוכה השבה!', m: 'התגעגעתי! ברוך שובך!' },
  'journey.welcomeBack.many': 'התגעגעתי! ברוכים השבים!',
  'c.welcomeBack.missed': 'התגעגעתי!',
  'c.welcomeBack.titleMany': 'ברוכים השבים!',
  // Parents: once, not "1 פעמים".
  'parent.week.dailyOne': 'תרגילי חזרה מכל העולמות: פעם אחת',
  // The map of all worlds: the review from every world lives here.
  'worlds.review.sub': 'תרגילים מכל התחנות שעברת, מעורבבים',
  'worlds.review.done': 'עשית היום',
  // Signing in with an email and a password (no mail is ever sent).
  'account.start': 'התחברות עם מייל וסיסמה',
  'account.kind.signup': 'פעם ראשונה',
  'account.kind.login': 'כבר נרשמתי',
  'account.orCode': 'בלי מייל? חיבור עם קוד',
  'account.title': 'כניסה עם מייל וסיסמה',
  'account.set.title': 'מייל וסיסמה למשפחה',
  'account.email': 'מייל',
  'account.password': 'סיסמה',
  'account.password2': 'הסיסמה שוב',
  'account.passwordHint': 'לפחות 6 תווים',
  'account.noMail':
    'אנחנו לא שולחים מיילים: המייל משמש רק כשם משתמש. אם תשכחו את הסיסמה לא נוכל לשחזר אותה, אז כדאי לשמור אותה במקום בטוח.',
  'account.loginHow': 'המייל והסיסמה שבחרתם בהרשמה. הילדים וההתקדמות יופיעו כאן.',
  'account.submit.signup': 'הרשמה',
  'account.submit.login': 'כניסה',
  'account.submit.set': 'שמירה',
  'account.busy': 'רגע…',
  'account.on': 'נכנסים עם {email}',
  'account.onOther': 'למשפחה מוגדרים מייל וסיסמה (במכשיר אחר).',
  'account.off': 'עם מייל וסיסמה אפשר להיכנס מכל מכשיר חדש, גם בלי קוד וגם אם הטלפון אבד.',
  'account.set': 'הגדרת מייל וסיסמה',
  'account.change': 'שינוי מייל או סיסמה',
  'account.remove': 'הסרת הכניסה במייל',
  'account.remove.title': 'להסיר את הכניסה במייל?',
  'account.remove.body':
    'המכשירים המחוברים ימשיכו להסתנכרן כרגיל. מכשיר חדש יוכל להתחבר רק עם קוד חיבור.',
  'account.mismatch': 'הסיסמאות לא זהות.',
  'sync.problem.emailTaken': 'המייל הזה כבר רשום. אם זו המשפחה שלכם, בחרו למעלה "כבר נרשמתי".',
  'sync.problem.badLogin': 'המייל או הסיסמה לא נכונים.',
  'sync.problem.badEmail': 'זו לא כתובת מייל תקינה.',
  'sync.problem.shortPassword': 'הסיסמה צריכה להיות לפחות 6 תווים.',
  // "Would you want an extended version?" (only counted, nothing is sold).
  'more.title': 'גרסה מורחבת?',
  'more.body':
    'אנחנו שוקלים גרסה מורחבת של פלוסי, למשל דוחות מפורטים יותר להורים ועוד עולמות. אם זה מעניין אתכם, לחצו, וכך נדע אם לבנות אותה.',
  'more.want': 'כן, זה מעניין אותי',
  'more.thanks': 'תודה! נספר אתכם.',
  'more.failed': 'לא הצלחנו לשלוח. נסו שוב כשיש אינטרנט.',
} as const;
