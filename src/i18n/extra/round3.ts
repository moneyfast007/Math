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
} as const;
