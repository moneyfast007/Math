/**
 * Hebrew texts of the gan worlds "מרחב ומיקום" and "מיון והשוואה" (merged into `he`).
 * Everything here is spoken to a child who does not read yet. Plain strings, or
 * { f, m }: by the child's gender when a sentence addresses her or him, by the
 * thing's gender when it is about a thing (the code passes which).
 */
export const heGan2 = {
  // World "מרחב ומיקום".
  'topic.space0': 'מרחב ומיקום',
  'level.space0.1': 'למעלה ולמטה',
  'level.space0.2': 'בתוך ומחוץ',
  'level.space0.3': 'לפני ואחרי בתור',
  'level.space0.4': 'ראשון, אחרון ובאמצע',
  'level.space0.5': 'מעל, מתחת וליד',
  'level.space0.6': 'קרוב ורחוק',
  'level.space0.7': 'ימין ושמאל',
  'level.space0.8': 'שני ושלישי',
  'level.space0.9': 'לאן מוביל השביל?',
  'level.space0.10': 'מה זז בתמונה?',

  // Up and down: a cupboard with three shelves.
  'ex.space0.updown.up': 'מה נמצא הכי למעלה?',
  'ex.space0.updown.down': 'מה נמצא הכי למטה?',
  'ex.space0.updown.hint1': 'למעלה זה קרוב לתקרה. למטה זה קרוב לרצפה.',
  'ex.space0.updown.hint2.up': 'החץ מצביע למעלה. מה עומד על המדף העליון, הכי קרוב לתקרה?',
  'ex.space0.updown.hint2.down': 'החץ מצביע למטה. מה עומד על המדף התחתון, הכי קרוב לרצפה?',
  'ex.space0.updown.solution.up': 'על המדף העליון יש {name}.',
  'ex.space0.updown.solution.down': 'על המדף התחתון יש {name}.',
  'ex.space0.updown.adv.up': 'זה הכי למטה. אנחנו מחפשים מה הכי למעלה.',
  'ex.space0.updown.adv.down': 'זה הכי למעלה. אנחנו מחפשים מה הכי למטה.',

  // Inside and outside: an open box.
  'ex.space0.box.in': 'מה בתוך הקופסה?',
  'ex.space0.box.out': 'מה מחוץ לקופסה?',
  'ex.space0.box.hint1': 'בתוך הקופסה זה בין הקירות שלה. מחוץ לקופסה זה כל מה שלא בפנים.',
  'ex.space0.box.hint2.in': 'נעביר את האצבע בין הקירות של הקופסה: מה יש שם?',
  'ex.space0.box.hint2.out': 'נחפש מה עומד ליד הקופסה, ולא בין הקירות שלה.',
  'ex.space0.box.example.in': 'כאן בתוך הקופסה יש {name}.',
  'ex.space0.box.example.out': 'כאן מחוץ לקופסה יש {name}.',
  'ex.space0.box.solution.in': 'בתוך הקופסה יש {name}.',
  'ex.space0.box.solution.out': 'מחוץ לקופסה יש {name}.',
  'ex.space0.box.adv.in': 'ה{name} מחוץ לקופסה. מה נמצא בפנים?',
  'ex.space0.box.adv.out': 'ה{name} בתוך הקופסה. מה נמצא בחוץ?',

  // Before and after in a queue (every animal of a queue is masculine).
  'ex.space0.queue.before': 'הנה תור לגלידה. מי עומד מיד לפני ה{name}?',
  'ex.space0.queue.after': 'הנה תור לגלידה. מי עומד מיד אחרי ה{name}?',
  'ex.space0.queue.hint1': 'בתור, מי שעומד לפני קרוב יותר לגלידה, ומי שעומד אחרי רחוק יותר ממנה.',
  'ex.space0.queue.hint2.before':
    'החץ מראה לאן התור מתקדם. נמצא את ה{name}, ונסתכל על מי שעומד צמוד אליו, בצד של הגלידה.',
  'ex.space0.queue.hint2.after':
    'החץ מראה לאן התור מתקדם. נמצא את ה{name}, ונסתכל על מי שעומד צמוד אליו, מאחוריו.',
  'ex.space0.queue.example.before': 'בתור הזה, מיד לפני ה{name} עומד ה{other}.',
  'ex.space0.queue.example.after': 'בתור הזה, מיד אחרי ה{name} עומד ה{other}.',
  'ex.space0.queue.solution.before': 'מיד לפני ה{name} עומד ה{other}.',
  'ex.space0.queue.solution.after': 'מיד אחרי ה{name} עומד ה{other}.',
  'ex.space0.queue.adv.before': 'ה{other} עומד אחרי ה{name}. מי עומד לפניו, קרוב יותר לגלידה?',
  'ex.space0.queue.adv.after': 'ה{other} עומד לפני ה{name}. מי עומד אחריו, רחוק יותר מהגלידה?',

  // First, last and in the middle.
  'ex.space0.place.first': 'הנה תור לקרוסלה. מי ראשון בתור?',
  'ex.space0.place.last': 'הנה תור לקרוסלה. מי אחרון בתור?',
  'ex.space0.place.middle': 'הנה תור לקרוסלה. מי עומד באמצע התור?',
  'ex.space0.place.hint1.first': 'הראשון בתור הוא הכי קרוב לקרוסלה: לפניו אין אף אחד.',
  'ex.space0.place.hint1.last': 'האחרון בתור הוא הכי רחוק מהקרוסלה: אחריו אין אף אחד.',
  'ex.space0.place.hint1.middle':
    'באמצע זה בדיוק בין הראשון לאחרון: מכל צד שלו עומדים אותו מספר חברים.',
  'ex.space0.place.hint2.first': 'החץ מראה לאן התור מתקדם. מי עומד בקצה של החץ?',
  'ex.space0.place.hint2.last': 'החץ מראה לאן התור מתקדם. מי עומד בהתחלה של החץ, בסוף התור?',
  'ex.space0.place.hint2.middle':
    'נכסה באצבעות את הראשון ואת האחרון. אם נשארו כמה, נכסה שוב אחד מכל צד.',
  'ex.space0.place.solution.first': 'ה{name} ראשון בתור.',
  'ex.space0.place.solution.last': 'ה{name} אחרון בתור.',
  'ex.space0.place.solution.middle': 'ה{name} עומד באמצע התור.',
  'ex.space0.place.adv.first': 'ה{name} אחרון בתור, הכי רחוק מהקרוסלה. מי הכי קרוב אליה?',
  'ex.space0.place.adv.last': 'ה{name} ראשון בתור, הכי קרוב לקרוסלה. מי עומד בסוף?',

  // Above, under, next to: a table.
  'ex.space0.table.above': 'באיזו תמונה ה{name} מעל השולחן?',
  'ex.space0.table.under': 'באיזו תמונה ה{name} מתחת לשולחן?',
  'ex.space0.table.next': 'באיזו תמונה ה{name} ליד השולחן?',
  'ex.space0.table.label.above': 'מעל השולחן',
  'ex.space0.table.label.under': 'מתחת לשולחן',
  'ex.space0.table.label.next': 'ליד השולחן',
  'ex.space0.table.hint1.above': 'מעל השולחן זה למעלה, באוויר, גבוה יותר מהשולחן.',
  'ex.space0.table.hint1.under': 'מתחת לשולחן זה בין הרגליים שלו, קרוב לרצפה.',
  'ex.space0.table.hint1.next': 'ליד השולחן זה בצד שלו, קרוב אליו.',
  'ex.space0.table.hint2': 'החץ מראה את המקום. באיזו תמונה יש ציור בדיוק שם?',
  'ex.space0.table.example': 'כאן ה{name} {where}.',
  'ex.space0.table.solution': 'בתמונה הזאת ה{name} {where}.',
  'ex.space0.table.adv': 'כאן ה{name} {got}, ולא {want}.',

  // Near and far.
  'ex.space0.near.near': 'מה הכי קרוב ל{ref}?',
  'ex.space0.near.far': 'מה הכי רחוק מה{ref}?',
  'ex.space0.near.hint1.near': 'קרוב זה רק כמה צעדים. רחוק זה הרבה צעדים.',
  'ex.space0.near.hint1.far': 'רחוק זה הרבה צעדים. קרוב זה רק כמה צעדים.',
  'ex.space0.near.hint2.near': 'נצעד באצבע מה{ref} אל כל ציור. אל מי מגיעים הכי מהר?',
  'ex.space0.near.hint2.far': 'נצעד באצבע מה{ref} אל כל ציור. אל מי הדרך הכי ארוכה?',
  'ex.space0.near.solution.near': { f: 'ה{name} הכי קרובה ל{ref}.', m: 'ה{name} הכי קרוב ל{ref}.' },
  'ex.space0.near.solution.far': {
    f: 'ה{name} הכי רחוקה מה{ref}.',
    m: 'ה{name} הכי רחוק מה{ref}.',
  },
  'ex.space0.near.adv.middle.near': 'זה באמצע. מי קרוב עוד יותר ל{ref}?',
  'ex.space0.near.adv.middle.far': 'זה באמצע. מי רחוק עוד יותר מה{ref}?',
  'ex.space0.near.adv.near': 'זה הכי רחוק מה{ref}. השאלה מה הכי קרוב.',
  'ex.space0.near.adv.far': 'זה הכי קרוב ל{ref}. השאלה מה הכי רחוק.',

  // Right and left: the child's own hands, facing the screen (screen right is her right).
  'ex.space0.side.right': 'מה נמצא בצד ימין של התמונה?',
  'ex.space0.side.left': 'מה נמצא בצד שמאל של התמונה?',
  'ex.space0.side.hint1.right': {
    f: 'ימין ושמאל הם לפי הידיים שלך, כשאת מסתכלת על המסך. הרימי את יד ימין: בצד הזה של המסך נמצא ימין.',
    m: 'ימין ושמאל הם לפי הידיים שלך, כשאתה מסתכל על המסך. הרם את יד ימין: בצד הזה של המסך נמצא ימין.',
  },
  'ex.space0.side.hint1.left': {
    f: 'ימין ושמאל הם לפי הידיים שלך, כשאת מסתכלת על המסך. הרימי את יד שמאל: בצד הזה של המסך נמצא שמאל.',
    m: 'ימין ושמאל הם לפי הידיים שלך, כשאתה מסתכל על המסך. הרם את יד שמאל: בצד הזה של המסך נמצא שמאל.',
  },
  'ex.space0.side.hint2': 'כתבנו בתמונה: ימין בצד של יד ימין, ושמאל בצד של יד שמאל.',
  'ex.space0.side.solution.right': 'בצד ימין יש {name}.',
  'ex.space0.side.solution.left': 'בצד שמאל יש {name}.',
  'ex.space0.side.word.right': 'ימין',
  'ex.space0.side.word.left': 'שמאל',
  'ex.space0.side.adv.middle': 'זה באמצע. אנחנו מחפשים מה בצד {side}.',
  'ex.space0.side.adv.right': 'זה בצד שמאל. נרים את יד ימין, ונסתכל לצד שלה.',
  'ex.space0.side.adv.left': 'זה בצד ימין. נרים את יד שמאל, ונסתכל לצד שלה.',

  // Second and third: the cars of a train, counted from the engine.
  'ex.space0.train.who': 'מי נוסע בקרון ה{ord}?',
  'ex.space0.train.which': 'באיזה קרון נוסע ה{name}?',
  'ex.space0.train.hint1': 'סופרים את הקרונות מהקטר: ראשון, שני, שלישי, רביעי.',
  'ex.space0.train.hint2': 'נתחיל ליד הקטר, ונספור את הקרונות אחד אחד, לכיוון של החץ.',
  'ex.space0.train.example.who': 'ברכבת הזאת, בקרון ה{ord} נוסע ה{name}.',
  'ex.space0.train.example.which': 'ברכבת הזאת, ה{name} נוסע בקרון ה{ord}.',
  'ex.space0.train.solution.who': 'בקרון ה{ord} נוסע ה{name}.',
  'ex.space0.train.solution.which': 'ה{name} נוסע בקרון ה{ord}.',
  'ex.space0.train.adv.fromEnd': 'ספרנו מהסוף של הרכבת. סופרים מהקטר, מימין.',
  'ex.space0.train.adv.near': 'כמעט. נספור שוב מהקטר, ונגע בכל קרון פעם אחת.',

  // Where does the path lead?
  'ex.space0.path.ask': 'לאן מוביל השביל של ה{name}?',
  'ex.space0.path.hint1': 'נשים את האצבע על ה{name}, ונלך לאט על השביל שלו עד הסוף.',
  'ex.space0.path.hint2':
    'השביל של ה{name} {color}. הנה ההתחלה שלו: נמשיך עליו, בלי לקפוץ לשביל אחר.',
  'ex.space0.path.solution': 'השביל של ה{name} מוביל ל{dest}.',

  // What moved? The room before (above) and after (below).
  'ex.space0.moved.ask': 'הנה אותו חדר פעמיים: קודם למעלה, ואחר כך למטה. מה זז למקום אחר?',
  'ex.space0.moved.hint1':
    'נסתכל על כל ציור בתמונה העליונה, ונבדוק אם הוא באותו מקום גם בתמונה התחתונה.',
  'ex.space0.moved.hint2': {
    f: 'ה{name} נשארה באותו מקום, אז היא לא זזה. נבדוק כך כל ציור.',
    m: 'ה{name} נשאר באותו מקום, אז הוא לא זז. נבדוק כך כל ציור.',
  },
  'ex.space0.moved.solution': { f: 'ה{name} זזה למקום אחר.', m: 'ה{name} זז למקום אחר.' },

  // World "מיון והשוואה".
  'topic.sort0': 'מיון והשוואה',
  'level.sort0.1': 'מה לא שייך?',
  'level.sort0.2': 'מיון לפי צבע',
  'level.sort0.3': 'מיון לפי צורה',
  'level.sort0.4': 'מיון לפי גודל',
  'level.sort0.5': 'מהקטן לגדול',
  'level.sort0.6': 'זוגות שמתאימים',
  'level.sort0.7': 'מה חסר בקבוצה?',
  'level.sort0.8': 'יותר, פחות או שווה',
  'level.sort0.9': 'כמה בכל קבוצה?',
  'level.sort0.10': 'שתי תכונות',

  // What does not belong?
  'ex.sort0.family.fruit': 'פרי',
  'ex.sort0.family.animal': 'חיה',
  'ex.sort0.family.vehicle': 'כלי תחבורה',
  'ex.sort0.family.clothes': 'בגד',
  'ex.sort0.families.fruit': 'פירות',
  'ex.sort0.families.animal': 'חיות',
  'ex.sort0.families.vehicle': 'כלי תחבורה',
  'ex.sort0.families.clothes': 'בגדים',
  'ex.sort0.odd.ask': 'מה לא שייך לקבוצה?',
  'ex.sort0.odd.hint1': 'שלושה ציורים הם מאותה משפחה, ואחד לא. מי לא מתאים לאחרים?',
  'ex.sort0.odd.hint2': 'נשאל על כל ציור: האם זה {family}?',
  'ex.sort0.odd.example': {
    f: '{a}, {b}, {c} ו{d}. ה{d} לא שייכת, כי כל השאר {families}.',
    m: '{a}, {b}, {c} ו{d}. ה{d} לא שייך, כי כל השאר {families}.',
  },
  'ex.sort0.odd.solution': {
    f: 'ה{name} לא שייכת: כל השאר {families}.',
    m: 'ה{name} לא שייך: כל השאר {families}.',
  },
  'ex.sort0.odd.adv': 'יש עוד שניים מאותה משפחה כמו זה. נחפש את מי שלא דומה לאף אחד.',

  // Sorting by colour, by shape.
  'ex.sort0.group.ask': 'מה עוד שייך לקבוצה הזאת?',
  'ex.sort0.color.hint1': 'נסתכל על הצבע של הדברים בקבוצה.',
  'ex.sort0.color.hint2': 'כל הדברים בקבוצה בצבע {color}. איזה עוד ציור בצבע {color}?',
  'ex.sort0.color.example': 'בקבוצה של דברים {colors} אפשר לשים גם {name}.',
  'ex.sort0.color.solution': 'ה{name} בצבע {color}, כמו כל הדברים בקבוצה.',
  'ex.sort0.color.adv': 'ה{name} בצבע {its}. בקבוצה הזאת כל הדברים בצבע {color}.',
  'ex.sort0.shape.hint1': 'נסתכל על הצורה של הדברים בקבוצה, ולא על הצבע.',
  'ex.sort0.shape.hint2': 'כל הצורות בקבוצה הן {kinds}. איזה ציור הוא גם {kind}?',
  'ex.sort0.shape.example': 'בקבוצה של {kinds} אפשר לשים גם {kind} {color}.',
  'ex.sort0.shape.solution': 'זה {kind}, כמו כל הצורות בקבוצה.',
  'ex.sort0.shape.adv': 'זה {kind}. בקבוצה הזאת יש רק {kinds}.',

  // Sorting by size.
  'ex.sort0.size.ask.big': 'מה עוד שייך לקבוצה של הגדולים?',
  'ex.sort0.size.ask.small': 'מה עוד שייך לקבוצה של הקטנים?',
  'ex.sort0.size.hint1.big': 'בקבוצה של הגדולים כל הדברים גדולים, גם אם הם שונים זה מזה.',
  'ex.sort0.size.hint1.small': 'בקבוצה של הקטנים כל הדברים קטנים, גם אם הם שונים זה מזה.',
  'ex.sort0.size.hint2.big': 'נשווה כל ציור לדברים שבקבוצה: האם הוא גדול כמוהם?',
  'ex.sort0.size.hint2.small': 'נשווה כל ציור לדברים שבקבוצה: האם הוא קטן כמוהם?',
  'ex.sort0.size.example.big': {
    f: 'ה{name} הזאת גדולה, ולכן היא שייכת לקבוצה של הגדולים.',
    m: 'ה{name} הזה גדול, ולכן הוא שייך לקבוצה של הגדולים.',
  },
  'ex.sort0.size.example.small': {
    f: 'ה{name} הזאת קטנה, ולכן היא שייכת לקבוצה של הקטנים.',
    m: 'ה{name} הזה קטן, ולכן הוא שייך לקבוצה של הקטנים.',
  },
  'ex.sort0.size.solution.big': {
    f: 'ה{name} גדולה, כמו כל הדברים בקבוצה.',
    m: 'ה{name} גדול, כמו כל הדברים בקבוצה.',
  },
  'ex.sort0.size.solution.small': {
    f: 'ה{name} קטנה, כמו כל הדברים בקבוצה.',
    m: 'ה{name} קטן, כמו כל הדברים בקבוצה.',
  },
  'ex.sort0.size.adv.big': 'הציור הזה קטן. בקבוצה הזאת כל הדברים גדולים.',
  'ex.sort0.size.adv.small': 'הציור הזה גדול. בקבוצה הזאת כל הדברים קטנים.',

  // From small to big (a row read from the right).
  'ex.sort0.order.ask.up': 'מסדרים מהקטן לגדול. מה חסר בשורה?',
  'ex.sort0.order.ask.down': 'מסדרים מהגדול לקטן. מה חסר בשורה?',
  'ex.sort0.order.hint1.up': 'מתחילים מימין: כל ציור גדול יותר מהציור שלפניו.',
  'ex.sort0.order.hint1.down': 'מתחילים מימין: כל ציור קטן יותר מהציור שלפניו.',
  'ex.sort0.order.hint2.up':
    'החץ מראה מאיפה מתחילים. מה שחסר צריך להיות גדול מהציור שלפניו, וקטן מהציור שאחריו.',
  'ex.sort0.order.hint2.down':
    'החץ מראה מאיפה מתחילים. מה שחסר צריך להיות קטן מהציור שלפניו, וגדול מהציור שאחריו.',
  'ex.sort0.order.example.up': 'כך מסדרים {names} מהקטן לגדול.',
  'ex.sort0.order.example.down': 'כך מסדרים {names} מהגדול לקטן.',
  'ex.sort0.order.solution': 'בשורה חסר {name} {size}.',

  // Pairs that go together.
  'ex.sort0.pair.ask': 'מה מתאים ל{name}?',
  'ex.sort0.pair.hint1': 'נחשוב: מה הולך יחד עם ה{name}?',
  'ex.sort0.pair.hint1.same': 'יש דברים שבאים בזוג: שניים בדיוק אותו דבר.',
  'ex.sort0.pair.clue.key': 'עם מפתח פותחים משהו נעול. מה פותחים איתו?',
  'ex.sort0.pair.clue.lock': 'מנעול פותחים עם משהו קטן שמכניסים לתוכו.',
  'ex.sort0.pair.clue.same': 'צריך עוד ציור בדיוק כמו הזה, כדי שיהיה זוג.',
  'ex.sort0.pair.clue.dog': 'מה כלבים אוהבים לכרסם?',
  'ex.sort0.pair.clue.bone': 'מי אוהב לכרסם עצמות?',
  'ex.sort0.pair.clue.rabbit': 'מה ארנבים אוהבים לאכול?',
  'ex.sort0.pair.clue.carrot': 'מי אוהב לאכול גזר?',
  'ex.sort0.pair.clue.bee': 'על מה דבורים נוחתות, כדי לאסוף צוף?',
  'ex.sort0.pair.clue.monkey': 'מה קופים אוהבים לאכול?',
  'ex.sort0.pair.clue.baby': 'ממה תינוק קטן שותה?',
  'ex.sort0.pair.clue.umbrella': 'מתי פותחים מטרייה?',
  'ex.sort0.pair.clue.spoon': 'במה שמים מרק, ואוכלים ממנו בכפית?',
  'ex.sort0.pair.solution': '{a} ו{b} הולכים יחד.',
  'ex.sort0.pair.solution.same': '{name} ועוד {name}: זה זוג.',

  // What is missing from the group?
  'ex.sort0.missing.ask': 'בשתי הקבוצות צריכים להיות אותם דברים. מה חסר בקבוצה שלמטה?',
  'ex.sort0.missing.hint1': 'נבדוק כל ציור בקבוצה שלמעלה: האם הוא נמצא גם בקבוצה שלמטה?',
  'ex.sort0.missing.hint2': 'למעלה יש שלושה ציורים, ולמטה רק שניים. חסר ציור אחד.',
  'ex.sort0.missing.example': 'אם למעלה יש {a}, {b} ו{c}, ולמטה רק {c} ו{b}, אז למטה אין {a}.',
  'ex.sort0.missing.solution': 'בקבוצה שלמטה אין {name}.',
  'ex.sort0.missing.adv.both': 'את זה יש בשתי הקבוצות. מה יש למעלה, ואין למטה?',
  'ex.sort0.missing.adv.none': 'את זה אין באף קבוצה. מה יש למעלה, ואין למטה?',

  // More, fewer or the same: matching one to one.
  'ex.sort0.compare.same': 'אותו מספר',
  'ex.sort0.compare.ask.more': 'יש יותר {xs}, יותר {ys}, או אותו מספר?',
  'ex.sort0.compare.ask.fewer': 'יש פחות {xs}, פחות {ys}, או אותו מספר?',
  'ex.sort0.compare.hint1': 'נתאים לכל ציור למעלה ציור אחד למטה. האם מישהו נשאר בלי זוג?',
  'ex.sort0.compare.hint2.more': 'חיברנו בקו כל זוג. אם מישהו נשאר בלי זוג, מהם יש יותר.',
  'ex.sort0.compare.hint2.fewer':
    'חיברנו בקו כל זוג. אם מישהו נשאר בלי זוג, מהם יש יותר, ומהאחרים יש פחות.',
  'ex.sort0.compare.example.same': '{a} ו{b}: לכל אחד יש זוג, ולכן יש אותו מספר.',
  'ex.sort0.compare.example.more':
    '{a} ו{b}: לכל ה{ys} יש זוג, אבל לא לכל ה{xs}. לכן יש יותר {xs}.',
  'ex.sort0.compare.example.fewer':
    '{a} ו{b}: לכל ה{xs} יש זוג, אבל לא לכל ה{ys}. לכן יש פחות {xs}.',
  'ex.sort0.compare.solution.same': 'יש {a} ו{b}: אותו מספר.',
  'ex.sort0.compare.solution.more': 'יש {a} ו{b}, ולכן יש יותר {w}.',
  'ex.sort0.compare.solution.fewer': 'יש {a} ו{b}, ולכן יש פחות {w}.',
  'ex.sort0.compare.adv.notSame': 'לא לכולם יש זוג. נחבר בקו כל זוג, ונראה מי נשאר לבד.',
  'ex.sort0.compare.adv.same': 'לכל אחד יש זוג, אז באף קבוצה אין יותר.',
  'ex.sort0.compare.adv.more': 'מה{w} יש פחות. השאלה מאיפה יש יותר.',
  'ex.sort0.compare.adv.fewer': 'מה{w} יש יותר. השאלה מאיפה יש פחות.',

  // How many in the group once sorted?
  'ex.sort0.count.ask.color': 'נשים בסל את כל הדברים ה{colors}. כמה דברים יהיו בסל?',
  'ex.sort0.count.ask.family': 'נשים בסל את כל ה{family}. כמה {family} יהיו בסל?',
  'ex.sort0.count.hint1.color': 'נחפש את הדברים ה{colors}, ונגע בכל אחד פעם אחת.',
  'ex.sort0.count.hint1.family': 'נחפש את ה{family}, ונגע בכל אחד פעם אחת.',
  'ex.sort0.count.hint2': 'סימנו אותם בעיגול. עכשיו נספור אותם.',
  'ex.sort0.count.example.color': 'כאן יש {n} {colors}.',
  'ex.sort0.count.example.family': 'כאן יש {n}.',
  'ex.sort0.count.solution.color': 'יש {n} {colors}.',
  'ex.sort0.count.solution.family': 'יש {n}.',

  // Two properties at once (shape names are masculine, so are their colours).
  'ex.sort0.two.ask.size': 'איזה {shape} הוא גם {size} וגם {color}?',
  'ex.sort0.two.ask.shape': 'איזה ציור הוא גם {shape} וגם {color}?',
  'ex.sort0.two.hint1.size': 'יש כאן שני דברים לבדוק: את הגודל, ואת הצבע.',
  'ex.sort0.two.hint1.shape': 'יש כאן שני דברים לבדוק: את הצורה, ואת הצבע.',
  'ex.sort0.two.hint2.size': 'קודם נמצא את ה{shapes} ה{colors}. מביניהם, איזה {size}?',
  'ex.sort0.two.hint2.shape': 'קודם נמצא את כל ה{shapes}. מביניהם, איזה {color}?',
  'ex.sort0.two.example.size': 'זה {shape} {size} ו{color}.',
  'ex.sort0.two.example.shape': 'זה {shape} {color}.',
  'ex.sort0.two.solution.size': 'זה ה{shape} ה{size} וה{color}.',
  'ex.sort0.two.solution.shape': 'זה ה{shape} ה{color}.',
  'ex.sort0.two.adv.one': 'הוא {ok}, אבל {bad}. אנחנו מחפשים {want}.',
  'ex.sort0.two.adv.none': 'הוא לא {a}, וגם לא {b}.',
} as const;
