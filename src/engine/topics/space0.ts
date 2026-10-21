import type { TranslationKey } from '@/i18n';
import {
  closed,
  defineTopic,
  exercise,
  hint,
  pictureExample,
  say,
  windowChoices,
  type Said,
} from '../build';
import { shown } from '@/lang/compose';
import type { Exercise, Rng, SceneItem, SceneProp, Visual } from '../types';
import {
  at,
  icon,
  pictureQuestion,
  spread,
  thing,
  thingOption,
  things,
  type PictureOption,
  type Thing,
  type ThingId,
} from './ganKit';

/**
 * World "מרחב ומיקום", gan hova. Words of place, each in a little scene: up and
 * down (shelves), inside and outside (a box), before and after in a queue, first,
 * last and in the middle, above, under and next to (a table), near and far,
 * right and left (the child's own right, facing the screen), second and third
 * (cars of a train), where a path leads, and what moved in a picture.
 *
 * Nothing to read: every question is spoken, every answer is a picture (or a
 * very small number). Every level is closed, so every sentence is recorded whole.
 * A queue or a train always goes right, the way a Hebrew reader looks first.
 */

const ID = 'space-0';
const L = (n: number) => `level.space0.${n}`;
const K = (key: string) => `ex.space0.${key}` as TranslationKey;

const SHELF_TOYS: ThingId[] = ['teddy', 'ball', 'car', 'duck', 'drum', 'book', 'robot', 'gift'];

/** The thing at place i, then the ones after it (three, never the same). */
const triple = <T>(pool: readonly T[], i: number, a: number, b: number): [T, T, T] => [
  pool[i % pool.length] as T,
  pool[(i + a) % pool.length] as T,
  pool[(i + b) % pool.length] as T,
];

/* ---------- Level 1: up and down (a cupboard with three shelves) ---------- */

type UpDownFact = { toys: [Thing, Thing, Thing]; ask: 'up' | 'down' };

/** Top, middle and bottom shelf: what stands on each. */
function cupboard(toys: readonly Thing[], arrow?: 'up' | 'down'): Visual {
  const top = 4;
  const h = 72;
  const board = (k: number) => top + (h * (k + 1)) / 3;
  const xs = [44, 56, 48];
  const items: SceneItem[] = toys.map((t, k) => at(t, xs[k] as number, board(k) - 9, 15));
  const props: SceneProp[] = [{ kind: 'shelves', x: 28, y: top, w: 44, h, n: 3 }];
  if (arrow)
    props.push({
      kind: 'arrow',
      from: [84, arrow === 'up' ? 68 : 10],
      to: [84, arrow === 'up' ? 10 : 68],
    });
  return { type: 'scene', w: 100, h: 80, items, props };
}

function upDown({ toys, ask }: UpDownFact, rng: Rng): Exercise {
  const [topToy, midToy, bottomToy] = toys;
  const right = ask === 'up' ? topToy : bottomToy;
  const other = ask === 'up' ? bottomToy : topToy;
  const solved = (t: Thing) => say(K(`updown.solution.${ask}`), { name: t.singular });
  const rest = things(SHELF_TOYS).filter((t) => !toys.includes(t));
  const ex = rest.slice(0, 3);
  return pictureQuestion(
    {
      topicId: ID,
      level: 1,
      factId: `updown:${toys.map((t) => t.id).join(',')}:${ask}`,
      spoken: say(K(`updown.${ask}`)),
      visual: cupboard(toys),
      options: [thingOption(right), thingOption(other), thingOption(midToy)],
      hints: [
        hint(say(K('updown.hint1'))),
        hint(say(K(`updown.hint2.${ask}`)), { visual: cupboard(toys, ask) }),
        pictureExample(solved(ask === 'up' ? (ex[0] as Thing) : (ex[2] as Thing)), cupboard(ex)),
      ],
      solution: solved(right),
      advice: [{ option: 1, say: say(K(`updown.adv.${ask}`)) }],
    },
    rng,
  );
}

/* ---------- Level 2: inside and outside (an open box) ---------- */

const BOX_THINGS: ThingId[] = ['cat', 'ball', 'teddy', 'duck', 'apple', 'dog', 'car', 'rabbit'];

type BoxFact = { trio: [Thing, Thing, Thing]; ask: 'in' | 'out'; flip: boolean };

/** `inside` stand between the box's walls, `outside` beside it. */
function boxScene(inside: Thing[], outside: Thing[], flip: boolean): Visual {
  const inX = inside.length === 1 ? [50] : [42, 58];
  const outX = outside.length === 1 ? [flip ? 15 : 85] : [85, 15];
  return {
    type: 'scene',
    w: 100,
    h: 60,
    props: [
      { kind: 'floor', y: 54 },
      { kind: 'box', x: 30, y: 24, w: 40, h: 30 },
    ],
    items: [
      ...inside.map((t, i) => at(t, inX[i] as number, 44, 14)),
      ...outside.map((t, i) => at(t, outX[i] as number, 46, 14)),
    ],
  };
}

function inOut({ trio, ask, flip }: BoxFact, rng: Rng): Exercise {
  const [right, a, b] = trio;
  const scene = ask === 'in' ? boxScene([right], [a, b], flip) : boxScene([a, b], [right], flip);
  const others = things(BOX_THINGS).filter((t) => !trio.includes(t));
  const [e1, e2, e3] = others as [Thing, Thing, Thing];
  const exScene = ask === 'in' ? boxScene([e1], [e2, e3], !flip) : boxScene([e2, e3], [e1], !flip);
  return pictureQuestion(
    {
      topicId: ID,
      level: 2,
      factId: `inout:${trio.map((t) => t.id).join(',')}:${ask}`,
      spoken: say(K(`box.${ask}`)),
      visual: scene,
      options: [thingOption(right), thingOption(a), thingOption(b)],
      hints: [
        hint(say(K('box.hint1'))),
        hint(say(K(`box.hint2.${ask}`))),
        pictureExample(say(K(`box.example.${ask}`), { name: e1.singular }), exScene),
      ],
      solution: say(K(`box.solution.${ask}`), { name: right.singular }),
      advice: [1, 2].map((option) => ({
        option,
        say: say(K(`box.adv.${ask}`), { name: (option === 1 ? a : b).singular }),
      })),
    },
    rng,
  );
}

/* ---------- Levels 3, 4: a queue (before and after; first, last, in the middle) ---------- */

/** Animals standing in a queue, the first nearest to `to` (on the right). */
function queue(animals: readonly Thing[], to: Thing, arrow = false): Visual {
  const n = animals.length;
  const size = n > 4 ? 11.5 : 13;
  const step = n > 4 ? 14 : 16;
  const items: SceneItem[] = [
    at(to, 90, 21, 18),
    ...animals.map((a, i) => at(a, 74 - i * step, 23, size)),
  ];
  const props: SceneProp[] = [{ kind: 'floor', y: 31 }];
  if (arrow) props.push({ kind: 'arrow', from: [74 - (n - 1) * step, 7], to: [78, 7] });
  return { type: 'scene', w: 100, h: 36, items, props };
}

const QUEUES: ThingId[][] = [
  ['dog', 'cat', 'rabbit', 'bear'],
  ['monkey', 'fox', 'lion', 'pig'],
  ['tiger', 'mouse', 'dog', 'monkey'],
  ['bear', 'pig', 'cat', 'fox'],
];

type QueueFact = { line: Thing[]; target: number; ask: 'before' | 'after' };

function beforeAfter({ line, target, ask }: QueueFact, rng: Rng): Exercise {
  const stand = thing('icecream');
  const who = line[target] as Thing;
  const ans = line[ask === 'before' ? target - 1 : target + 1] as Thing;
  const near = line[ask === 'before' ? target + 1 : target - 1] as Thing;
  const third = line.find((t) => t !== who && t !== ans && t !== near) as Thing;
  // The example: another queue, without the answer, asked the same way.
  // The example: another queue with none of these animals, so it never names a button.
  const ids = line.map((t) => t.id);
  const exLine = things(QUEUES.find((q) => q.every((id) => !ids.includes(id))) as ThingId[]);
  const exT = ask === 'before' ? 2 : 1;
  const exAns = exLine[ask === 'before' ? exT - 1 : exT + 1] as Thing;
  return pictureQuestion(
    {
      topicId: ID,
      level: 3,
      factId: `queue:${line.map((t) => t.id).join(',')}:${target}:${ask}`,
      spoken: say(K(`queue.${ask}`), { name: who.singular }),
      visual: queue(line, stand),
      options: [thingOption(ans), thingOption(near), thingOption(third)],
      hints: [
        hint(say(K('queue.hint1'))),
        hint(say(K(`queue.hint2.${ask}`), { name: who.singular }), {
          visual: queue(line, stand, true),
        }),
        pictureExample(
          say(K(`queue.example.${ask}`), {
            name: (exLine[exT] as Thing).singular,
            other: exAns.singular,
          }),
          queue(exLine, stand),
        ),
      ],
      solution: say(K(`queue.solution.${ask}`), { name: who.singular, other: ans.singular }),
      advice: [
        {
          option: 1,
          say: say(K(`queue.adv.${ask}`), { name: who.singular, other: near.singular }),
        },
      ],
    },
    rng,
  );
}

const QUEUES3: ThingId[][] = [
  ['rabbit', 'fox', 'cat'],
  ['pig', 'dog', 'lion'],
  ['monkey', 'bear', 'mouse'],
];
const QUEUES5: ThingId[][] = [
  ['cat', 'tiger', 'rabbit', 'pig', 'bear'],
  ['dog', 'mouse', 'fox', 'monkey', 'lion'],
  ['bear', 'rabbit', 'lion', 'cat', 'tiger'],
];

type PlaceFact = { line: Thing[]; ask: 'first' | 'last' | 'middle' };

function firstLast({ line, ask }: PlaceFact, rng: Rng): Exercise {
  const stand = thing('carousel');
  const n = line.length;
  const mid = (n - 1) / 2;
  const idx = ask === 'first' ? 0 : ask === 'last' ? n - 1 : mid;
  // The others: the far end (first for last), and a neighbour.
  const others = ask === 'first' ? [n - 1, 1] : ask === 'last' ? [0, n - 2] : [mid - 1, mid + 1];
  const ans = line[idx] as Thing;
  // The example names an animal that is not in this queue (it must not name a button):
  // a queue of the same length when one has such an animal in that place, else the other length.
  const placeIn = (q: readonly unknown[]) =>
    ask === 'first' ? 0 : ask === 'last' ? q.length - 1 : (q.length - 1) / 2;
  const ids = line.map((t) => t.id);
  const exLine = things(
    [...(n === 3 ? QUEUES3 : QUEUES5), ...(n === 3 ? QUEUES5 : QUEUES3)].find(
      (q) => !ids.includes(q[placeIn(q)] as ThingId),
    ) as ThingId[],
  );
  const exIdx = placeIn(exLine);
  const optionOf = (i: number): PictureOption => thingOption(line[i] as Thing);
  return pictureQuestion(
    {
      topicId: ID,
      level: 4,
      factId: `place:${line.map((t) => t.id).join(',')}:${ask}`,
      spoken: say(K(`place.${ask}`)),
      visual: queue(line, stand),
      options: [optionOf(idx), optionOf(others[0] as number), optionOf(others[1] as number)],
      hints: [
        hint(say(K(`place.hint1.${ask}`))),
        hint(say(K(`place.hint2.${ask}`)), { visual: queue(line, stand, true) }),
        pictureExample(
          say(K(`place.solution.${ask}`), { name: (exLine[exIdx] as Thing).singular }),
          queue(exLine, stand),
        ),
      ],
      solution: say(K(`place.solution.${ask}`), { name: ans.singular }),
      // First and last mixed up: the other end of the queue.
      advice:
        ask === 'middle'
          ? []
          : [
              {
                option: 1,
                say: say(K(`place.adv.${ask}`), {
                  name: (line[others[0] as number] as Thing).singular,
                }),
              },
            ],
    },
    rng,
  );
}

/* ---------- Level 5: above, under, next to (a table) ---------- */

type Where = 'above' | 'under' | 'next';
const WHERE: Where[] = ['above', 'under', 'next'];
const TABLE_THINGS: ThingId[] = ['ball', 'balloon', 'butterfly', 'bird', 'bee', 'duck'];

/** A small table, and `t` above it, under it or next to it (or a "?" there, for a hint). */
function tableScene(t: Thing | null, where: Where, arrow = false, button = false): Visual {
  const pos: Record<Where, [number, number]> = { above: [12, 7], under: [12, 28], next: [30, 29] };
  const [x, y] = pos[where];
  const props: SceneProp[] = [
    { kind: 'floor', y: 36 },
    { kind: 'table', x: 1, y: 17, w: 22, h: 19 },
  ];
  const arrows: Record<Where, [[number, number], [number, number]]> = {
    above: [
      [31, 4],
      [21, 7],
    ],
    under: [
      [33, 18],
      [20, 27],
    ],
    next: [
      [33, 6],
      [30, 19],
    ],
  };
  if (arrow) props.push({ kind: 'arrow', from: arrows[where][0], to: arrows[where][1] });
  const item: SceneItem = t ? at(t, x, y, 11) : { blank: true, x, y, size: 10 };
  return { type: 'scene', w: 37, h: 38, props, items: [item], ...(button ? { icon: true } : {}) };
}

function aboveUnder({ t, where }: { t: Thing; where: Where }, rng: Rng): Exercise {
  const others = WHERE.filter((w) => w !== where);
  const option = (w: Where): PictureOption => ({
    label: say(K(`table.label.${w}`)).text,
    visual: tableScene(t, w, false, true),
  });
  const ex = thing(TABLE_THINGS.find((id) => id !== t.id) as ThingId);
  return pictureQuestion(
    {
      topicId: ID,
      level: 5,
      factId: `table:${t.id}:${where}`,
      spoken: say(K(`table.${where}`), { name: t.singular }),
      visual: icon(t),
      options: [option(where), option(others[0] as Where), option(others[1] as Where)],
      hints: [
        hint(say(K(`table.hint1.${where}`))),
        hint(say(K('table.hint2')), { visual: tableScene(null, where, true) }),
        pictureExample(
          say(K('table.example'), {
            name: ex.singular,
            where: say(K(`table.label.${where}`)).text,
          }),
          tableScene(ex, where),
        ),
      ],
      solution: say(K('table.solution'), {
        name: t.singular,
        where: say(K(`table.label.${where}`)).text,
      }),
      advice: [1, 2].map((o) => ({
        option: o,
        say: say(K('table.adv'), {
          name: t.singular,
          got: say(K(`table.label.${others[o - 1] as Where}`)).text,
          want: say(K(`table.label.${where}`)).text,
        }),
      })),
    },
    rng,
  );
}

/* ---------- Level 6: near and far ---------- */

const NEAR_TRIOS: ThingId[][] = [
  ['cat', 'ball', 'duck'],
  ['dog', 'teddy', 'rabbit'],
  ['car', 'bear', 'apple'],
  ['monkey', 'drum', 'pig'],
];

type NearFact = { trio: Thing[]; ref: Thing; side: 'right' | 'left'; ask: 'near' | 'far' };

/** `ref` at one side, the three at growing distances from it: near, middle, far. */
function nearScene(order: Thing[], ref: Thing, side: 'right' | 'left'): Visual {
  const rx = side === 'right' ? 88 : 12;
  const dir = side === 'right' ? -1 : 1;
  const ds = [20, 44, 72];
  return {
    type: 'scene',
    w: 100,
    h: 40,
    props: [{ kind: 'floor', y: 36 }],
    items: [
      at(ref, rx, 24, 22),
      ...order.map((t, i) => at(t, rx + dir * (ds[i] as number), 29, 13)),
    ],
  };
}

function nearFar({ trio, ref, side, ask }: NearFact, rng: Rng): Exercise {
  const [a, b, c] = trio as [Thing, Thing, Thing];
  const order = side === 'right' ? [a, b, c] : [c, a, b];
  const [near, mid, far] = order as [Thing, Thing, Thing];
  const ans = ask === 'near' ? near : far;
  const end = ask === 'near' ? far : near;
  const exTrio = things(NEAR_TRIOS.find((x) => !x.includes(ans.id as never)) as ThingId[]);
  const exOrder =
    side === 'right' ? [exTrio[1], exTrio[2], exTrio[0]] : [exTrio[2], exTrio[0], exTrio[1]];
  const exAns = (ask === 'near' ? exOrder[0] : exOrder[2]) as Thing;
  const exSide = side === 'right' ? 'left' : 'right';
  const ref1 = ref.singular;
  return pictureQuestion(
    {
      topicId: ID,
      level: 6,
      factId: `near:${trio.map((t) => t.id).join(',')}:${ref.id}:${side}:${ask}`,
      spoken: say(K(`near.${ask}`), { ref: ref1 }),
      visual: nearScene(order as Thing[], ref, side),
      options: [thingOption(ans), thingOption(mid), thingOption(end)],
      hints: [
        hint(say(K(`near.hint1.${ask}`))),
        hint(say(K(`near.hint2.${ask}`), { ref: ref1 })),
        pictureExample(
          say(K(`near.solution.${ask}`), { name: exAns.singular, ref: ref1 }, exAns.gender),
          nearScene(exOrder as Thing[], ref, exSide),
        ),
      ],
      solution: say(K(`near.solution.${ask}`), { name: ans.singular, ref: ref1 }, ans.gender),
      advice: [
        { option: 1, say: say(K(`near.adv.middle.${ask}`), { ref: ref1 }) },
        { option: 2, say: say(K(`near.adv.${ask}`), { ref: ref1 }) },
      ],
    },
    rng,
  );
}

/* ---------- Level 7: right and left (the child's own, facing the screen) ---------- */

const SIDE_TRIOS: ThingId[][] = [
  ['apple', 'ball', 'cat'],
  ['car', 'teddy', 'duck'],
  ['star', 'drum', 'bear'],
  ['banana', 'rabbit', 'book'],
  ['gift', 'monkey', 'balloon'],
  ['robot', 'pear', 'dog'],
  ['kite', 'frog', 'cap'],
  ['pig', 'orange', 'bus'],
];

type SideFact = { trio: Thing[]; ask: 'right' | 'left' };

/** Three in a row, the first on the right. `marks`: the words ימין and שמאל under the ends. */
function sideScene(trio: readonly Thing[], marks: boolean): Visual {
  const xs = spread(3, 100, 18);
  return {
    type: 'scene',
    w: 100,
    h: marks ? 44 : 34,
    items: trio.map((t, i) => at(t, xs[i] as number, 17, 17)),
    props: marks
      ? [
          { kind: 'label', x: 90, y: 40, text: 'ימין' },
          { kind: 'label', x: 10, y: 40, text: 'שמאל' },
        ]
      : [],
  };
}

function rightLeft({ trio, ask }: SideFact, rng: Rng): Exercise {
  const [r, m, l] = trio as [Thing, Thing, Thing];
  const ans = ask === 'right' ? r : l;
  const other = ask === 'right' ? l : r;
  const exTrio = things(SIDE_TRIOS.find((x) => !x.includes(ans.id as never)) as ThingId[]);
  const exAns = (ask === 'right' ? exTrio[0] : exTrio[2]) as Thing;
  return pictureQuestion(
    {
      topicId: ID,
      level: 7,
      factId: `side:${trio.map((t) => t.id).join(',')}:${ask}`,
      spoken: say(K(`side.${ask}`)),
      visual: sideScene(trio, false),
      options: [thingOption(ans), thingOption(m), thingOption(other)],
      // Right and left as the child sees them: her own hands, facing the screen.
      hints: [
        hint(say(K(`side.hint1.${ask}`))),
        hint(say(K('side.hint2')), { visual: sideScene(trio, true) }),
        pictureExample(
          say(K(`side.solution.${ask}`), { name: exAns.singular }),
          sideScene(exTrio, true),
        ),
      ],
      solution: say(K(`side.solution.${ask}`), { name: ans.singular }),
      advice: [
        { option: 1, say: say(K('side.adv.middle'), { side: say(K(`side.word.${ask}`)).text }) },
        { option: 2, say: say(K(`side.adv.${ask}`)) },
      ],
    },
    rng,
  );
}

/* ---------- Level 8: second and third (the cars of a train) ---------- */

const ORDINAL = ['ראשון', 'שני', 'שלישי', 'רביעי'];
const TRAINS: ThingId[][] = [
  ['cat', 'dog', 'pig', 'lion'],
  ['rabbit', 'bear', 'monkey', 'fox'],
  ['tiger', 'mouse', 'cat', 'bear'],
  ['fox', 'lion', 'rabbit', 'dog'],
  ['monkey', 'pig', 'tiger', 'mouse'],
  ['dog', 'rabbit', 'fox', 'cat'],
];
/** Which animal's car is asked, per train (as two questions: by car, by animal). */
const ASKED_CARS: [number, number][] = [
  [1, 3],
  [2, 4],
  [4, 1],
  [3, 2],
  [1, 4],
  [3, 1],
];

const CAR = 19;

/** A train going right: the engine at the right, the animals in cars 1–4 behind it. */
function train(animals: readonly Thing[], arrow = false): Visual {
  const front = 97;
  const props: SceneProp[] = [
    { kind: 'floor', y: 37 },
    { kind: 'train', x: front, y: 21, cars: animals.length, car: CAR },
  ];
  if (arrow) props.push({ kind: 'arrow', from: [front - 22, 5], to: [front - 22 - CAR * 3.4, 5] });
  return {
    type: 'scene',
    w: 100,
    h: 40,
    props,
    items: animals.map((a, i) => at(a, front - 22 - CAR * (i + 0.5), 17, 12)),
  };
}

type TrainFact =
  { line: Thing[]; kind: 'who'; car: 2 | 3 } | { line: Thing[]; kind: 'which'; car: number };

function trainExercise(f: TrainFact, rng: Rng): Exercise {
  const { line } = f;
  const ord = (c: number) => ORDINAL[c - 1] as string;
  const hints = (exSaid: Said, exLine: Thing[]) =>
    [
      hint(say(K('train.hint1'))),
      hint(say(K('train.hint2')), { visual: train(line, true) }),
      pictureExample(exSaid, train(exLine)),
    ] as const;
  if (f.kind === 'who') {
    const ans = line[f.car - 1] as Thing;
    const opts = f.car === 2 ? [1, 0, 2] : [2, 1, 3];
    // From the wrong end: the second from the back is the third car.
    const fromEnd = line[line.length - f.car] as Thing;
    // The example names an animal that is not on this train (it must not name a button).
    const ids = line.map((t) => t.id);
    const exLine = things(TRAINS.find((t) => !ids.includes(t[f.car - 1] as ThingId)) as ThingId[]);
    return pictureQuestion(
      {
        topicId: ID,
        level: 8,
        factId: `train:${line.map((t) => t.id).join(',')}:who${f.car}`,
        spoken: say(K('train.who'), { ord: ord(f.car) }),
        visual: train(line),
        options: opts.map((i) => thingOption(line[i] as Thing)) as [
          PictureOption,
          PictureOption,
          PictureOption,
        ],
        hints: [
          ...hints(
            say(K('train.example.who'), {
              ord: ord(f.car),
              name: (exLine[f.car - 1] as Thing).singular,
            }),
            exLine,
          ),
        ],
        solution: say(K('train.solution.who'), { ord: ord(f.car), name: ans.singular }),
        advice: [
          {
            option: opts.map((i) => line[i]).indexOf(fromEnd),
            say: say(K('train.adv.fromEnd')),
          },
        ].filter((a) => a.option > 0),
      },
      rng,
    );
  }
  const who = line[f.car - 1] as Thing;
  // The example: another car, and an animal that is not on this train.
  const ids = line.map((t) => t.id);
  const ex = TRAINS.flatMap((t) => [3, 2, 4, 1].map((c) => ({ t, c }))).find(
    ({ t, c }) => c !== f.car && !ids.includes(t[c - 1] as ThingId),
  ) as { t: ThingId[]; c: number };
  const exLine = things(ex.t);
  const exCar = ex.c;
  const fromEnd = line.length + 1 - f.car;
  return exercise({
    factId: `train:${line.map((t) => t.id).join(',')}:which:${who.id}`,
    topicId: ID,
    level: 8,
    prompt: shown(say(K('train.which'), { name: who.singular })),
    display: '',
    spoken: say(K('train.which'), { name: who.singular }),
    visual: train(line),
    answer: f.car,
    input: { type: 'choices', choices: windowChoices(rng, [1, 2, 3, 4], f.car) },
    hints: [
      ...hints(
        say(K('train.example.which'), {
          ord: ord(exCar),
          name: (exLine[exCar - 1] as Thing).singular,
        }),
        exLine,
      ),
    ],
    solution: say(K('train.solution.which'), { ord: ord(f.car), name: who.singular }),
    diagnose: (v) => (Math.abs(v - f.car) === 1 ? 'offByOne' : null),
    advice: [
      ...(fromEnd !== f.car ? [{ value: fromEnd, say: say(K('train.adv.fromEnd')) }] : []),
      ...[f.car - 1, f.car + 1]
        .filter((v) => v >= 1 && v <= 4 && v !== fromEnd)
        .map((v) => ({ value: v, say: say(K('train.adv.near')), kind: 'offByOne' as const })),
    ],
  });
}

/* ---------- Level 9: where does the path lead? ---------- */

const STARTS: ThingId[][] = [
  ['rabbit', 'dog', 'cat'],
  ['bear', 'monkey', 'pig'],
];
const ENDS: ThingId[] = ['house', 'tree', 'tent'];
const PATH_COLOR = ['אדום', 'כחול', 'ירוק'];
const PERMS: number[][] = [
  [1, 0, 2],
  [0, 2, 1],
  [2, 1, 0],
  [1, 2, 0],
  [2, 0, 1],
];
const COLS = [82, 50, 18];

/** The points of the path from start column s to end column e (a bend when it goes straight down). */
function pathPoints(s: number, e: number): [number, number][] {
  const xs = COLS[s] as number;
  const xe = COLS[e] as number;
  const bend = s === e ? (s === 2 ? 14 : -14) : 0;
  return [
    [xs, 20],
    [xs, 27],
    [xs + (xe - xs) * 0.3 + bend, 38],
    [xs + (xe - xs) * 0.7 - bend, 50],
    [xe, 60],
    [xe, 66],
  ];
}

function maze(animals: Thing[], perm: number[], only?: number): Visual {
  const ends = things(ENDS);
  const shown = only === undefined ? [0, 1, 2] : [only];
  return {
    type: 'scene',
    w: 100,
    h: 82,
    props: shown.map((s) => {
      const pts = pathPoints(s, perm[s] as number);
      return { kind: 'path', points: only === undefined ? pts : pts.slice(0, 3), tone: s };
    }),
    items: [
      ...shown.map((s) => at(animals[s] as Thing, COLS[s] as number, 11, 14)),
      ...ends.map((t, e) => at(t, COLS[e] as number, 73, 15)),
    ],
  };
}

type PathFact = { perm: number[]; set: number; s: number };

function pathExercise({ perm, set, s }: PathFact, rng: Rng): Exercise {
  const animals = things(STARTS[set] as ThingId[]);
  const ends = things(ENDS);
  const who = animals[s] as Thing;
  const dest = ends[perm[s] as number] as Thing;
  const others = ends.filter((t) => t !== dest);
  // An example from the other animals whose path ends elsewhere.
  const exAnimals = things(STARTS[1 - set] as ThingId[]);
  const ex = PERMS.flatMap((p) => [0, 1, 2].map((k) => ({ p, k }))).find(
    ({ p, k }) => p !== perm && ends[p[k] as number] !== dest,
  ) as { p: number[]; k: number };
  return pictureQuestion(
    {
      topicId: ID,
      level: 9,
      factId: `path:${perm.join('')}:${set}:${s}`,
      spoken: say(K('path.ask'), { name: who.singular }),
      visual: maze(animals, perm),
      options: [
        thingOption(dest),
        thingOption(others[0] as Thing),
        thingOption(others[1] as Thing),
      ],
      hints: [
        hint(say(K('path.hint1'), { name: who.singular })),
        hint(say(K('path.hint2'), { name: who.singular, color: PATH_COLOR[s] as string }), {
          visual: maze(animals, perm, s),
        }),
        pictureExample(
          say(K('path.solution'), {
            name: (exAnimals[ex.k] as Thing).singular,
            dest: (ends[ex.p[ex.k] as number] as Thing).singular,
          }),
          maze(exAnimals, ex.p),
        ),
      ],
      solution: say(K('path.solution'), { name: who.singular, dest: dest.singular }),
    },
    rng,
  );
}

/* ---------- Level 10: what moved? ---------- */

const ROOM_SETS: ThingId[][] = [
  ['teddy', 'ball', 'car', 'duck'],
  ['apple', 'banana', 'pear', 'orange'],
  ['cat', 'dog', 'rabbit', 'bear'],
  ['drum', 'book', 'robot', 'gift'],
  ['star', 'heart', 'balloon', 'kite'],
  ['cap', 'shirt', 'sock', 'shoe'],
];
/** Six places on two shelves, from the right: 0–2 above, 3–5 below. */
const SLOTS: [number, number][] = [
  [76, 12],
  [50, 12],
  [24, 12],
  [76, 31],
  [50, 31],
  [24, 31],
];
/** Where each set stands, and its two moves: [which thing, to which empty place]. */
const LAYOUTS: { at: number[]; moves: [number, number][] }[] = [
  {
    at: [0, 2, 3, 4],
    moves: [
      [0, 1],
      [3, 5],
    ],
  },
  {
    at: [1, 3, 4, 5],
    moves: [
      [2, 0],
      [0, 2],
    ],
  },
  {
    at: [0, 1, 4, 5],
    moves: [
      [1, 3],
      [3, 2],
    ],
  },
  {
    at: [0, 2, 3, 5],
    moves: [
      [1, 4],
      [2, 1],
    ],
  },
  {
    at: [1, 2, 3, 4],
    moves: [
      [0, 5],
      [3, 0],
    ],
  },
  {
    at: [0, 1, 2, 4],
    moves: [
      [2, 3],
      [1, 5],
    ],
  },
];

type MoveFact = { set: number; move: number };

function room(set: Thing[], places: number[], ring?: number): SceneItem[] {
  return set.map((t, i) => {
    const [x, y] = SLOTS[places[i] as number] as [number, number];
    return ring === i ? { ...at(t, x, y, 14), ring: true } : at(t, x, y, 14);
  });
}

function moved(
  setIdx: number,
  move: number,
  ring?: number,
): { visual: Visual; mover: Thing; set: Thing[] } {
  const set = things(ROOM_SETS[setIdx] as ThingId[]);
  const layout = LAYOUTS[setIdx] as (typeof LAYOUTS)[number];
  const [who, to] = layout.moves[move] as [number, number];
  const after = layout.at.map((p, i) => (i === who ? to : p));
  return {
    set,
    mover: set[who] as Thing,
    visual: {
      type: 'scene',
      w: 100,
      h: 42,
      props: [{ kind: 'shelves', x: 8, y: 2, w: 84, h: 38, n: 2 }],
      items: room(set, layout.at, ring),
      then: room(set, after, ring),
    },
  };
}

function whatMoved({ set: setIdx, move }: MoveFact, rng: Rng): Exercise {
  const { visual, mover, set } = moved(setIdx, move);
  const layout = LAYOUTS[setIdx] as (typeof LAYOUTS)[number];
  const who = layout.moves[move]?.[0] as number;
  const stayers = set.filter((t) => t !== mover);
  const stay = (who + 1) % 4;
  const ex = moved((setIdx + 1) % ROOM_SETS.length, move);
  return pictureQuestion(
    {
      topicId: ID,
      level: 10,
      factId: `moved:${setIdx}:${move}`,
      spoken: say(K('moved.ask')),
      visual,
      options: [
        thingOption(mover),
        thingOption(stayers[0] as Thing),
        thingOption(stayers[1] as Thing),
      ],
      hints: [
        hint(say(K('moved.hint1'))),
        hint(
          say(
            K('moved.hint2'),
            { name: (set[stay] as Thing).singular },
            (set[stay] as Thing).gender,
          ),
          {
            visual: moved(setIdx, move, stay).visual,
          },
        ),
        pictureExample(
          say(K('moved.solution'), { name: ex.mover.singular }, ex.mover.gender),
          ex.visual,
        ),
      ],
      solution: say(K('moved.solution'), { name: mover.singular }, mover.gender),
    },
    rng,
  );
}

export const space0 = defineTopic({
  id: ID,
  labelKey: 'topic.space0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () =>
        SHELF_TOYS.flatMap((_, i) =>
          (['up', 'down'] as const).map((ask) => ({
            toys: triple(things(SHELF_TOYS), i, 3, 5),
            ask,
          })),
        ),
      upDown,
    ),
    closed(
      L(2),
      () =>
        BOX_THINGS.flatMap((_, i) =>
          (['in', 'out'] as const).map((ask) => ({
            trio: triple(things(BOX_THINGS), i, 2, 5),
            ask,
            flip: i % 2 === 1,
          })),
        ),
      inOut,
    ),
    closed(
      L(3),
      () =>
        QUEUES.flatMap((q) =>
          [1, 2].flatMap((target) =>
            (['before', 'after'] as const).map((ask) => ({ line: things(q), target, ask })),
          ),
        ),
      beforeAfter,
    ),
    closed(
      L(4),
      () =>
        [...QUEUES3, ...QUEUES5].flatMap((q) =>
          (['first', 'last', 'middle'] as const).map((ask) => ({ line: things(q), ask })),
        ),
      firstLast,
    ),
    closed(
      L(5),
      () => TABLE_THINGS.flatMap((id) => WHERE.map((where) => ({ t: thing(id), where }))),
      aboveUnder,
    ),
    closed(
      L(6),
      () =>
        NEAR_TRIOS.flatMap((trio, i) =>
          (['right', 'left'] as const).flatMap((side) =>
            (['near', 'far'] as const).map((ask) => ({
              trio: things(trio),
              ref: thing(i % 2 ? 'tree' : 'house'),
              side,
              ask,
            })),
          ),
        ),
      nearFar,
    ),
    closed(
      L(7),
      () =>
        SIDE_TRIOS.flatMap((trio) =>
          (['right', 'left'] as const).map((ask) => ({ trio: things(trio), ask })),
        ),
      rightLeft,
    ),
    closed(
      L(8),
      () =>
        TRAINS.flatMap((t, i): TrainFact[] => {
          const line = things(t);
          const [c1, c2] = ASKED_CARS[i] as [number, number];
          return [
            { line, kind: 'who', car: 2 },
            { line, kind: 'who', car: 3 },
            { line, kind: 'which', car: c1 },
            { line, kind: 'which', car: c2 },
          ];
        }),
      trainExercise,
    ),
    closed(
      L(9),
      () => PERMS.flatMap((perm, i) => [0, 1, 2].map((s) => ({ perm, set: i % 2, s }))),
      pathExercise,
    ),
    closed(
      L(10),
      () => ROOM_SETS.flatMap((_, set) => [0, 1].map((move) => ({ set, move }))),
      whatMoved,
    ),
  ],
});
