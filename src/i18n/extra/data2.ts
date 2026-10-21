/**
 * Hebrew texts of the two data worlds (merged into `he`): "חקר נתונים" for
 * grades 1–3 and "נתונים וממוצע" for grades 4–6. The keys of the levels that
 * moved over unchanged (`level.data.*`, `ex.data.*`) stay in ./worlds.
 * Hints are also spoken, so they hold no digits; numbers come through `{slots}`.
 */
export const heData2 = {
  // World: data, grades 1–3 (new stations)
  'level.data.tally': 'סימני ספירה',
  'level.data.table': 'קוראים טבלה',
  'level.data.survey': 'סקר בכיתה',

  // World: data and the average, grades 4–6
  'topic.dataStats': 'נתונים וממוצע',
  'level.dataStats.1': 'גרף בקפיצות',
  'level.dataStats.2': 'גרף עמודות כפול',
  'level.dataStats.3': 'שני צעדים בגרף',
  'level.dataStats.4': 'גרף קו',
  'level.dataStats.7': 'טווח',
  'level.dataStats.8': 'ממוצע חסר',
  'level.dataStats.10': 'דיאגרמת עוגה',

  // A picture graph: one picture for each child.
  'ex.data2.pic.hint2': 'כל ציור הוא ילד אחד. נספור את הציורים בעמודה.',

  // Table columns
  'ex.data2.col.fruit': 'פרי',
  'ex.data2.col.sport': 'ספורט',
  'ex.data2.col.pet': 'חיה',
  'ex.data2.col.color': 'צבע',
  'ex.data2.col.kids': 'ילדים',
  'ex.data2.col.name': 'שם',
  'ex.data2.col.points': 'נקודות',
  'ex.data2.col.cm': 'סנטימטרים',
  'ex.data2.col.test': 'מבחן',
  'ex.data2.col.score': 'ציון',

  // Tally marks
  'ex.data2.tally.prompt': 'לפי סימני הספירה: כמה ילדים בחרו {item}?',
  'ex.data2.tally.hint1': 'כל קו הוא ילד אחד. קו באלכסון סוגר חבורה של חמישה.',
  'ex.data2.tally.hint2': 'נספור קודם את החבורות של חמישה, ואחר כך את הקווים שנשארו.',
  'ex.data2.tally.example': 'חבורה של חמישה ועוד {k}: יחד {r}.',
  'ex.data2.tally.which.prompt': 'איזה סימון מראה {n}?',
  'ex.data2.tally.which.hint1': 'בכל חבורה שסגורה בקו באלכסון יש חמישה קווים.',
  'ex.data2.tally.which.solution': 'הסימון הזה מראה {n}.',

  // Reading a table
  'ex.data2.table.read.prompt': 'לפי הטבלה: כמה ילדים בחרו {item}?',
  'ex.data2.table.read.hint1': 'נמצא בטבלה את השורה של {item}.',
  'ex.data2.table.read.hint2': 'באותה שורה, המספר שלידה אומר כמה ילדים בחרו.',
  'ex.data2.table.read.hint3': 'בטבלה כל שורה היא תשובה אחת, והמספר הוא כמה ילדים בחרו בה.',
  'ex.data2.table.most.prompt': 'לפי הטבלה: מה בחרו הכי הרבה ילדים?',
  'ex.data2.table.least.prompt': 'לפי הטבלה: מה בחרו הכי מעט ילדים?',
  'ex.data2.table.most.hint1': 'נחפש בטבלה את המספר הכי גדול.',
  'ex.data2.table.least.hint1': 'נחפש בטבלה את המספר הכי קטן.',
  'ex.data2.table.most.hint2': 'נשווה את המספרים של כל השורות.',
  'ex.data2.table.more.prompt': 'לפי הטבלה: בכמה ילדים יותר בחרו {a} מאשר {b}?',

  // A class survey (a table of results)
  'ex.data2.survey.total.prompt': 'כמה ילדים ענו על הסקר בסך הכל?',
  'ex.data2.survey.total.hint1': 'בסך הכל: מחברים את המספרים של כל השורות.',
  'ex.data2.survey.total.hint2': 'נחבר את כל המספרים שבטבלה:',
  'ex.data2.survey.total.example': 'בטבלה כזאת ענו בסך הכל {r} ילדים.',
  'ex.data2.survey.pair.prompt': 'אילו שתי תשובות קיבלו ביחד {n} ילדים?',
  'ex.data2.survey.pair.hint1': 'נחבר שתי שורות בכל פעם, עד שנגיע ל{n}.',
  'ex.data2.survey.pair.hint2': 'נבדוק זוג אחד: {a} ו{b} ביחד זה {s}. אם זה לא {n}, ננסה זוג אחר.',
  'ex.data2.survey.pair.example': 'אם {x} בחרו דבר אחד ו{y} דבר אחר, ביחד זה {r}.',
  'ex.data2.survey.pair.solution': '{a} ו{b}: ביחד {n} ילדים.',
  'ex.data2.survey.not.prompt': 'כמה ילדים לא בחרו {item}?',
  'ex.data2.survey.not.hint1': 'קודם נמצא כמה ילדים ענו בסך הכל.',
  'ex.data2.survey.not.hint2': 'בסך הכל ענו {s} ילדים. מתוכם, {item} בחרו {k} ילדים.',
  'ex.data2.survey.not.example':
    'אם ענו {s} ילדים, ו{k} מהם בחרו משהו אחד, אז {r} ילדים לא בחרו בו.',
  'ex.data2.survey.not.solution': '{r} ילדים לא בחרו {item}.',

  // A scale with half steps
  'ex.data2.half.hint3': 'עמודה שנגמרת באמצע בין שני קווים: מוסיפים חצי קפיצה.',

  // A double bar chart
  'ex.data2.boys': 'בנים',
  'ex.data2.girls': 'בנות',
  'ex.data2.double.read.boys': 'לפי הגרף: כמה בנים בחרו {item}?',
  'ex.data2.double.read.girls': 'לפי הגרף: כמה בנות בחרו {item}?',
  'ex.data2.double.read.hint1':
    'בכל תשובה יש שתי עמודות. המקרא שמעל הגרף אומר איזה צבע הוא בנים ואיזה בנות.',
  'ex.data2.double.read.hint2': 'נמצא ליד {item} את העמודה של ה{who}, ונעקוב מראשה אל המספרים.',
  'ex.data2.double.read.solution': '{n} {who} בחרו {item}.',
  'ex.data2.double.both.prompt': 'לפי הגרף: כמה ילדים בחרו {item}, בנים ובנות ביחד?',
  'ex.data2.double.both.hint1': 'נקרא את שתי העמודות של {item}, ונחבר.',
  'ex.data2.double.both.hint2': 'בנים שבחרו {item}: {a}. עכשיו נקרא את העמודה של הבנות.',
  'ex.data2.double.both.example': 'אם {a} בנים ו{b} בנות בחרו, ביחד זה {r} ילדים.',
  'ex.data2.double.both.solution': 'ביחד בחרו {item} {r} ילדים.',
  'ex.data2.double.moreBoys.prompt': 'לפי הגרף: באיזו תשובה בחרו יותר בנים מבנות?',
  'ex.data2.double.moreGirls.prompt': 'לפי הגרף: באיזו תשובה בחרו יותר בנות מבנים?',
  'ex.data2.double.more.hint1': 'נשווה בכל תשובה את שתי העמודות שלה.',
  'ex.data2.double.moreBoys.hint2': 'נחפש את התשובה שבה העמודה של הבנים גבוהה יותר.',
  'ex.data2.double.moreGirls.hint2': 'נחפש את התשובה שבה העמודה של הבנות גבוהה יותר.',
  'ex.data2.double.moreBoys.solution': '{item}: יותר בנים מבנות.',
  'ex.data2.double.moreGirls.solution': '{item}: יותר בנות מבנים.',

  // A line graph
  'ex.data2.line.title.books': 'כמה ספרים הושאלו בספרייה?',
  'ex.data2.line.title.zoo': 'כמה מבקרים היו בגן החיות?',
  'ex.data2.line.value.books': 'לפי הגרף: כמה ספרים הושאלו ביום {day}?',
  'ex.data2.line.value.zoo': 'לפי הגרף: כמה מבקרים היו ביום {day}?',
  'ex.data2.line.value.hint1': 'נמצא למטה את יום {day}, ונעלה ממנו עד הנקודה.',
  'ex.data2.line.value.hint2': 'מהנקודה נעקוב ישר שמאלה אל המספרים. כל קו הוא {step}.',
  'ex.data2.line.hint3': 'בגרף קו כל נקודה היא המספר של יום אחד, והקו מחבר בין הימים.',
  'ex.data2.line.value.books.solution': 'ביום {day} הושאלו {n}.',
  'ex.data2.line.value.zoo.solution': 'ביום {day} היו בגן החיות {n}.',
  'ex.data2.line.rise.prompt': 'לפי הגרף: בין אילו ימים המספר עלה הכי הרבה?',
  'ex.data2.line.rise.hint1': 'נחפש את הקטע שבו הקו עולה הכי תלול.',
  'ex.data2.line.rise.hint2': 'נבדוק בכל קטע בכמה עלה המספר, מיום ליום.',
  'ex.data2.line.rise.hint3': 'ככל שהקו עולה תלול יותר, העלייה גדולה יותר.',
  'ex.data2.line.rise.solution': 'הכי הרבה המספר עלה מ{a} ל{b}.',
  'ex.data2.line.change.prompt': 'לפי הגרף: בכמה עלה המספר מיום {a} ליום {b}?',
  'ex.data2.line.change.hint1': 'נקרא את המספר בכל אחד משני הימים, ונחסר.',
  'ex.data2.line.change.hint2': 'ביום {a} הגרף מראה {x}. כמה הוא מראה ביום {b}?',
  'ex.data2.line.change.example': 'מ{x} ל{y} זו עלייה של {d}.',
  'ex.data2.line.change.solution': 'מיום {a} ליום {b} המספר עלה ב{d}.',

  // The range
  'ex.data2.range.title.game': 'כמה נקודות כל אחד קיבל במשחק?',
  'ex.data2.range.title.jump': 'כמה רחוק כל אחד קפץ?',
  'ex.data2.range.prompt': 'לפי הטבלה: מה הטווח של התוצאות?',
  'ex.data2.range.hint1': 'טווח: התוצאה הגדולה ביותר פחות התוצאה הקטנה ביותר.',
  'ex.data2.range.hint2': 'הגדולה ביותר היא {max}, והקטנה ביותר היא {min}.',
  'ex.data2.range.example': 'אם הגדולה ביותר {max} והקטנה ביותר {min}, הטווח הוא {r}.',
  'ex.data2.range.solution': '{max} פחות {min}: הטווח הוא {r}.',

  // A missing score for an average
  'ex.data2.need.title': 'הציונים במבחנים',
  'ex.data2.need.prompt3': {
    f: '{name} רוצה ממוצע {avg} בשלושה מבחנים. איזה ציון היא צריכה במבחן השלישי?',
    m: '{name} רוצה ממוצע {avg} בשלושה מבחנים. איזה ציון הוא צריך במבחן השלישי?',
  },
  'ex.data2.need.prompt4': {
    f: '{name} רוצה ממוצע {avg} בארבעה מבחנים. איזה ציון היא צריכה במבחן הרביעי?',
    m: '{name} רוצה ממוצע {avg} בארבעה מבחנים. איזה ציון הוא צריך במבחן הרביעי?',
  },
  'ex.data2.need.hint1': 'קודם נחשב מה צריך להיות הסכום של כל הציונים: הממוצע כפול מספר המבחנים.',
  'ex.data2.need.hint2': 'הסכום צריך להיות {total}, ועד עכשיו יש {sum}. כמה חסר?',
  'ex.data2.need.example':
    'ממוצע {avg} בשני מבחנים זה סכום של {total}. אם בראשון {a}, בשני צריך {r}.',
  'ex.data2.need.solution': 'הסכום צריך להיות {total}, ויש {sum}: חסר {r}.',

  // A pie chart
  'ex.data2.pie.prompt': 'בסקר השתתפו {n} ילדים. כמה ילדים בחרו {item}?',
  'ex.data2.pie.hint1':
    'נבדוק איזה חלק מהעיגול הוא {item}. הקווים הדקים מחלקים את העיגול לחלקים שווים.',
  'ex.data2.pie.hint2': 'החלק של {item} הוא {frac} מהעיגול.',
  'ex.data2.pie.example': '{frac} מ{n} זה {r}.',
  'ex.data2.pie.solution': '{frac} מ{n} זה {r} ילדים.',
} as const;
