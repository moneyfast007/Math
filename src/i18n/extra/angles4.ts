/**
 * Hebrew texts for the angles worlds (merged into `he`): the four new grade 3
 * levels of "angles" (`ex.ang3.*`), and grade 4's own world "angles-4"
 * (`ex.a4.*`), which also reuses the `ex.angles.*` texts of the levels it took over.
 */
export const heAngles4 = {
  // Grade 3, level 7: the angle between the hands of a clock.
  'ex.ang3.clock.prompt': 'איזו זווית יש בין שני המחוגים?',
  'ex.ang3.clock.hint1': 'מסתכלים רק על שני המחוגים, ומשווים את הזווית שביניהם לפינה של דף.',
  'ex.ang3.clock.exRight': 'בשעה שלוש בדיוק יש בין המחוגים זווית ישרה.',
  'ex.ang3.clock.exAcute': 'בשעה אחת בדיוק יש בין המחוגים זווית חדה.',
  'ex.ang3.clock.acute': 'בין המחוגים יש זווית חדה: היא סגורה יותר מפינה של דף.',
  'ex.ang3.clock.right': 'בין המחוגים יש זווית ישרה: בדיוק כמו פינה של דף.',
  'ex.ang3.clock.obtuse': 'בין המחוגים יש זווית קהה: היא פתוחה יותר מפינה של דף.',
  'ex.ang3.clock.check': 'נניח פינה של דף בין שני המחוגים ונבדוק.',

  // Grade 3, level 8: the marked angle of a shape.
  'ex.ang3.corner.prompt': 'איזו זווית מסומנת בצורה?',
  'ex.ang3.corner.hint1': 'מסתכלים רק על הפינה שיש בה קשת, ומשווים אותה לפינה של דף.',
  'ex.ang3.corner.exRight': 'בכל פינה של מלבן יש זווית ישרה.',
  'ex.ang3.corner.exAcute': 'במשולש שווה צלעות כל הזוויות חדות.',
  'ex.ang3.corner.check': 'נניח פינה של דף על הפינה המסומנת ונבדוק.',

  // Grade 3, level 9: a square, a rectangle, a rhombus — true or false?
  'ex.ang3.props.sides': 'ב{name} הזה כל ארבע הצלעות שוות.',
  'ex.ang3.props.rights': 'ב{name} הזה יש ארבע זוויות ישרות.',
  'ex.ang3.props.parallel': 'ב{name} הזה יש שני זוגות של צלעות מקבילות.',
  'ex.ang3.props.opposite': 'ב{name} הזה הצלעות שמול זו את זו שוות.',
  'ex.ang3.props.oneRight': 'ב{name} הזה יש רק זווית ישרה אחת.',
  'ex.ang3.props.noRight': 'ב{name} הזה אין אף זווית ישרה.',
  'ex.ang3.props.hint1':
    'מסתכלים על הסימנים בציור: צלעות עם אותו סימן שוות, וריבוע קטן בפינה הוא זווית ישרה.',
  'ex.ang3.props.hint2': 'בודקים את המשפט על הצורה שבציור: כל צלע וכל פינה.',
  'ex.ang3.props.yes': 'נכון! רואים את זה בציור.',
  'ex.ang3.props.w.sides': 'לא נכון: יש בו שתי צלעות ארוכות ושתי צלעות קצרות.',
  'ex.ang3.props.w.fourRights': 'לא נכון: יש בו ארבע זוויות ישרות.',
  'ex.ang3.props.w.noRights': 'לא נכון: אין בו אף זווית ישרה, רק זוויות חדות וזוויות קהות.',

  // Grade 3, level 10: is the dashed line a line of symmetry?
  'ex.ang3.sym.prompt': 'האם הקו המקווקו הוא קו סימטריה?',
  'ex.ang3.yes': 'כן',
  'ex.ang3.no': 'לא',
  'ex.ang3.sym.exampleRect': 'במלבן, הקו שעובר באמצע, מלמעלה למטה, הוא קו סימטריה.',
  'ex.ang3.sym.yesWhy': 'כן: אם מקפלים לאורך הקו, שני החצאים מתלכדים בדיוק.',
  'ex.ang3.sym.noWhy': 'לא: אם מקפלים לאורך הקו, שני החצאים לא מתלכדים.',

  // Grade 4: the world.
  'topic.angles4': 'זוויות, משולשים ומרובעים',
  'level.angles4.1': 'סוגי זוויות במעלות',
  'level.angles4.2': 'כמה מעלות בערך?',
  'level.angles4.3': 'זווית חסרה',
  'level.angles4.4': 'משולשים: זוויות וצלעות',
  'level.angles4.5': 'סכום הזוויות במשולש',
  'level.angles4.6': 'זוויות במרובע',
  'level.angles4.7': 'אלכסונים',
  'level.angles4.8': 'מקבילית, טרפז ומעוין',
  'level.angles4.9': 'קווי סימטריה',
  'level.angles4.10': 'נכון או לא נכון?',

  // Level 1: the kind of an angle by its degrees.
  'ex.a4.kind.prompt': 'איזו זווית זאת?',
  'ex.a4.kind.spoken': 'זווית של {d}. איזו זווית זאת?',
  'ex.a4.kind.hint1': 'בזווית ישרה יש תשעים מעלות, ובזווית שטוחה מאה ושמונים מעלות.',
  'ex.a4.kind.hint2': 'פחות מתשעים מעלות: זווית חדה. בין תשעים למאה ושמונים: זווית קהה.',
  'ex.a4.kind.exObtuse': 'זווית של מאה ועשרים מעלות היא זווית קהה.',
  'ex.a4.kind.exAcute': 'זווית של ארבעים מעלות היא זווית חדה.',
  'ex.a4.kind.acute': '{d} זה פחות מתשעים מעלות, אז זאת זווית חדה.',
  'ex.a4.kind.right': 'תשעים מעלות בדיוק: זאת זווית ישרה.',
  'ex.a4.kind.obtuse': '{d} זה יותר מתשעים ופחות ממאה ושמונים, אז זאת זווית קהה.',
  'ex.a4.kind.straight': 'מאה ושמונים מעלות: זאת זווית שטוחה, כמו קו ישר.',
  'ex.a4.kind.adv.acute': 'בזווית חדה יש פחות מתשעים מעלות.',
  'ex.a4.kind.adv.right': 'בזווית ישרה יש תשעים מעלות בדיוק.',
  'ex.a4.kind.adv.obtuse': 'בזווית קהה יש יותר מתשעים מעלות ופחות ממאה ושמונים.',
  'ex.a4.kind.adv.straight': 'בזווית שטוחה יש מאה ושמונים מעלות בדיוק.',
  'ex.a4.kind.check': 'נבדוק שוב את המספר, ונשווה אותו לתשעים ולמאה ושמונים.',

  // Level 2: about how many degrees?
  'ex.a4.measure.prompt': 'בערך כמה מעלות יש בזווית?',
  'ex.a4.measure.hint1': 'משווים לפינה של דף: בזווית ישרה יש תשעים מעלות.',
  'ex.a4.measure.hint2':
    'חצי מזווית ישרה זה ארבעים וחמש מעלות. זווית פתוחה יותר מפינה של דף היא יותר מתשעים.',
  'ex.a4.measure.ex90': 'בזווית הזאת יש תשעים מעלות: היא בדיוק כמו פינה של דף.',
  'ex.a4.measure.ex45': 'בזווית הזאת יש ארבעים וחמש מעלות: חצי מפינה של דף.',
  'ex.a4.measure.solution': 'בזווית יש בערך {d}.',
  'ex.a4.measure.less': 'זווית של {v} סגורה יותר מהזווית שבציור.',
  'ex.a4.measure.more': 'זווית של {v} פתוחה יותר מהזווית שבציור.',

  // Level 3: the missing part of a right or a straight angle.
  'ex.a4.split.prompt90': 'כל הזווית היא זווית ישרה. כמה מעלות יש בחלק שמסומן בסימן שאלה?',
  'ex.a4.split.prompt180': 'כל הזווית היא זווית שטוחה. כמה מעלות יש בחלק שמסומן בסימן שאלה?',
  'ex.a4.split.spoken90':
    'כל הזווית היא זווית ישרה, של תשעים מעלות. בחלק אחד יש {a}. כמה מעלות יש בחלק השני?',
  'ex.a4.split.spoken180':
    'כל הזווית היא זווית שטוחה, של מאה ושמונים מעלות. בחלק אחד יש {a}. כמה מעלות יש בחלק השני?',
  'ex.a4.split.hint90': 'שני החלקים ביחד הם זווית ישרה: תשעים מעלות.',
  'ex.a4.split.hint180': 'שני החלקים ביחד הם קו ישר: מאה ושמונים מעלות.',
  'ex.a4.split.hint2': 'מורידים מהזווית כולה את החלק שידוע:',
  'ex.a4.split.solution': '{t} פחות {a} זה {c}.',

  // Level 4: triangles by their angles and their sides together.
  'ex.a4.both.prompt': 'איזה משולש זה? לפי הזוויות וגם לפי הצלעות.',
  'ex.a4.both.hint1': 'קודם מחפשים את הזווית הגדולה ביותר: היא חדה, ישרה או קהה?',
  'ex.a4.both.hint2': 'אחר כך מחפשים זוויות שוות: מול זוויות שוות יש צלעות שוות.',
  'ex.a4.both.exRight':
    'במשולש הזה יש זווית ישרה ושתי זוויות שוות, לכן הוא ישר זווית ושווה שוקיים.',
  'ex.a4.both.exObtuse':
    'במשולש הזה יש זווית קהה, וכל הזוויות שונות, לכן הוא קהה זווית ושונה צלעות.',
  'ex.a4.both.solution': 'זה משולש {name}.',
  'ex.a4.both.sideCheck': 'נסתכל על הזוויות ועל הסימנים: כמה זוויות שוות יש?',

  // Level 6: the angles of a quadrilateral.
  'ex.a4.quad.prompt': 'כמה מעלות יש בזווית החסרה?',
  'ex.a4.quad.spoken':
    'במרובע יש זווית של {a}, זווית של {b} וזווית של {c}. כמה מעלות יש בזווית הרביעית?',
  'ex.a4.quad.hint1': 'סכום הזוויות בכל מרובע הוא שלוש מאות ושישים מעלות.',
  'ex.a4.quad.hint2': 'מורידים משלוש מאות ושישים את שלוש הזוויות שידועות:',
  'ex.a4.quad.solution': 'שלוש מאות ושישים פחות {a} פחות {b} פחות {c} זה {d}.',

  // Level 8: what is true of every parallelogram, trapezoid, rhombus.
  'ex.a4.prop.prompt.parallelogram': 'מה נכון בכל מקבילית?',
  'ex.a4.prop.prompt.trapezoid': 'מה נכון בכל טרפז?',
  'ex.a4.prop.prompt.rhombus': 'מה נכון בכל מעוין?',
  'ex.a4.prop.p.twoPairs': 'יש שני זוגות של צלעות מקבילות',
  'ex.a4.prop.p.onePair': 'יש בדיוק זוג אחד של צלעות מקבילות',
  'ex.a4.prop.p.oppSides': 'הצלעות שמול זו את זו שוות',
  'ex.a4.prop.p.oppAngles': 'הזוויות שמול זו את זו שוות',
  'ex.a4.prop.p.allSides': 'כל ארבע הצלעות שוות',
  'ex.a4.prop.p.fourRight': 'יש ארבע זוויות ישרות',
  'ex.a4.prop.p.diagPerp': 'האלכסונים מאונכים זה לזה',
  'ex.a4.prop.p.noParallel': 'אין אף זוג של צלעות מקבילות',
  'ex.a4.prop.hint1': 'חושבים על כל הצורות מהסוג הזה, לא רק על זו שבציור.',
  'ex.a4.prop.hint2': 'מספיקה צורה אחת שהמשפט לא נכון בה, וכבר הוא לא נכון בכולן.',
  'ex.a4.prop.solution': 'בכל {name} {prop}.',
  'ex.a4.prop.adv': 'המשפט "{prop}" לא נכון בכל {name}. נבדוק שוב בציור ובסימנים.',
} as const;
