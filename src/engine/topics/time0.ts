import { t, type TranslationKey } from '@/i18n';
import { closed, defineTopic, hint, pictureExample, say } from '../build';
import type { Exercise, Rng, SceneItem, Visual } from '../types';
import { pictureQuestion, spread, type PictureOption } from './ganKit';

/**
 * World 8, gan hova: "זמן וסדר". What comes first and what comes after, three
 * pictures that tell a story (which one is missing), morning, noon and night,
 * the seasons, what to wear when it is cold or hot, and what takes a long time.
 * Every answer is a picture; everything is said.
 */

const ID = 'time-0';
const L = (n: number) => `level.time0.${n}`;
const K = (k: string) => `ex.t0.${k}` as TranslationKey;
const A = (k: string) => `adv.t0.${k}` as TranslationKey;

/** A picture with the words that name it (in a sentence and on its button). */
interface Pic {
  emoji: string;
  name: string;
}
const p = (emoji: string, name: string): Pic => ({ emoji, name });

const iconOf = (emoji: string, size = 16): Visual => ({
  type: 'scene',
  w: 20,
  h: 20,
  icon: true,
  items: [{ emoji, x: 10, y: 10, size }],
});
const option = (x: Pic): PictureOption => ({ label: x.name, visual: iconOf(x.emoji) });

/** The `n`-th and the next one after it in a list, skipping `skip` (distractors that vary by fact). */
function twoOthers<T>(list: readonly T[], skip: (x: T) => boolean, n: number): [T, T] {
  const rest = list.filter((x) => !skip(x));
  return [rest[n % rest.length] as T, rest[(n + 1) % rest.length] as T];
}

/* ---------- 1, 2: two things in order ---------- */

/** First, then. */
const PAIRS: [Pic, Pic][] = [
  [p('🧦', 'גרב'), p('👟', 'נעל')],
  [p('🥚', 'ביצה'), p('🐣', 'אפרוח')],
  [p('🌰', 'בלוט'), p('🌳', 'עץ')],
  [p('🌱', 'נבט'), p('🌻', 'חמנייה')],
  [p('🐛', 'זחל'), p('🦋', 'פרפר')],
  [p('☁️', 'ענן'), p('🌧️', 'גשם')],
  [p('👶', 'תינוק'), p('🧒', 'ילד')],
  [p('🥣', 'בצק'), p('🎂', 'עוגה')],
];

type PairFact = { pair: number; firstSaid: boolean; ask: 'first' | 'then' };

const pairFacts = (ask: 'first' | 'then') => (): PairFact[] =>
  PAIRS.flatMap((_, pair) => [true, false].map((firstSaid) => ({ pair, firstSaid, ask })));

function order(level: number, f: PairFact, rng: Rng): Exercise {
  const [first, then] = PAIRS[f.pair] as [Pic, Pic];
  const [a, b] = f.firstSaid ? [first, then] : [then, first];
  const [win, lose] = f.ask === 'first' ? [first, then] : [then, first];
  const [exFirst, exThen] = PAIRS[(f.pair + 4) % PAIRS.length] as [Pic, Pic];
  const story = (x: Pic, y: Pic): Visual => ({
    type: 'scene',
    w: 60,
    h: 26,
    props: [{ kind: 'arrow', from: [38, 13], to: [24, 13] }],
    items: [
      { emoji: x.emoji, x: 48, y: 13, size: 16 },
      { emoji: y.emoji, x: 12, y: 13, size: 16 },
    ],
  });
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `pair:${f.pair}:${f.firstSaid ? 'f' : 't'}:${f.ask}`,
      spoken: say(K(`pair.${f.ask}.prompt`), { a: a.name, b: b.name }),
      options: [option(win), option(lose)],
      hints: [
        hint(say(K('pair.hint1'))),
        hint(say(K('pair.hint2'))),
        pictureExample(
          say(K('pair.solution'), { first: exFirst.name, then: exThen.name }),
          story(exFirst, exThen),
        ),
      ],
      solution: say(K('pair.solution'), { first: first.name, then: then.name }),
      advice: [{ option: 1, say: say(A('pair')) }],
    },
    rng,
  );
}

/* ---------- 3, 4, 5: three pictures that tell a story ---------- */

const STORIES: [Pic, Pic, Pic][] = [
  [p('🥚', 'ביצה'), p('🐣', 'אפרוח'), p('🐔', 'תרנגולת')],
  [p('🌰', 'בלוט'), p('🌱', 'נבט'), p('🌳', 'עץ')],
  [p('👶', 'תינוק'), p('🧒', 'ילד'), p('🧑', 'מבוגר')],
  [p('☁️', 'ענן'), p('🌧️', 'גשם'), p('🌈', 'קשת')],
  [p('🌾', 'קמח'), p('🥣', 'בצק'), p('🎂', 'עוגה')],
  [p('🌅', 'זריחה'), p('☀️', 'שמש בצהריים'), p('🌙', 'ירח')],
  [p('🛏️', 'מתעוררים'), p('🪥', 'מצחצחים שיניים'), p('🎒', 'הולכים לגן')],
];

const ALL_STORY_PICS: Pic[] = STORIES.flat();

type Place = 0 | 1 | 2;
const PLACE_KEY = ['first', 'middle', 'last'] as const;
type StoryFact = { story: number; v: number; gap: Place };

const storyFacts = (gap: Place) => (): StoryFact[] =>
  STORIES.flatMap((_, story) => [0, 1].map((v) => ({ story, v, gap })));

/** The story from the right, with an arrow; `gap`: the picture left empty. */
function storyRow(s: [Pic, Pic, Pic], gap: Place | null): Visual {
  const xs = spread(3, 90, 14);
  return {
    type: 'scene',
    w: 90,
    h: 30,
    props: [{ kind: 'arrow', from: [80, 5], to: [10, 5] }],
    items: s.map(
      (x, i): SceneItem =>
        i === gap
          ? { blank: true, x: xs[i] as number, y: 18, size: 14 }
          : { emoji: x.emoji, x: xs[i] as number, y: 18, size: 16 },
    ),
  };
}

function story(level: number, f: StoryFact, rng: Rng): Exercise {
  const s = STORIES[f.story] as [Pic, Pic, Pic];
  const right = s[f.gap];
  const [o1, o2] = twoOthers(
    ALL_STORY_PICS,
    (x) => s.includes(x) || x.name === right.name,
    f.story * 3 + f.v * 7,
  );
  const ex = STORIES[(f.story + 3) % STORIES.length] as [Pic, Pic, Pic];
  const told = (x: [Pic, Pic, Pic]) =>
    say(K('seq.solution'), { a: x[0].name, b: x[1].name, c: x[2].name });
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `story:${f.story}:${f.v}:${PLACE_KEY[f.gap]}`,
      spoken: say(K(`seq.${PLACE_KEY[f.gap]}.prompt`)),
      visual: storyRow(s, f.gap),
      options: [option(right), option(o1), option(o2)],
      hints: [
        hint(say(K('seq.hint1'))),
        hint(say(K('seq.hint2'))),
        pictureExample(told(ex), storyRow(ex, null)),
      ],
      solution: told(s),
      advice: [
        { option: 1, say: say(A('seq')) },
        { option: 2, say: say(A('seq')) },
      ],
    },
    rng,
  );
}

/* ---------- 6, 7: morning, noon and night ---------- */

type When = 'morning' | 'noon' | 'night';
const WHEN_ICON: Record<When, string> = { morning: '🌅', noon: '☀️', night: '🌙' };
const whenWord = (w: When) => t(K(`time.${w}`));
const whenOption = (w: When): PictureOption => ({
  label: whenWord(w),
  visual: iconOf(WHEN_ICON[w]),
});

/** Things that happen at one time of day: said after "מתי", and as the answer to "מה עושים". */
const ACTS: { pic: Pic; when: When; we: boolean }[] = [
  { pic: p('🛏️', 'ישנים'), when: 'night', we: true },
  { pic: p('⭐', 'מסתכלים על הכוכבים'), when: 'night', we: true },
  { pic: p('🦉', 'הינשוף ער'), when: 'night', we: false },
  { pic: p('🥣', 'אוכלים דייסה לפני הגן'), when: 'morning', we: true },
  { pic: p('🎒', 'הולכים לגן'), when: 'morning', we: true },
  { pic: p('🐓', 'התרנגול קורא קוקוריקו'), when: 'morning', we: false },
  { pic: p('🍝', 'אוכלים ארוחה חמה אחרי הגן'), when: 'noon', we: true },
  { pic: p('🏠', 'חוזרים הביתה מהגן'), when: 'noon', we: true },
];

const WHENS: When[] = ['morning', 'noon', 'night'];

function when(level: number, act: number, rng: Rng): Exercise {
  const a = ACTS[act] as (typeof ACTS)[number];
  const ex = ACTS[(act + 3) % ACTS.length] as (typeof ACTS)[number];
  const others = WHENS.filter((w) => w !== a.when);
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `when:${act}`,
      spoken: say(K('when.prompt'), { act: a.pic.name }),
      visual: iconOf(a.pic.emoji, 18),
      options: [whenOption(a.when), ...others.map(whenOption)] as [
        PictureOption,
        ...PictureOption[],
      ],
      hints: [
        hint(say(K('when.hint1'))),
        hint(say(K('when.hint2'))),
        pictureExample(
          say(K('when.solution'), { act: ex.pic.name, when: whenWord(ex.when) }),
          iconOf(ex.pic.emoji, 18),
        ),
      ],
      solution: say(K('when.solution'), { act: a.pic.name, when: whenWord(a.when) }),
      advice: others.map((_, i) => ({ option: i + 1, say: say(A('when')) })),
    },
    rng,
  );
}

type WhatFact = { act: number; v: number };

const whatFacts = (): WhatFact[] =>
  ACTS.flatMap((a, act) => (a.we ? [0, 1].map((v) => ({ act, v })) : []));

function what(level: number, f: WhatFact, rng: Rng): Exercise {
  const a = ACTS[f.act] as (typeof ACTS)[number];
  const pool = ACTS.filter((x) => x.we && x.when !== a.when);
  const [o1, o2] = twoOthers(pool, (x) => x.when === a.when, f.act + f.v * 3);
  const ex = ACTS.find((x) => x.we && x.when !== a.when && x !== o1 && x !== o2) ?? o1;
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `what:${f.act}:${f.v}`,
      spoken: say(K('what.prompt'), { when: whenWord(a.when) }),
      visual: iconOf(WHEN_ICON[a.when], 18),
      options: [option(a.pic), option(o1.pic), option(o2.pic)],
      hints: [
        hint(say(K('when.hint1'))),
        hint(say(K('when.hint2'))),
        pictureExample(
          say(K('what.solution'), { when: whenWord(ex.when), act: ex.pic.name }),
          iconOf(ex.pic.emoji, 18),
        ),
      ],
      solution: say(K('what.solution'), { when: whenWord(a.when), act: a.pic.name }),
      advice: [
        { option: 1, say: say(A('what')) },
        { option: 2, say: say(A('what')) },
      ],
    },
    rng,
  );
}

/* ---------- 8: the seasons ---------- */

type Season = 'winter' | 'spring' | 'summer' | 'autumn';
const SEASONS: Season[] = ['winter', 'spring', 'summer', 'autumn'];
/** The buttons' pictures: none of them is in a scene, so a scene is never matched by its look. */
const SEASON_ICON: Record<Season, string> = {
  winter: '☔',
  spring: '🌼',
  summer: '🌞',
  autumn: '🍂',
};

const SCENES: { season: Season; emoji: [string, string]; why: string }[] = [
  { season: 'winter', emoji: ['☃️', '❄️'], why: 'קר ויורד שלג' },
  { season: 'winter', emoji: ['🌧️', '🧥'], why: 'יורד גשם ולובשים מעיל' },
  { season: 'spring', emoji: ['🌷', '🦋'], why: 'פורחים פרחים ועפים פרפרים' },
  { season: 'spring', emoji: ['🌸', '🐝'], why: 'פורחים פרחים ויש דבורים' },
  { season: 'summer', emoji: ['🏖️', '🍦'], why: 'חם, הולכים לים ואוכלים גלידה' },
  { season: 'summer', emoji: ['🍉', '🕶️'], why: 'חם ואוכלים אבטיח' },
  { season: 'autumn', emoji: ['🍁', '🌰'], why: 'העלים נושרים ונופלים בלוטים' },
  { season: 'autumn', emoji: ['🍁', '🌬️'], why: 'נושבת רוח והעלים נושרים' },
];

const seasonWord = (s: Season) => t(K(`season.${s}`));
const seasonOption = (s: Season): PictureOption => ({
  label: seasonWord(s),
  visual: iconOf(SEASON_ICON[s]),
});
const seasonScene = (k: number): Visual => {
  const sc = SCENES[k] as (typeof SCENES)[number];
  return {
    type: 'scene',
    w: 60,
    h: 26,
    items: [
      { emoji: sc.emoji[0], x: 40, y: 13, size: 18 },
      { emoji: sc.emoji[1], x: 18, y: 13, size: 14 },
    ],
  };
};

function season(level: number, k: number, rng: Rng): Exercise {
  const sc = SCENES[k] as (typeof SCENES)[number];
  const exK = (k + 3) % SCENES.length;
  const ex = SCENES[exK] as (typeof SCENES)[number];
  const others = SEASONS.filter((s) => s !== sc.season);
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `season:${k}`,
      spoken: say(K('season.prompt')),
      visual: seasonScene(k),
      options: [seasonOption(sc.season), ...others.map(seasonOption)] as [
        PictureOption,
        ...PictureOption[],
      ],
      hints: [
        hint(say(K('season.hint1'))),
        hint(say(K('season.hint2'))),
        pictureExample(
          say(K('season.solution'), { s: seasonWord(ex.season), why: ex.why }),
          seasonScene(exK),
        ),
      ],
      solution: say(K('season.solution'), { s: seasonWord(sc.season), why: sc.why }),
      advice: others.map((_, i) => ({ option: i + 1, say: say(A('season')) })),
    },
    rng,
  );
}

/* ---------- 9: what to wear ---------- */

const COLD: Pic[] = [p('🧣', 'צעיף'), p('🧤', 'כפפות'), p('🧥', 'מעיל')];
const HOT: Pic[] = [p('🩳', 'מכנסיים קצרים'), p('👕', 'חולצה קצרה'), p('👗', 'שמלה קלה')];

type WearFact = { ask: 'cold' | 'hot'; right: number; v: number };

const wearFacts = (): WearFact[] =>
  (['cold', 'hot'] as const).flatMap((ask) =>
    [0, 1, 2].flatMap((right) => [0, 1].map((v) => ({ ask, right, v }))),
  );

function wear(level: number, f: WearFact, rng: Rng): Exercise {
  const [mine, theirs] = f.ask === 'cold' ? [COLD, HOT] : [HOT, COLD];
  const right = mine[f.right] as Pic;
  const [o1, o2] = twoOthers(theirs, () => false, f.right + f.v);
  const exAsk = f.ask === 'cold' ? 'hot' : 'cold';
  const ex = (exAsk === 'cold' ? COLD : HOT)[(f.right + 1) % 3] as Pic;
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `wear:${f.ask}:${f.right}:${f.v}`,
      spoken: say(K(`wear.${f.ask}.prompt`)),
      visual: iconOf(f.ask === 'cold' ? '🥶' : '🥵', 18),
      options: [option(right), option(o1), option(o2)],
      hints: [
        hint(say(K(`wear.${f.ask}.hint1`))),
        hint(say(K('wear.hint2'))),
        pictureExample(say(K(`wear.${exAsk}.solution`), { w: ex.name }), iconOf(ex.emoji, 18)),
      ],
      solution: say(K(`wear.${f.ask}.solution`), { w: right.name }),
      advice: [
        { option: 1, say: say(A(`wear.${f.ask}`)) },
        { option: 2, say: say(A(`wear.${f.ask}`)) },
      ],
    },
    rng,
  );
}

/* ---------- 10: a long time and a short time ---------- */

/** Long first. */
const DURATIONS: [Pic, Pic][] = [
  [p('🛏️', 'לישון כל הלילה'), p('👏', 'למחוא כף')],
  [p('🏠', 'לבנות בית'), p('🍬', 'לאכול סוכרייה')],
  [p('🌳', 'לגדל עץ'), p('🎈', 'לנפח בלון')],
  [p('✈️', 'לטוס לארץ רחוקה'), p('🚪', 'לפתוח דלת')],
  [p('🧩', 'להרכיב פאזל גדול'), p('👋', 'לנופף לשלום')],
];

type LongFact = { pair: number; longSaid: boolean; ask: 'more' | 'less' };

const longFacts = (): LongFact[] =>
  DURATIONS.flatMap((_, pair) =>
    [true, false].flatMap((longSaid) =>
      (['more', 'less'] as const).map((ask) => ({ pair, longSaid, ask })),
    ),
  );

function long(level: number, f: LongFact, rng: Rng): Exercise {
  const [lg, sh] = DURATIONS[f.pair] as [Pic, Pic];
  const [a, b] = f.longSaid ? [lg, sh] : [sh, lg];
  const [win, lose] = f.ask === 'more' ? [lg, sh] : [sh, lg];
  const [exL, exS] = DURATIONS[(f.pair + 2) % DURATIONS.length] as [Pic, Pic];
  const [exWin, exLose] = f.ask === 'more' ? [exL, exS] : [exS, exL];
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `long:${f.pair}:${f.longSaid ? 'l' : 's'}:${f.ask}`,
      spoken: say(K(`long.${f.ask}.prompt`), { a: a.name, b: b.name }),
      options: [option(win), option(lose)],
      hints: [
        hint(say(K('long.hint1'))),
        hint(say(K('long.hint2'))),
        pictureExample(say(K(`long.${f.ask}.solution`), { w: exWin.name, l: exLose.name }), {
          type: 'scene',
          w: 60,
          h: 26,
          items: [
            { emoji: exWin.emoji, x: 42, y: 13, size: 16 },
            { emoji: exLose.emoji, x: 18, y: 13, size: 16 },
          ],
        }),
      ],
      solution: say(K(`long.${f.ask}.solution`), { w: win.name, l: lose.name }),
      advice: [{ option: 1, say: say(A(`long.${f.ask}`)) }],
    },
    rng,
  );
}

export const time0 = defineTopic({
  id: ID,
  labelKey: 'topic.time0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(L(1), pairFacts('first'), (f, rng) => order(1, f, rng)),
    closed(L(2), pairFacts('then'), (f, rng) => order(2, f, rng)),
    closed(L(3), storyFacts(0), (f, rng) => story(3, f, rng)),
    closed(L(4), storyFacts(1), (f, rng) => story(4, f, rng)),
    closed(L(5), storyFacts(2), (f, rng) => story(5, f, rng)),
    closed(
      L(6),
      () => ACTS.map((_, i) => i),
      (k, rng) => when(6, k, rng),
    ),
    closed(L(7), whatFacts, (f, rng) => what(7, f, rng)),
    closed(
      L(8),
      () => SCENES.map((_, i) => i),
      (k, rng) => season(8, k, rng),
    ),
    closed(L(9), wearFacts, (f, rng) => wear(9, f, rng)),
    closed(L(10), longFacts, (f, rng) => long(10, f, rng)),
  ],
});
