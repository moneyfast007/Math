/**
 * Hebrew texts of the new levels of "מצולעים" (grade 1, levels 6–10) and of the
 * world "מצולעים, זוויות ומדידה" (grade 2), merged into `he`. Grade 2's levels
 * 1–5 keep their texts in ./worlds.ts (`ex.poly.*`). Plain strings, or { f, m }
 * when the sentence addresses the child; numbers come through `{slots}`, so
 * nothing spoken holds a digit.
 */
export const hePolygons2 = {
  'level.polygons.6': 'ריבוע ומלבן',
  'level.polygons.7': 'קו ישר, עקום ושבור',
  'level.polygons.8': 'כמה צורות בציור?',
  'level.polygons.9': 'משלימים את החצי',
  'level.polygons.10': 'בונים משתי צורות',

  'topic.polygons2': 'מצולעים, זוויות ומדידה',
  'level.polygons2.1': 'זווית ישרה',
  'level.polygons2.2': 'כמה זוויות ישרות?',
  'level.polygons2.3': 'איזו זווית ישרה?',
  'level.polygons2.4': 'כל הצלעות שוות',
  'level.polygons2.5': 'היקף',
  'level.polygons2.6': 'מודדים בסרגל',
  'level.polygons2.7': 'שטח במשבצות',
  'level.polygons2.8': 'היקף במשבצות',
  'level.polygons2.9': 'איזה שטח גדול יותר?',
  'level.polygons2.10': 'בעיות היקף ושטח',

  // Grade 1, level 6: the square and the rectangle.
  'ex.poly1.quad.square.hint1': 'לריבוע יש ארבע צלעות, וכולן באותו אורך.',
  'ex.poly1.quad.rectangle.hint1': 'למלבן יש ארבע צלעות: שתיים ארוכות ושתיים קצרות.',
  'ex.poly1.quad.hint2': 'בריבוע ובמלבן כל ארבע הפינות הן כמו פינה של דף.',
  'ex.poly1.quad.rectangle.example': 'זה מלבן: יש לו שתי צלעות ארוכות ושתי צלעות קצרות.',
  'ex.poly1.quad.square.example': 'זה ריבוע: כל ארבע הצלעות שלו שוות.',

  // Level 7: straight, curved and broken lines.
  'ex.poly1.line.straight.prompt': 'איפה הקו הישר?',
  'ex.poly1.line.curved.prompt': 'איפה הקו העקום?',
  'ex.poly1.line.broken.prompt': 'איפה הקו השבור?',
  'ex.poly1.line.straight.hint1': 'קו ישר הולך ישר, כמו לאורך סרגל, בלי שום כיפוף.',
  'ex.poly1.line.curved.hint1': 'קו עקום מתעגל, כמו קשת או שביל מתפתל, ואין לו פינות.',
  'ex.poly1.line.broken.hint1': 'קו שבור בנוי מכמה קווים ישרים, ויש לו פינות.',
  'ex.poly1.line.hint2': 'נעביר אצבע על כל קו: האם הוא מתעגל? האם יש לו פינות?',
  'ex.poly1.line.straight.example': 'זה קו ישר: אין בו שום כיפוף.',
  'ex.poly1.line.curved.example': 'זה קו עקום: הוא מתעגל, בלי פינות.',
  'ex.poly1.line.broken.example': 'זה קו שבור: יש לו פינות.',
  'ex.poly1.line.solution': 'זה הקו ה{adj}.',

  // Level 8: shapes in a picture.
  'ex.poly1.count.tri.prompt': 'כמה משולשים יש בציור?',
  'ex.poly1.count.sq.prompt': 'כמה ריבועים יש בציור?',
  'ex.poly1.count.circle.prompt': 'כמה עיגולים יש בציור?',
  'ex.poly1.count.hint1': 'נחפש בציור את כל ה{kinds}, גם את הקטנים וגם את אלה שמסתתרים.',
  'ex.poly1.count.hint2': 'צבענו רק את ה{kinds}. עכשיו נספור אותם, כל אחד פעם אחת.',
  'ex.poly1.count.example': 'בציור הזה יש {r}.',
  'ex.poly1.count.solution': 'בציור יש {r}.',

  // Level 9: the half that completes the shape.
  'ex.poly1.half.prompt': 'איזה חצי משלים את הצורה?',
  'ex.poly1.half.right': 'החצי במראה',
  'ex.poly1.half.same': 'אותו חצי, לא הפוך',
  'ex.poly1.half.other': 'חצי של צורה אחרת',
  'ex.poly1.half.hint1': 'החצי השני הוא כמו תמונה במראה: אותה צורה, הפוכה לצד השני של הקו.',
  'ex.poly1.half.hint2':
    'נדמיין שמקפלים את הדף על הקו המקווקו: החצי השני צריך לשבת בדיוק על החצי הראשון.',
  'ex.poly1.half.example': 'כך נראית צורה שלמה: שני החצאים שלה שווים, כמו במראה.',
  'ex.poly1.half.solution': 'זה החצי שמשלים את הצורה, כמו במראה.',

  // Level 10: a shape built of two shapes.
  'ex.poly1.build.prompt': 'מאילו שתי צורות בונים את הצורה הזאת?',
  'ex.poly1.build.pair.twoTri': 'שני משולשים',
  'ex.poly1.build.pair.twoRect': 'שני מלבנים',
  'ex.poly1.build.pair.twoSq': 'שני ריבועים',
  'ex.poly1.build.pair.sqTri': 'ריבוע ומשולש',
  'ex.poly1.build.pair.twoThin': 'שני משולשים צרים',
  'ex.poly1.build.pair.rectTri': 'מלבן ומשולש',
  'ex.poly1.build.hint1': {
    f: 'דמייני שגוזרים את הצורה בקו ישר אחד. אילו שני חלקים יוצאים?',
    m: 'דמיין שגוזרים את הצורה בקו ישר אחד. אילו שני חלקים יוצאים?',
  },
  'ex.poly1.build.hint2': 'נבדוק כל זוג: אם נחבר את שני החלקים, האם תצא בדיוק הצורה הזאת?',
  'ex.poly1.build.example.wideRect': 'את המלבן הזה בונים משני ריבועים.',
  'ex.poly1.build.example.square': 'את הריבוע הזה בונים משני משולשים.',
  'ex.poly1.build.solution': 'בונים אותה מ{pair}.',

  // Grade 2, level 6: measuring with a ruler.
  'ex.poly2.ruler.prompt': 'כמה סנטימטרים אורך העיפרון?',
  'ex.poly2.ruler.hint1': 'נראה על הסרגל איפה העיפרון מתחיל ואיפה הוא נגמר.',
  'ex.poly2.ruler.hint2':
    'מקו ארוך אחד לקו הארוך הבא יש סנטימטר אחד. נספור כמה סנטימטרים יש מתחילת העיפרון ועד סופו.',
  'ex.poly2.ruler.example': 'העיפרון הזה מתחיל במספר {a} ונגמר במספר {b}, ולכן האורך שלו {r}.',
  'ex.poly2.ruler.solution0': 'העיפרון באורך {r}.',
  'ex.poly2.ruler.solution': 'העיפרון מתחיל במספר {a} ונגמר במספר {b}, ולכן האורך שלו {r}.',
  'ex.poly2.ruler.advice': 'זה המספר שבו העיפרון נגמר. אבל הוא מתחיל במספר {a}, לא באפס.',

  // Level 7: area by counting squares.
  'ex.poly2.area.prompt': 'מה השטח של הצורה, במשבצות?',
  'ex.poly2.area.hint1': 'השטח הוא כמה משבצות הצורה מכסה.',
  'ex.poly2.area.hint2': 'נספור את המשבצות שורה אחרי שורה, ונחבר.',
  'ex.poly2.area.solution': 'השטח הוא {r}.',

  // Level 8: perimeter on squared paper.
  'ex.poly2.pgrid.prompt': 'מה ההיקף של הצורה? כל צלע של משבצת היא יחידה אחת.',
  'ex.poly2.pgrid.hint1': 'ההיקף הוא הדרך מסביב לצורה. נספור את הצלעות הקטנות שעל הקו שמסביב.',
  'ex.poly2.pgrid.hint2': 'נתחיל בפינה אחת, נלך מסביב ונספור כל צלע קטנה, עד שנחזור לפינה.',
  'ex.poly2.pgrid.solution': 'ההיקף הוא {r}.',
  'ex.poly2.pgrid.advice': 'זה מספר המשבצות, כלומר השטח. בהיקף סופרים את הצלעות שמסביב לצורה.',

  // Level 9: which area is larger, which smaller.
  'ex.poly2.cmp.more.prompt': 'לאיזו צורה יש שטח גדול יותר?',
  'ex.poly2.cmp.less.prompt': 'לאיזו צורה יש שטח קטן יותר?',
  'ex.poly2.cmp.label': 'צורה של {n} משבצות',
  'ex.poly2.cmp.hint1': 'השטח הוא כמה משבצות הצורה מכסה, ולא כמה היא ארוכה.',
  'ex.poly2.cmp.hint2': 'נספור את המשבצות בכל צורה לחוד, ונשווה.',
  'ex.poly2.cmp.example':
    'בשורה יש שש משבצות ובריבוע תשע, ולכן לריבוע שטח גדול יותר, אף שהשורה ארוכה יותר.',
  'ex.poly2.cmp.more.solution': 'לצורה הזאת שטח גדול יותר: {a}, ולשנייה רק {b}.',
  'ex.poly2.cmp.less.solution': 'לצורה הזאת שטח קטן יותר: {a}, ולשנייה {b}.',

  // Level 10: perimeter and area problems.
  'ex.poly2.prob.fence.prompt':
    'לגינה יש צורה של מלבן: האורך שלה {a} והרוחב שלה {b}. כמה מטרים של גדר צריך כדי להקיף את כל הגינה?',
  'ex.poly2.prob.fence.hint1':
    'הגדר הולכת מסביב לגינה, וזה ההיקף. למלבן יש שתי צלעות ארוכות ושתי צלעות קצרות.',
  'ex.poly2.prob.frame.prompt':
    'לתמונה יש צורה של ריבוע, וכל צלע שלה {a}. כמה סנטימטרים של סרט צריך כדי להקיף את התמונה?',
  'ex.poly2.prob.frame.hint1': 'הסרט הולך מסביב לתמונה, וזה ההיקף. לריבוע יש ארבע צלעות שוות.',
  'ex.poly2.prob.hint2': 'נחבר את כל הצלעות:',
  'ex.poly2.prob.adviceHalf': 'זה רק חצי מהדרך מסביב. צריך לחבר את כל ארבע הצלעות.',
  'ex.poly2.prob.adviceOne': 'זו רק צלע אחת. מסביב לריבוע יש ארבע צלעות.',
  'ex.poly2.prob.tiles.prompt':
    'הרצפה במטבח מכוסה ב{rows} של מרצפות, ובכל שורה {cols}. מה השטח של הרצפה, במרצפות?',
  'ex.poly2.prob.tiles.hint1': 'השטח הוא כמה מרצפות מכסות את הרצפה.',
  'ex.poly2.prob.tiles.hint2': 'בכל שורה יש {cols}. נחבר את השורות, אחת אחרי השנייה.',
  'ex.poly2.prob.tiles.example': 'ב{rows} של {cols} יש {r}.',
  'ex.poly2.prob.tiles.solution': 'ברצפה יש {r}, וזה השטח שלה.',
  'ex.poly2.prob.tiles.advice':
    'זה מספר השורות ועוד מספר המרצפות בשורה אחת. צריך לספור את כל המרצפות, בכל השורות.',
} as const;
