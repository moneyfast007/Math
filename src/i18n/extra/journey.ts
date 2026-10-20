/**
 * Hebrew texts of the map of all worlds and of the journey's first-time
 * explainer (merged into `he`).
 *
 * `journey.*` texts are read aloud to the child (they go to the audio bank),
 * so they hold no digits: numbers come through `{slots}`. `worlds.*` and
 * `journeyBar.*` texts are only shown, for the child and for the parent next to her.
 */
export const heJourney = {
  'pageTitle.worlds': 'כל העולמות · פלוסי',

  // The first-time explainer, on the journey (and again from "איך זה עובד?")
  'journey.intro.title': { f: 'ברוכה הבאה למסע!', m: 'ברוך הבא למסע!' },
  'journey.intro.step1': 'בכל עולם יש שביל של תחנות. בכל תחנה מתרגלים קצת, ואז ממשיכים לתחנה הבאה.',
  'journey.intro.step2': 'בסוף השביל מחכה הכוכב: אתגר הסיום, עם תרגילים מכל התחנות.',
  'journey.intro.step3':
    'מצליחים באתגר הסיום, והעולם הבא נפתח. בכפתור "כל העולמות" רואים את כל העולמות לפי הסדר.',
  'journey.intro.ok': 'הבנתי!',

  // How many worlds are finished, read aloud on the map of worlds
  'journey.worlds.count': '{done} מתוך {total} עולמות הושלמו.',
  'journey.worlds.count.none': 'העולם הראשון כבר פתוח. יאללה!',
  'journey.worlds.count.all': {
    f: 'סיימת את כל העולמות! את אלופה!',
    m: 'סיימת את כל העולמות! אתה אלוף!',
  },

  // The journey's header and world row: only shown (the buttons keep their spoken
  // names, "האלבום" and "מי משחק?"), so they are not in the audio bank.
  'journeyBar.album': 'מדבקות',
  'journeyBar.children': 'ילדים',
  'journeyBar.stationsDone': 'נשאר אתגר אחד ועולם {next} נפתח',
  'journeyBar.stationsDoneLast': 'נשאר רק אתגר הסיום',
  'journeyBar.reward': 'מצליחים, ועולם {next} נפתח ⭐',
  'journeyBar.rewardLast': 'מצליחים, ומקבלים מדבקה ⭐',

  // The map of all worlds
  'worlds.open': 'כל העולמות',
  'worlds.title': 'כל העולמות',
  'worlds.intro': 'העולמות של {grade}, לפי הסדר. עולם חדש נפתח כשמסיימים את העולם שלפניו.',
  'worlds.how': 'איך זה עובד?',
  'worlds.list': 'העולמות לפי הסדר',
  'worlds.state.done': 'הושלם',
  'worlds.state.current': 'כאן עכשיו',
  'worlds.state.locked': 'עוד סגור',
  'worlds.stations': '{done} מתוך {total} תחנות',
  'worlds.stationsChallenge': '{total} מתוך {total} תחנות · נשאר אתגר הסיום',
  'worlds.locked': 'נפתח אחרי שמסיימים את "{name}"',
  'worlds.continue': 'להמשיך במסע',
} as const;
