/**
 * Hebrew texts of the world "מדידה ראשונה" (grade 1), merged into `he`.
 * Plain strings, or { f, m } when the sentence addresses the child; in a few
 * sentences { f, m } agrees with a thing or a day instead ("הבננה שוקלת",
 * "אתמול הייתה שבת"), as the code says where it uses them. Numbers come
 * through `{slots}`, so nothing spoken holds a digit.
 */
export const heMeasure1 = {
  'topic.measure1': 'מדידה ראשונה',
  'level.measure1.1': 'מה ארוך יותר?',
  'level.measure1.2': 'מה גבוה יותר?',
  'level.measure1.3': 'מודדים באטבים',
  'level.measure1.4': 'בכמה אטבים יותר?',
  'level.measure1.5': 'מה באמצע?',
  'level.measure1.6': 'כבד וקל',
  'level.measure1.7': 'כמה קוביות הוא שוקל?',
  'level.measure1.8': 'ימי השבוע',
  'level.measure1.9': 'אתמול, היום, מחר',
  'level.measure1.10': 'בעיות מדידה',

  // Levels 1–2: longer, shorter; taller, lower.
  'ex.m1.cmp.long.prompt': 'מה ארוך יותר: ה{a} או ה{b}?',
  'ex.m1.cmp.short.prompt': 'מה קצר יותר: ה{a} או ה{b}?',
  'ex.m1.cmp.tall.prompt': 'מה גבוה יותר: ה{a} או ה{b}?',
  'ex.m1.cmp.low.prompt': 'מה נמוך יותר: ה{a} או ה{b}?',
  'ex.m1.cmp.lie.hint1': {
    f: 'שניהם מתחילים באותו קו. הסתכלי עד איפה כל אחד מגיע.',
    m: 'שניהם מתחילים באותו קו. הסתכל עד איפה כל אחד מגיע.',
  },
  'ex.m1.cmp.stand.hint1': {
    f: 'שניהם עומדים על אותה רצפה. הסתכלי עד כמה גבוה כל אחד מגיע.',
    m: 'שניהם עומדים על אותה רצפה. הסתכל עד כמה גבוה כל אחד מגיע.',
  },
  'ex.m1.cmp.long.hint2': 'הקו המקווקו מראה איפה נגמר הקצר. הארוך ממשיך אחרי הקו.',
  'ex.m1.cmp.short.hint2': 'הקצר נגמר ראשון, בקו המקווקו. הארוך ממשיך אחרי הקו.',
  'ex.m1.cmp.tall.hint2': 'הקו המקווקו מראה עד איפה מגיע הנמוך. הגבוה עובר את הקו.',
  'ex.m1.cmp.low.hint2': 'הנמוך מגיע רק עד הקו המקווקו. הגבוה עובר את הקו.',
  'ex.m1.cmp.long.solution': 'ה{a} ארוך יותר מה{b}.',
  'ex.m1.cmp.short.solution': 'ה{a} קצר יותר מה{b}.',
  'ex.m1.cmp.tall.solution': 'ה{a} גבוה יותר מה{b}.',
  'ex.m1.cmp.low.solution': 'ה{a} נמוך יותר מה{b}.',

  // Level 3: measuring with paper clips.
  'ex.m1.clips.prompt': 'כמה אטבים אורך ה{a}?',
  'ex.m1.clips.hint1': {
    f: 'ספרי את האטבים שמתחת ל{a}, מההתחלה ועד הסוף.',
    m: 'ספור את האטבים שמתחת ל{a}, מההתחלה ועד הסוף.',
  },
  'ex.m1.clips.hint2': {
    f: 'געי בכל אטב וספרי: אחד, שניים, שלושה... כל אטב פעם אחת.',
    m: 'גע בכל אטב וספור: אחד, שניים, שלושה... כל אטב פעם אחת.',
  },
  'ex.m1.clips.solution': 'ה{a} באורך {n}.',

  // Level 4: by how many clips longer.
  'ex.m1.diff.prompt': 'בכמה אטבים ה{a} ארוך מה{b}?',
  'ex.m1.diff.hint1': {
    f: 'ספרי כמה אטבים יש מתחת לכל אחד. כמה אטבים יש ל{a} יותר?',
    m: 'ספור כמה אטבים יש מתחת לכל אחד. כמה אטבים יש ל{a} יותר?',
  },
  'ex.m1.diff.hint2': 'ל{a} יש {x}, ול{b} יש {y}. האטבים הצבועים הם מה שיש ל{a} יותר.',
  'ex.m1.diff.example': 'ה{a} באורך {x}, וה{b} באורך {y}. ה{a} ארוך יותר ב{d}.',
  'ex.m1.diff.solution': 'ה{a} ארוך מה{b} ב{d}.',
  'ex.m1.diff.adv.long': 'זה כל האורך של ה{a}. אנחנו מחפשים רק כמה אטבים יש לו יותר מה{b}.',
  'ex.m1.diff.adv.short': 'זה האורך של ה{b}. אנחנו מחפשים כמה אטבים יש ל{a} יותר ממנו.',

  // Level 5: the middle one.
  'ex.m1.mid.long.prompt': 'מה באמצע: לא הכי ארוך ולא הכי קצר?',
  'ex.m1.mid.tall.prompt': 'מה באמצע: לא הכי גבוה ולא הכי נמוך?',
  'ex.m1.mid.long.hint1': {
    f: 'מצאי קודם את הכי ארוך ואת הכי קצר. מה שנשאר הוא באמצע.',
    m: 'מצא קודם את הכי ארוך ואת הכי קצר. מה שנשאר הוא באמצע.',
  },
  'ex.m1.mid.tall.hint1': {
    f: 'מצאי קודם את הכי גבוה ואת הכי נמוך. מה שנשאר הוא באמצע.',
    m: 'מצא קודם את הכי גבוה ואת הכי נמוך. מה שנשאר הוא באמצע.',
  },
  'ex.m1.mid.long.hint2': 'כאן הם מסודרים מהקצר אל הארוך. מי נמצא באמצע?',
  'ex.m1.mid.tall.hint2': 'כאן הם מסודרים מהנמוך אל הגבוה. מי נמצא באמצע?',
  'ex.m1.mid.long.solution': 'ה{m} באמצע: ארוך מה{s} וקצר מה{l}.',
  'ex.m1.mid.tall.solution': 'ה{m} באמצע: גבוה מה{s} ונמוך מה{l}.',

  // Levels 6–7: the balance. Solutions agree with the thing ("הבננה כבדה").
  'ex.m1.bal.heavy.prompt': 'מה כבד יותר: ה{a} או ה{b}?',
  'ex.m1.bal.light.prompt': 'מה קל יותר: ה{a} או ה{b}?',
  'ex.m1.bal.hint1': 'במאזניים, הצד הכבד יורד למטה, והצד הקל עולה למעלה.',
  'ex.m1.bal.heavy.hint2': {
    f: 'מצאי את הכף שירדה למטה. מה יש בה?',
    m: 'מצא את הכף שירדה למטה. מה יש בה?',
  },
  'ex.m1.bal.light.hint2': {
    f: 'מצאי את הכף שעלתה למעלה. מה יש בה?',
    m: 'מצא את הכף שעלתה למעלה. מה יש בה?',
  },
  'ex.m1.bal.heavy.solution': {
    f: 'ה{a} כבדה יותר מה{b}: הכף שלה ירדה למטה.',
    m: 'ה{a} כבד יותר מה{b}: הכף שלו ירדה למטה.',
  },
  'ex.m1.bal.light.solution': {
    f: 'ה{a} קלה יותר מה{b}: הכף שלה עלתה למעלה.',
    m: 'ה{a} קל יותר מה{b}: הכף שלו עלתה למעלה.',
  },
  'ex.m1.weigh.prompt': {
    f: 'המאזניים מאוזנים. כמה קוביות שוקלת ה{a}?',
    m: 'המאזניים מאוזנים. כמה קוביות שוקל ה{a}?',
  },
  'ex.m1.weigh.hint1': 'כשהמאזניים מאוזנים, שני הצדדים שוקלים אותו דבר.',
  'ex.m1.weigh.hint2': {
    f: 'ספרי את הקוביות שבכף השנייה.',
    m: 'ספור את הקוביות שבכף השנייה.',
  },
  'ex.m1.weigh.solution': { f: 'ה{a} שוקלת {n}.', m: 'ה{a} שוקל {n}.' },

  // Level 8: the days of the week. Solutions agree with the day ("באה שבת").
  'ex.m1.days.hint1':
    'ימי השבוע באים תמיד באותו סדר: ראשון, שני, שלישי, רביעי, חמישי, שישי, שבת. ואחרי שבת מתחיל שוב יום ראשון.',
  'ex.m1.days.after.prompt': 'איזה יום בא אחרי {day}?',
  'ex.m1.days.before.prompt': 'איזה יום בא לפני {day}?',
  'ex.m1.days.after.hint2': {
    f: 'מצאי את {day} בשבוע, וזוזי יום אחד קדימה.',
    m: 'מצא את {day} בשבוע, וזוז יום אחד קדימה.',
  },
  'ex.m1.days.before.hint2': {
    f: 'מצאי את {day} בשבוע, וזוזי יום אחד אחורה.',
    m: 'מצא את {day} בשבוע, וזוז יום אחד אחורה.',
  },
  'ex.m1.days.after.solution': { f: 'אחרי {day} באה {ans}.', m: 'אחרי {day} בא {ans}.' },
  'ex.m1.days.before.solution': { f: 'לפני {day} באה {ans}.', m: 'לפני {day} בא {ans}.' },
  'ex.m1.days.after.adv': {
    f: '{v} באה לפני {day}. אנחנו מחפשים את היום שבא אחרי {day}.',
    m: '{v} בא לפני {day}. אנחנו מחפשים את היום שבא אחרי {day}.',
  },
  'ex.m1.days.before.adv': {
    f: '{v} באה אחרי {day}. אנחנו מחפשים את היום שבא לפני {day}.',
    m: '{v} בא אחרי {day}. אנחנו מחפשים את היום שבא לפני {day}.',
  },

  // Level 9: yesterday, today, tomorrow. "אתמול היה / הייתה" agrees with the day.
  'ex.m1.rel.today': 'היום',
  'ex.m1.rel.tomorrow': 'מחר',
  'ex.m1.rel.yesterday': 'אתמול',
  'ex.m1.rel.hint1': 'מחר זה היום שאחרי היום. אתמול זה היום שלפני היום.',
  'ex.m1.rel.tomorrow.prompt': 'היום {day}. איזה יום יהיה מחר?',
  'ex.m1.rel.yesterday.prompt': 'היום {day}. איזה יום היה אתמול?',
  'ex.m1.rel.fromTomorrow.prompt': 'מחר {day}. איזה יום היום?',
  'ex.m1.rel.fromYesterday.prompt': {
    f: 'אתמול הייתה {day}. איזה יום היום?',
    m: 'אתמול היה {day}. איזה יום היום?',
  },
  'ex.m1.rel.tomorrow.hint2': {
    f: 'מצאי את {day} בשבוע: זה היום. מחר הוא יום אחד קדימה.',
    m: 'מצא את {day} בשבוע: זה היום. מחר הוא יום אחד קדימה.',
  },
  'ex.m1.rel.yesterday.hint2': {
    f: 'מצאי את {day} בשבוע: זה היום. אתמול הוא יום אחד אחורה.',
    m: 'מצא את {day} בשבוע: זה היום. אתמול הוא יום אחד אחורה.',
  },
  'ex.m1.rel.fromTomorrow.hint2': {
    f: 'מצאי את {day} בשבוע: זה מחר. היום הוא יום אחד אחורה.',
    m: 'מצא את {day} בשבוע: זה מחר. היום הוא יום אחד אחורה.',
  },
  'ex.m1.rel.fromYesterday.hint2': {
    f: 'מצאי את {day} בשבוע: זה אתמול. היום הוא יום אחד קדימה.',
    m: 'מצא את {day} בשבוע: זה אתמול. היום הוא יום אחד קדימה.',
  },
  'ex.m1.rel.tomorrow.solution': 'אם היום {day}, מחר {ans}.',
  'ex.m1.rel.yesterday.solution': {
    f: 'אם היום {day}, אתמול הייתה {ans}.',
    m: 'אם היום {day}, אתמול היה {ans}.',
  },
  'ex.m1.rel.fromTomorrow.solution': 'אם מחר {day}, היום {ans}.',
  'ex.m1.rel.fromYesterday.solution': {
    f: 'אם אתמול הייתה {day}, היום {ans}.',
    m: 'אם אתמול היה {day}, היום {ans}.',
  },
  'ex.m1.rel.adv.same': 'זה היום שבשאלה. אנחנו מחפשים יום אחר: יום אחד לפניו, או יום אחד אחריו.',

  // Level 10: short word problems.
  'ex.m1.story.longer':
    'העיפרון של {name} באורך {a}. המכחול ארוך מהעיפרון ב{b}. כמה אטבים אורך המכחול?',
  'ex.m1.story.longer.hint1': 'המכחול ארוך יותר, אז יש לו יותר אטבים. מוסיפים.',
  'ex.m1.story.longer.solution': 'המכחול באורך {c}.',
  'ex.m1.story.longer.hint2': 'האטבים של העיפרון, ועוד האטבים הצבועים: זה המכחול.',
  'ex.m1.story.shorter':
    'הסרט האדום של {name} באורך {a}. הסרט הכחול קצר ממנו ב{b}. כמה אטבים אורך הסרט הכחול?',
  'ex.m1.story.shorter.hint1': 'הסרט הכחול קצר יותר, אז יש לו פחות אטבים. מורידים.',
  'ex.m1.story.shorter.solution': 'הסרט הכחול באורך {c}.',
  'ex.m1.story.shorter.hint2':
    'למעלה הסרט האדום, ולמטה הסרט הכחול. האטבים הצבועים הם מה שחסר לסרט הכחול.',
  'ex.m1.story.weights': 'ה{x} שוקל {a}, וה{y} שוקל {b}. כמה קוביות הם שוקלים יחד?',
  'ex.m1.story.weights.hint1': 'יחד פירושו גם וגם: מחברים את הקוביות של שניהם.',
  'ex.m1.story.weights.solution': 'יחד הם שוקלים {c}.',
  'ex.m1.story.weights.hint2': {
    f: 'ספרי את כל הקוביות, של שניהם יחד.',
    m: 'ספור את כל הקוביות, של שניהם יחד.',
  },
  'ex.m1.story.later': {
    f: 'היום {day}. בעוד {k}, {name} נוסעת לים. באיזה יום היא נוסעת?',
    m: 'היום {day}. בעוד {k}, {name} נוסע לים. באיזה יום הוא נוסע?',
  },
  'ex.m1.story.later.hint1': 'בעוד {k} פירושו: זזים בשבוע {k} קדימה.',
  'ex.m1.story.later.hint2': {
    f: 'מצאי את {day} בשבוע, וזוזי קדימה יום אחרי יום.',
    m: 'מצא את {day} בשבוע, וזוז קדימה יום אחרי יום.',
  },
  'ex.m1.story.later.solution': 'אם היום {day}, אז בעוד {k} זה {ans}.',
  'ex.m1.story.shabbat': '{name} מחכה לשבת. היום {day}. בעוד כמה ימים תגיע שבת?',
  'ex.m1.story.shabbat.hint1': 'נספור את הימים מהיום ועד שבת, יום אחרי יום.',
  'ex.m1.story.shabbat.hint2': {
    f: 'מצאי את {day} בשבוע, וספרי כמה ימים צריך לזוז עד שבת.',
    m: 'מצא את {day} בשבוע, וספור כמה ימים צריך לזוז עד שבת.',
  },
  'ex.m1.story.shabbat.solution': 'אם היום {day}, שבת תגיע בעוד {k}.',
} as const;
