import { shown } from '@/lang/compose';
import type { Gender } from '@/lang/gender';
import type { Noun } from '@/lang/hebrewNumbers';
import { t, type TranslationKey } from '@/i18n';
import {
  closed,
  defineTopic,
  exercise,
  hint,
  pictureChoices,
  pictureExample,
  range,
  say,
  type Said,
  windowChoices,
} from '../build';
import { shuffle } from '../rng';
import type {
  Exercise,
  Hint,
  Rng,
  ShapeColor,
  ShapeKind,
  SolidItem,
  SolidKind,
  Visual,
} from '../types';

/**
 * World 9, gan hova: "גופים". The ball, the cube and the cylinder, then the cone
 * and the box; a solid or a flat shape; what rolls and what does not; which
 * solid an everyday thing looks like; what can be stacked and what cannot;
 * counting the cubes of a small building; the odd one out. Most sentences are
 * grade 1's (its world "גופים"), so they are recorded already; every answer is
 * a picture or a small number.
 */

const ID = 'solids-0';
const L = (n: number) => `level.solids0.${n}`;

type Kind = SolidKind | ShapeKind;

const NAME: Record<Kind, string> = {
  cube: 'קובייה',
  box: 'תיבה',
  sphere: 'כדור',
  cylinder: 'גליל',
  cone: 'חרוט',
  pyramid: 'פירמידה',
  pyramid3: 'פירמידה',
  circle: 'עיגול',
  square: 'ריבוע',
  triangle: 'משולש',
  rectangle: 'מלבן',
};
const FEMININE: readonly Kind[] = ['cube', 'box', 'pyramid', 'pyramid3'];
const isF = (k: Kind) => FEMININE.includes(k);

const ABOUT: Partial<Record<Kind, TranslationKey>> = {
  cube: 'ex.solids.about.cube',
  box: 'ex.solids.about.box',
  sphere: 'ex.solids.about.sphere',
  cylinder: 'ex.solids.about.cylinder',
  cone: 'ex.solids.about.cone',
  pyramid: 'ex.solids.about.pyramid',
};

const COLORS: readonly ShapeColor[] = ['blue', 'red', 'green', 'yellow'];
const colorAt = (i: number): ShapeColor => COLORS[i % COLORS.length] as ShapeColor;

const CUBE_NOUN: Noun = { singular: 'קובייה', plural: 'קוביות', gender: 'f' };

const solid = (kind: Kind, color: ShapeColor, extra: Partial<SolidItem> = {}): SolidItem => ({
  kind,
  color,
  ...extra,
});
const one = (item: SolidItem): Visual => ({ type: 'solids', items: [item] });

const thisSaid = (k: Kind): Said =>
  say(isF(k) ? 'ex.solids.thisF' : 'ex.solids.thisM', { name: NAME[k] });

/* ---------- Picture choices ---------- */

/** The options in a random order; the first one given is the right one. */
function pictureExercise(o: {
  level: number;
  factId: string;
  spoken: Said;
  options: SolidItem[];
  hints: [Hint, Hint, Hint];
  solution: Said;
  rng: Rng;
  visual?: Visual;
  /** Names of the buttons, when not the solids' own (things). */
  labels?: string[];
}): Exercise {
  const order = shuffle(
    o.rng,
    o.options.map((_, i) => i),
  );
  const labels = o.labels ?? o.options.map((x) => NAME[x.kind]);
  return exercise({
    factId: o.factId,
    topicId: ID,
    level: o.level,
    prompt: shown(o.spoken),
    display: '',
    spoken: o.spoken,
    ...(o.visual ? { visual: o.visual } : {}),
    answer: order.indexOf(0),
    input: pictureChoices(
      order.map((i) => labels[i] as string),
      order.map((i) => one(o.options[i] as SolidItem)),
    ),
    hints: o.hints,
    solution: o.solution,
  });
}

/** Hint 3 of the naming levels: a model of the solid, in another colour, titled so. */
function modelHint(k: Kind, color: ShapeColor): Hint {
  return {
    ...pictureExample(thisSaid(k), one(solid(k, color))),
    text: t(isF(k) ? 'ex.solids.looksLikeF' : 'ex.solids.looksLikeM', {
      params: { name: NAME[k] },
    }),
  };
}

/* ---------- Levels 1–2: where is the …? ---------- */

type WhereFact = { target: SolidKind; others: SolidKind[]; v: number };

function where(level: 1 | 2) {
  return ({ target, others, v }: WhereFact, rng: Rng, gender: Gender): Exercise => {
    const options = [target, ...others].map((k, i) => solid(k, colorAt(v + i)));
    // Cube against a long box: what tells them apart is the length.
    const long = target === 'cube' && others.includes('box');
    return pictureExercise({
      level,
      factId: `where${level}:${target}:${others.join(',')}:${v}`,
      spoken: say('ex.solids.where', { name: NAME[target] }),
      options,
      hints: [
        hint(say(ABOUT[target] as TranslationKey)),
        hint(
          long
            ? say('ex.solids.where.hintLong')
            : say(level === 1 ? 'ex.solids.where.hint2' : 'ex.solids.where.hint2b', {}, gender),
        ),
        modelHint(target, colorAt(v + 3)),
      ],
      solution: thisSaid(target),
      rng,
    });
  };
}

const level1Facts = (): WhereFact[] =>
  (['cube', 'sphere', 'cylinder'] as SolidKind[]).flatMap((target) =>
    range(0, 3).map((v) => ({
      target,
      others: (['cube', 'sphere', 'cylinder'] as SolidKind[]).filter((k) => k !== target),
      v,
    })),
  );

/** Gan: the cone and the box (the pyramid waits for grade 1); never a cube beside the box. */
const GAN2: [SolidKind, SolidKind[]][] = [
  ['cone', ['sphere', 'cylinder']],
  ['cone', ['cube', 'cylinder']],
  ['cone', ['sphere', 'cube']],
  ['box', ['sphere', 'cylinder']],
  ['box', ['cone', 'sphere']],
  ['box', ['cylinder', 'cone']],
];

const level2Facts = (): WhereFact[] =>
  GAN2.flatMap(([target, others]) => [0, 1].map((v) => ({ target, others, v })));

/* ---------- Level 3: a solid or a flat shape? ---------- */

const PAIRS: [SolidKind, ShapeKind][] = [
  ['cube', 'square'],
  ['sphere', 'circle'],
  ['box', 'rectangle'],
  ['pyramid', 'triangle'],
];

type FlatFact = { pair: number; ask: 'solid' | 'flat'; k: 0 | 1 };

function flatOrSolid({ pair, ask, k }: FlatFact, rng: Rng): Exercise {
  const [s, f] = PAIRS[pair] as [SolidKind, ShapeKind];
  const other = PAIRS.filter((_, i) => i !== pair)[k] as [SolidKind, ShapeKind];
  // The twin has the solid's colour: the colour never tells them apart.
  const c = colorAt(pair);
  const options =
    ask === 'solid'
      ? [solid(s, c), solid(f, c), solid(other[1], colorAt(pair + 1))]
      : [solid(f, c), solid(s, c), solid(other[0], colorAt(pair + 1))];
  const asked: Kind = ask === 'solid' ? s : f;
  const [es, ef] = PAIRS[(pair + 1) % PAIRS.length] as [SolidKind, ShapeKind];
  return pictureExercise({
    level: 3,
    factId: `flat:${s}:${ask}:${k}`,
    spoken: say('ex.solids.where', { name: NAME[asked] }),
    options,
    hints: [
      hint(say('ex.solids.flat.hint1')),
      hint(say(`ex.solids.flat.pair.${s}` as TranslationKey)),
      pictureExample(say(`ex.solids.flat.ex.${es}` as TranslationKey), {
        type: 'solids',
        items: [solid(es, 'green'), solid(ef, 'green')],
      }),
    ],
    solution:
      ask === 'flat'
        ? say('ex.solids.flat.flat', { name: NAME[f] })
        : say(isF(s) ? 'ex.solids.flat.solidF' : 'ex.solids.flat.solidM', { name: NAME[s] }),
    rng,
  });
}

/* ---------- Levels 4, 5: what rolls, what does not? ---------- */

type RollFact = { ask: 'roll' | 'not'; answer: SolidKind; others: SolidKind[]; v: number };

const ROLLERS: SolidKind[] = ['sphere', 'cylinder'];
const SITTERS: SolidKind[] = ['cube', 'box', 'pyramid'];
const pairsOf = <T>(xs: readonly T[]): T[][] =>
  xs.flatMap((a, i) => xs.slice(i + 1).map((b) => [a, b]));

const rollFacts = (): RollFact[] => [
  ...ROLLERS.flatMap((answer) =>
    pairsOf(SITTERS).flatMap((others) =>
      [0, 1].map((v): RollFact => ({ ask: 'roll', answer, others, v })),
    ),
  ),
  ...SITTERS.flatMap((answer) =>
    [0, 1].map((v): RollFact => ({ ask: 'not', answer, others: ROLLERS, v })),
  ),
];

/** A solid that is not among the choices, for the worked example. */
const ROLL_EXAMPLE: Partial<Record<SolidKind, SolidKind>> = {
  sphere: 'cylinder',
  cylinder: 'sphere',
  cube: 'pyramid',
  box: 'cube',
  pyramid: 'box',
};

function roll({ ask, answer, others, v }: RollFact, rng: Rng, gender: Gender): Exercise {
  const item = (k: SolidKind, i: number) =>
    solid(k, colorAt(v + i), k === 'cylinder' ? { lying: true } : {});
  const ex = ROLL_EXAMPLE[answer] as SolidKind;
  return pictureExercise({
    level: ask === 'roll' ? 4 : 5,
    factId: `roll:${ask}:${answer}:${others.join(',')}:${v}`,
    spoken: say(ask === 'roll' ? 'ex.solids.roll.prompt' : 'ex.solids.roll.notPrompt'),
    options: [answer, ...others].map(item),
    hints: [
      hint(say('ex.solids.roll.hint1')),
      hint(say(ask === 'roll' ? 'ex.solids.roll.hint2' : 'ex.solids.roll.hint2not', {}, gender)),
      pictureExample(say(`ex.solids.roll.${ex}` as TranslationKey), one(item(ex, 3))),
    ],
    solution: say(`ex.solids.roll.${answer}` as TranslationKey),
    rng,
  });
}

/* ---------- Level 6: things from home ---------- */

interface Thing {
  emoji: string;
  /** "פחית", and with the article: "הפחית" ("קופסת מיץ", "קופסת המיץ"). */
  name: string;
  the: string;
  solid: SolidKind;
}

const thingOf = (emoji: string, name: string, solid: SolidKind, the = `ה${name}`): Thing => ({
  emoji,
  name,
  the,
  solid,
});

/**
 * Things whose Hebrew name does not hold the solid's name (no "כדורגל", no
 * "קוביית קרח", no "גליל נייר"), and that look like their solid in the emoji.
 */
const THINGS: readonly Thing[] = [
  thingOf('🍊', 'תפוז', 'sphere'),
  thingOf('🍈', 'מלון', 'sphere'),
  thingOf('🥫', 'פחית', 'cylinder'),
  thingOf('🕯️', 'נר', 'cylinder'),
  thingOf('🥁', 'תוף', 'cylinder'),
  thingOf('🧻', 'נייר טואלט', 'cylinder', 'נייר הטואלט'),
  thingOf('📦', 'קרטון', 'box'),
  thingOf('🧃', 'קופסת מיץ', 'box', 'קופסת המיץ'),
  thingOf('🍦', 'גביע', 'cone'),
  thingOf('🥕', 'גזר', 'cone'),
];

/** The wrong solids offered; never a cube beside a box (a cube is a box too). */
const THING_DISTRACTORS: Partial<Record<SolidKind, SolidKind[][]>> = {
  sphere: [
    ['cube', 'cone'],
    ['cylinder', 'pyramid'],
  ],
  cylinder: [
    ['sphere', 'box'],
    ['cone', 'cube'],
  ],
  box: [
    ['sphere', 'cylinder'],
    ['cone', 'pyramid'],
  ],
  cone: [
    ['pyramid', 'cylinder'],
    ['sphere', 'box'],
  ],
};

/** A thing that looks like another solid, for the worked example. */
const THING_EXAMPLE: Partial<Record<SolidKind, number>> = {
  sphere: 2,
  cylinder: 6,
  box: 0,
  cone: 3,
};

type ThingFact = { thing: number; k: 0 | 1 };

const thingSaid = (th: Thing): Said =>
  say('ex.solids.thing.solution', { thing: th.the, solid: NAME[th.solid] });

function thing({ thing: i, k }: ThingFact, rng: Rng, gender: Gender): Exercise {
  const th = THINGS[i] as Thing;
  const wrong = (THING_DISTRACTORS[th.solid] as SolidKind[][])[k] as SolidKind[];
  const ex = THINGS[THING_EXAMPLE[th.solid] as number] as Thing;
  return pictureExercise({
    level: 6,
    factId: `thing:${th.name}:${k}`,
    spoken: say('ex.solids.thing.prompt', { thing: th.the }),
    visual: { type: 'thing', emoji: th.emoji },
    options: [th.solid, ...wrong].map((s, j) => solid(s, colorAt(i + j))),
    hints: [
      hint(say('ex.solids.thing.hint1', { thing: th.name }, gender)),
      hint(say('ex.solids.thing.hint2')),
      pictureExample(thingSaid(ex), { type: 'thing', emoji: ex.emoji }),
    ],
    solution: thingSaid(th),
    rng,
  });
}

/* ---------- Level 9: building with cubes ---------- */

const BUILDINGS: number[][] = [
  [1, 2],
  [2, 1, 1],
  [3],
  [2, 2],
  [1, 3],
  [1, 1, 1, 1],
  [3, 1, 1],
  [2, 2, 1],
  [1, 3, 1],
  [2, 3],
  [1, 2, 3],
  [3, 2, 1],
  [2, 2, 2],
  [3, 3],
  [3, 1, 2],
  [1, 2, 2, 1],
  [2, 3, 2],
  [3, 3, 2],
];

const total = (cols: readonly number[]) => cols.reduce((s, x) => s + x, 0);

/** Gan: buildings of up to six cubes. */
const SMALL_BUILDINGS = BUILDINGS.filter((b) => total(b) <= 6);

function cubes(columns: number[], rng: Rng): Exercise {
  const n = total(columns);
  const ex = n === 5 ? [2, 2] : [2, 1, 2];
  return exercise({
    factId: `cubes:${columns.join('')}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.solids.cubes.prompt'),
    display: '',
    spoken: say('ex.solids.cubes.prompt'),
    visual: { type: 'cubeStack', columns },
    answer: n,
    input: { type: 'choices', choices: windowChoices(rng, range(1, 10), n) },
    hints: [
      hint(say('ex.solids.cubes.hint1')),
      hint(say('ex.solids.cubes.hint2')),
      pictureExample(say('ex.solids.cubes.solution', { n: { n: total(ex), noun: CUBE_NOUN } }), {
        type: 'cubeStack',
        columns: ex,
      }),
    ],
    solution: say('ex.solids.cubes.solution', { n: { n, noun: CUBE_NOUN } }),
    diagnose: (value) => (Math.abs(value - n) === 1 ? 'offByOne' : null),
  });
}

/* ---------- Levels 7, 8: what can be stacked, what cannot? ---------- */

const STACKABLE: SolidKind[] = ['cube', 'box', 'cylinder'];
const TIPPY: SolidKind[] = ['sphere', 'cone', 'pyramid'];
/** Another solid of the same answer, never among the choices. */
const STACK_EXAMPLE: Partial<Record<SolidKind, SolidKind>> = {
  cube: 'box',
  box: 'cylinder',
  cylinder: 'cube',
  sphere: 'cone',
  cone: 'pyramid',
  pyramid: 'sphere',
};

type StackFact = { ask: 'stack' | 'not'; answer: SolidKind; others: SolidKind[] };

const stackFacts = (): StackFact[] => [
  ...STACKABLE.flatMap((answer) =>
    pairsOf(TIPPY).map((others): StackFact => ({ ask: 'stack', answer, others })),
  ),
  ...TIPPY.flatMap((answer) =>
    pairsOf(STACKABLE).map((others): StackFact => ({ ask: 'not', answer, others })),
  ),
];

function stack({ ask, answer, others }: StackFact, rng: Rng, gender: Gender): Exercise {
  const ex = STACK_EXAMPLE[answer] as SolidKind;
  const seed = STACKABLE.indexOf(answer) + TIPPY.indexOf(answer) + others.length;
  return pictureExercise({
    level: ask === 'stack' ? 7 : 8,
    factId: `stack:${ask}:${answer}:${others.join(',')}`,
    spoken: say(ask === 'stack' ? 'ex.solids.stack.prompt' : 'ex.solids.stack.notPrompt'),
    options: [answer, ...others].map((k, i) => solid(k, colorAt(seed + i))),
    hints: [
      hint(say('ex.solids.stack.hint1')),
      hint(say('ex.solids.stack.hint2', {}, gender)),
      pictureExample(
        say(`ex.solids.stack.${ex}` as TranslationKey),
        ask === 'stack'
          ? { type: 'solids', items: [solid(ex, 'green'), solid(ex, 'blue')], stacked: true }
          : one(solid(ex, 'green')),
      ),
    ],
    solution: say(`ex.solids.stack.${answer}` as TranslationKey),
    rng,
  });
}

/* ---------- Level 10: the odd one out ---------- */

const ODD_KINDS: SolidKind[] = ['sphere', 'cube', 'cylinder', 'cone'];

/** For the buttons' names (two alike differ only by colour). */
const COLOR_NAME: Record<ShapeColor, { m: string; f: string }> = {
  blue: { m: 'כחול', f: 'כחולה' },
  red: { m: 'אדום', f: 'אדומה' },
  green: { m: 'ירוק', f: 'ירוקה' },
  yellow: { m: 'צהוב', f: 'צהובה' },
};

type OddFact = { odd: SolidKind; same: SolidKind };

const oddFacts = (): OddFact[] =>
  ODD_KINDS.flatMap((odd) => ODD_KINDS.filter((k) => k !== odd).map((same) => ({ odd, same })));

function oddOne({ odd, same }: OddFact, rng: Rng): Exercise {
  const seed = ODD_KINDS.indexOf(odd) * 3 + ODD_KINDS.indexOf(same);
  // The two alike in different colours, the odd one in a colour of theirs: colour tells nothing.
  const options = [
    solid(odd, colorAt(seed)),
    solid(same, colorAt(seed + 1)),
    solid(same, colorAt(seed)),
  ];
  const ex = ODD_KINDS.find((k) => k !== odd && k !== same) as SolidKind;
  const exSame = ODD_KINDS.find((k) => k !== odd && k !== same && k !== ex) as SolidKind;
  return pictureExercise({
    level: 10,
    factId: `odd:${odd}:${same}`,
    spoken: say('ex.s0.odd.prompt'),
    options,
    labels: options.map((o) => `${NAME[o.kind]} ${COLOR_NAME[o.color][isF(o.kind) ? 'f' : 'm']}`),
    hints: [
      hint(say('ex.s0.odd.hint1')),
      hint(say('ex.s0.odd.hint2')),
      pictureExample(say('ex.s0.odd.solution', { name: NAME[ex] }), {
        type: 'solids',
        items: [solid(exSame, 'green'), solid(ex, 'blue'), solid(exSame, 'red')],
      }),
    ],
    solution: say('ex.s0.odd.solution', { name: NAME[odd] }),
    rng,
  });
}

export const solids0 = defineTopic({
  id: ID,
  labelKey: 'topic.solids0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(L(1), level1Facts, where(1)),
    closed(L(2), level2Facts, where(2)),
    closed(
      L(3),
      () =>
        PAIRS.flatMap(([s], pair) =>
          (s === 'pyramid' ? [] : (['solid', 'flat'] as const)).flatMap((ask) =>
            ([0, 1] as const).map((k): FlatFact => ({ pair, ask, k })),
          ),
        ),
      flatOrSolid,
    ),
    closed(L(4), () => rollFacts().filter((f) => f.ask === 'roll'), roll),
    closed(L(5), () => rollFacts().filter((f) => f.ask === 'not'), roll),
    closed(
      L(6),
      () => THINGS.flatMap((_, thing) => ([0, 1] as const).map((k) => ({ thing, k }))),
      thing,
    ),
    closed(L(7), () => stackFacts().filter((f) => f.ask === 'stack'), stack),
    closed(L(8), () => stackFacts().filter((f) => f.ask === 'not'), stack),
    closed(L(9), () => SMALL_BUILDINGS, cubes),
    closed(L(10), oddFacts, oddOne),
  ],
});
