/**
 * Hebrew texts of gan hova's eighth world, "זמן וסדר" (merged into `he`).
 * Read aloud: short sentences, pictures for every answer.
 */
export const heGan5 = {
  'topic.time0': 'זמן וסדר',
  'level.time0.1': 'מה בא קודם?',
  'level.time0.2': 'מה בא אחר כך?',
  'level.time0.3': 'מה קורה ראשון?',
  'level.time0.4': 'מה קורה באמצע?',
  'level.time0.5': 'מה קורה בסוף?',
  'level.time0.6': 'בוקר, צהריים או לילה?',
  'level.time0.7': 'מה עושים מתי?',
  'level.time0.8': 'איזו עונה?',
  'level.time0.9': 'מה לובשים?',
  'level.time0.10': 'מה לוקח יותר זמן?',

  // Two things in order.
  'ex.t0.pair.first.prompt': 'מה בא קודם: {a} או {b}?',
  'ex.t0.pair.then.prompt': 'מה בא אחר כך: {a} או {b}?',
  'ex.t0.pair.solution': 'קודם {first}, ואחר כך {then}.',
  'ex.t0.pair.hint1': 'נחשוב: מה צריך לקרות קודם, כדי שהשני יוכל לקרות?',
  'ex.t0.pair.hint2': 'נדמיין את הסיפור מההתחלה ועד הסוף.',
  'adv.t0.pair': 'נחשוב שוב: האם זה יכול לקרות לפני השני?',

  // Three things in order: which is missing.
  'ex.t0.seq.first.prompt': 'מה קורה ראשון?',
  'ex.t0.seq.middle.prompt': 'מה קורה באמצע?',
  'ex.t0.seq.last.prompt': 'מה קורה בסוף?',
  'ex.t0.seq.hint1': 'נקרא את התמונות לפי הסדר, מימין לשמאל, כמו סיפור.',
  'ex.t0.seq.hint2': 'מה מתאים במקום הריק, כדי שהסיפור יהיה נכון?',
  'ex.t0.seq.solution': 'קודם {a}, אחר כך {b}, ובסוף {c}.',
  'adv.t0.seq': 'זה לא חלק מהסיפור הזה. מה מתאים בין התמונות?',

  // Morning, noon, night.
  'ex.t0.when.prompt': 'מתי {act}?',
  'ex.t0.when.solution': '{act} {when}.',
  'ex.t0.when.hint1': 'נחשוב על היום שלנו: מה עושים כשמתעוררים, ומה עושים לפני השינה?',
  'ex.t0.when.hint2': 'בבוקר השמש עולה, בצהריים היא גבוהה בשמיים, ובלילה רואים את הירח.',
  'adv.t0.when': 'נחשוב שוב על היום שלנו: מתי זה קורה?',
  'ex.t0.time.morning': 'בבוקר',
  'ex.t0.time.noon': 'בצהריים',
  'ex.t0.time.night': 'בלילה',

  // What we do when.
  'ex.t0.what.prompt': 'מה עושים {when}?',
  'ex.t0.what.solution': '{when} {act}.',
  'adv.t0.what': 'את זה עושים בזמן אחר. מה עושים בזמן ששאלנו עליו?',

  // Seasons.
  'ex.t0.season.prompt': 'איזו עונה בתמונה?',
  'ex.t0.season.hint1': 'נסתכל על התמונה: חם או קר? יש גשם, שלג, פרחים או עלים שנופלים?',
  'ex.t0.season.hint2':
    'בחורף קר ויורד גשם, באביב פורחים פרחים, בקיץ חם והולכים לים, ובסתיו העלים נושרים.',
  'ex.t0.season.solution': 'זה {s}: {why}.',
  'adv.t0.season': 'נסתכל שוב על התמונה: מה רואים בה?',
  'ex.t0.season.winter': 'חורף',
  'ex.t0.season.spring': 'אביב',
  'ex.t0.season.summer': 'קיץ',
  'ex.t0.season.autumn': 'סתיו',

  // What to wear.
  'ex.t0.wear.cold.prompt': 'מה לובשים כשקר בחוץ?',
  'ex.t0.wear.hot.prompt': 'מה לובשים כשחם בחוץ?',
  'ex.t0.wear.cold.hint1': 'כשקר, לובשים בגדים ששומרים עלינו חמים.',
  'ex.t0.wear.hot.hint1': 'כשחם, לובשים בגדים קלים, ושומרים על עצמנו מהשמש.',
  'ex.t0.wear.hint2': 'נדמיין שאנחנו יוצאים החוצה. מה היינו רוצים ללבוש?',
  'ex.t0.wear.cold.solution': 'כשקר בחוץ, לובשים {w}.',
  'ex.t0.wear.hot.solution': 'כשחם בחוץ, לובשים {w}.',
  'adv.t0.wear.cold': 'את זה לובשים כשחם. מה שומר עלינו חמים?',
  'adv.t0.wear.hot': 'את זה לובשים כשקר. מה לובשים כשחם?',

  // A long time and a short time.
  'ex.t0.long.more.prompt': 'מה לוקח יותר זמן: {a} או {b}?',
  'ex.t0.long.less.prompt': 'מה לוקח פחות זמן: {a} או {b}?',
  'ex.t0.long.hint1': 'נדמיין שאנחנו עושים כל אחד מהם. מה נגמר מהר, ומה לוקח הרבה זמן?',
  'ex.t0.long.hint2': 'דבר שנגמר בזמן שאומרים "אחת, שתיים" לוקח מעט זמן.',
  'ex.t0.long.more.solution': '{w} לוקח יותר זמן מאשר {l}.',
  'ex.t0.long.less.solution': '{w} לוקח פחות זמן מאשר {l}.',
  'adv.t0.long.more': 'זה נגמר מהר. מה לוקח הרבה זמן?',
  'adv.t0.long.less': 'זה לוקח הרבה זמן. מה נגמר מהר?',
} as const;
