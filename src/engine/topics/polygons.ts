import { t } from '@/i18n';
import {
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  open,
  pictureChoices,
  pictureExample,
  say,
  windowChoices,
} from '../build';
import { pick, randInt, shuffle } from '../rng';
import type { Exercise, Polygon, Rng, Visual } from '../types';

/**
 * World "מצולעים וזוויות", grades 1–2: geometry the journey had none of in
 * these grades. Sides and vertices, naming polygons (levels 1–5, grade 1);
 * the right angle, equal sides and the perimeter by adding the sides (levels
 * 6–10, grade 2). Grade 1 ends at level 5.
 */

const ID = 'polygons';
const L = (n: number) => `level.polygons.${n}`;

type P = [number, number];
type Name =
  | 'triangle'
  | 'square'
  | 'rectangle'
  | 'quad'
  | 'pentagon'
  | 'hexagon'
  | 'rightTri'
  | 'trapezoid'
  | 'parallelogram';

/** Shapes in a 100 × 100 box (y down). */
const SHAPES: Record<Name, P[]> = {
  triangle: [
    [10, 88],
    [90, 88],
    [42, 12],
  ],
  square: [
    [15, 15],
    [85, 15],
    [85, 85],
    [15, 85],
  ],
  rectangle: [
    [4, 28],
    [96, 28],
    [96, 72],
    [4, 72],
  ],
  quad: [
    [12, 20],
    [80, 8],
    [92, 86],
    [24, 74],
  ],
  pentagon: [
    [50, 6],
    [93, 37],
    [77, 90],
    [23, 90],
    [7, 37],
  ],
  hexagon: [
    [27, 10],
    [73, 10],
    [96, 50],
    [73, 90],
    [27, 90],
    [4, 50],
  ],
  rightTri: [
    [12, 10],
    [12, 90],
    [88, 90],
  ],
  trapezoid: [
    [12, 20],
    [60, 20],
    [92, 82],
    [12, 82],
  ],
  parallelogram: [
    [30, 22],
    [96, 22],
    [70, 80],
    [4, 80],
  ],
};

const poly = (name: Name, extra: Omit<Polygon, 'points'> = {}): Visual => ({
  type: 'polygon',
  points: SHAPES[name],
  ...extra,
});

const SIDES: Record<Name, number> = {
  triangle: 3,
  rightTri: 3,
  square: 4,
  rectangle: 4,
  quad: 4,
  trapezoid: 4,
  parallelogram: 4,
  pentagon: 5,
  hexagon: 6,
};

/** The polygon's name by its number of sides. */
const NAME_BY_SIDES: Record<number, string> = { 3: 'משולש', 4: 'מרובע', 5: 'מחומש', 6: 'משושה' };

const MANY: Name[] = [
  'triangle',
  'rightTri',
  'square',
  'rectangle',
  'quad',
  'trapezoid',
  'pentagon',
  'hexagon',
];

/** Levels 1–2: how many sides, how many vertices. */
function count(level: 1 | 2) {
  return (rng: Rng): Exercise => {
    // The number of sides first, then a shape: four-sided shapes are most of MANY,
    // and the answer's button would mostly sit in the same place.
    const sides = pick(rng, [3, 4, 5, 6]);
    const name = pick(
      rng,
      MANY.filter((m) => SIDES[m] === sides),
    );
    const n = SIDES[name];
    const key = level === 1 ? 'ex.poly.sides' : 'ex.poly.vertices';
    const ex: Name = n === 5 ? 'hexagon' : 'pentagon';
    return exercise({
      factId: `${key}:${name}`,
      topicId: ID,
      level,
      prompt: t(`${key}.prompt`),
      display: '',
      spoken: say(`${key}.prompt`),
      visual: poly(name),
      answer: n,
      input: { type: 'choices', choices: windowChoices(rng, [2, 3, 4, 5, 6, 7, 8], n) },
      hints: [
        hint(say(`${key}.hint1`)),
        hint(say('ex.poly.hint2')),
        pictureExample(say(`${key}.example`, { n: SIDES[ex] }), poly(ex)),
      ],
      solution: say(`${key}.solution`, { n }),
    });
  };
}

/** Level 3: the polygon's name (משולש, מרובע, מחומש, משושה). */
function name(rng: Rng): Exercise {
  const shape = pick(rng, MANY);
  const n = SIDES[shape];
  const labels = shuffle(
    rng,
    [3, 4, 5, 6].map((k) => NAME_BY_SIDES[k] as string),
  );
  const right = NAME_BY_SIDES[n] as string;
  return exercise({
    factId: `pname:${shape}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.poly.name.prompt'),
    display: '',
    spoken: say('ex.poly.name.prompt'),
    visual: poly(shape),
    answer: labels.indexOf(right),
    input: labelledChoices(labels, true),
    hints: [
      hint(say('ex.poly.name.hint1')),
      hint(say('ex.poly.name.hint2')),
      pictureExample(
        say(n === 5 ? 'ex.poly.name.exampleHex' : 'ex.poly.name.examplePent'),
        poly(n === 5 ? 'hexagon' : 'pentagon'),
      ),
    ],
    solution: say('ex.poly.name.solution', { name: right }),
  });
}

/** Level 4: where is the quadrilateral / triangle / pentagon? Three pictures. */
function where(rng: Rng): Exercise {
  const want = pick(rng, [3, 4, 5, 6]);
  const pickOf = (k: number) =>
    pick(
      rng,
      MANY.filter((s) => SIDES[s] === k),
    );
  const others = shuffle(
    rng,
    [3, 4, 5, 6].filter((k) => k !== want),
  ).slice(0, 2);
  const shapes = shuffle(rng, [want, ...others]).map((k) => ({ k, s: pickOf(k) }));
  const wanted = NAME_BY_SIDES[want] as string;
  return exercise({
    factId: `pwhere:${want}:${shapes.map((x) => x.s).join(',')}`,
    topicId: ID,
    level: 4,
    prompt: t('ex.poly.where.prompt', { params: { name: wanted } }),
    display: '',
    spoken: say('ex.poly.where.prompt', { name: wanted }),
    answer: shapes.findIndex((x) => x.k === want),
    input: pictureChoices(
      shapes.map((x) => NAME_BY_SIDES[x.k] as string),
      shapes.map((x) => poly(x.s)),
    ),
    hints: [
      hint(say('ex.poly.where.hint1', { name: wanted, n: want })),
      hint(say('ex.poly.hint2')),
      pictureExample(say('ex.poly.name.examplePent'), poly('pentagon')),
    ],
    solution: say('ex.poly.name.solution', { name: wanted }),
  });
}

/** Level 5: which of two has more sides? */
function moreSides(rng: Rng): Exercise {
  const [a, b] = shuffle(rng, [3, 4, 5, 6]).slice(0, 2) as [number, number];
  const sa = pick(
    rng,
    MANY.filter((s) => SIDES[s] === a),
  );
  const sb = pick(
    rng,
    MANY.filter((s) => SIDES[s] === b),
  );
  return exercise({
    factId: `pmore:${sa},${sb}`,
    topicId: ID,
    level: 5,
    prompt: t('ex.poly.more.prompt'),
    display: '',
    spoken: say('ex.poly.more.prompt'),
    answer: a > b ? 0 : 1,
    input: pictureChoices(
      [NAME_BY_SIDES[a] as string, NAME_BY_SIDES[b] as string],
      [poly(sa), poly(sb)],
    ),
    hints: [
      hint(say('ex.poly.sides.hint1')),
      hint(say('ex.poly.more.hint2')),
      hint(say('ex.poly.more.hint3')),
    ],
    solution: say('ex.poly.more.solution', { name: NAME_BY_SIDES[Math.max(a, b)] as string }),
  });
}

/** Level 6: is this a right angle? */
function isRight(rng: Rng): Exercise {
  const yes = rng() < 0.5;
  const deg = yes ? 90 : pick(rng, [35, 50, 60, 120, 135, 150]);
  const turn = pick(rng, [0, 20, 45, 70]);
  return exercise({
    factId: `pright:${deg}:${turn}`,
    topicId: ID,
    level: 6,
    prompt: t('ex.poly.right.prompt'),
    display: '',
    spoken: say('ex.poly.right.prompt'),
    visual: { type: 'angle', deg, turn },
    answer: yes ? 1 : 0,
    input: labelledChoices([t('ex.div.no'), t('ex.div.yes')]),
    hints: [
      hint(say('ex.poly.right.hint1')),
      hint(say('ex.poly.right.hint2')),
      pictureExample(say(yes ? 'ex.poly.right.exampleNo' : 'ex.poly.right.exampleYes'), {
        type: 'angle',
        deg: yes ? 50 : 90,
      }),
    ],
    solution: say(yes ? 'ex.poly.right.yes' : 'ex.poly.right.no'),
  });
}

const RIGHTS: [Name, number][] = [
  ['square', 4],
  ['rectangle', 4],
  ['rightTri', 1],
  ['trapezoid', 2],
  ['triangle', 0],
  ['parallelogram', 0],
  ['pentagon', 0],
];

/** Level 7: how many right angles in the shape? (The trapezoid here has two.) */
function rightAngles(rng: Rng): Exercise {
  const [shape, n] = pick(rng, RIGHTS);
  return exercise({
    factId: `prights:${shape}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.angles.rights.prompt'),
    display: '',
    spoken: say('ex.angles.rights.prompt'),
    visual: poly(shape),
    answer: n,
    input: { type: 'choices', choices: shuffle(rng, windowChoices(rng, [0, 1, 2, 3, 4, 5], n)) },
    hints: [
      hint(say('ex.poly.rights.hint1')),
      hint(say('ex.poly.right.hint2')),
      // Never this shape's answer: a square (four) for the others, the trapezoid (two) for four.
      n === 4
        ? pictureExample(
            say('ex.poly.rights.exampleTwo'),
            poly('trapezoid', { rightAngles: [0, 3] }),
          )
        : pictureExample(
            say('ex.poly.rights.example'),
            poly('square', { rightAngles: [0, 1, 2, 3] }),
          ),
    ],
    solution:
      n === 0
        ? say('ex.poly.rights.solution0')
        : n === 1
          ? say('ex.poly.rights.solution1')
          : say('ex.poly.rights.solution', { n }),
  });
}

/** Level 8: which of three angles is the right one? */
function whichRight(rng: Rng): Exercise {
  const degs = shuffle(rng, [90, pick(rng, [40, 55, 65]), pick(rng, [115, 130, 150])]);
  return exercise({
    factId: `pwhich:${degs.join(',')}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.poly.whichRight.prompt'),
    display: '',
    spoken: say('ex.poly.whichRight.prompt'),
    answer: degs.indexOf(90),
    input: pictureChoices(
      degs.map((d) =>
        d === 90
          ? t('ex.poly.angleRight')
          : d < 90
            ? t('ex.poly.angleSmall')
            : t('ex.poly.angleBig'),
      ),
      degs.map((d): Visual => ({ type: 'angle', deg: d, turn: 0 })),
    ),
    hints: [
      hint(say('ex.poly.right.hint1')),
      hint(say('ex.poly.right.hint2')),
      hint(say('ex.poly.whichRight.hint3')),
    ],
    solution: say('ex.poly.right.yes'),
  });
}

/** Level 9: which shape has all its sides equal? */
function allEqual(rng: Rng): Exercise {
  const right: Name = pick(rng, ['square', 'triangle']);
  const rightVisual =
    right === 'square'
      ? poly('square', { ticks: [1, 1, 1, 1] })
      : ({
          type: 'polygon',
          points: [
            [10, 88],
            [90, 88],
            [50, 18],
          ],
          ticks: [1, 1, 1],
        } as Visual);
  const wrong: Visual[] = [poly('rectangle', { ticks: [1, 2, 1, 2] }), poly('rightTri')];
  const order = shuffle(rng, [0, 1, 2]);
  const visuals = [rightVisual, ...wrong];
  const names = [right === 'square' ? 'ריבוע' : 'משולש שווה צלעות', 'מלבן', 'משולש ישר זווית'];
  return exercise({
    factId: `pequal:${right}:${order.join('')}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.poly.equal.prompt'),
    display: '',
    spoken: say('ex.poly.equal.prompt'),
    answer: order.indexOf(0),
    input: pictureChoices(
      order.map((i) => names[i] as string),
      order.map((i) => visuals[i] as Visual),
    ),
    hints: [
      hint(say('ex.poly.equal.hint1')),
      hint(say('ex.poly.equal.hint2')),
      // A rhombus, which is never one of the choices: the same mark on every side.
      pictureExample(say('ex.poly.equal.example'), {
        type: 'polygon',
        points: [
          [50, 8],
          [90, 50],
          [50, 92],
          [10, 50],
        ],
        ticks: [1, 1, 1, 1],
      }),
    ],
    solution: say('ex.poly.equal.solution', { name: names[0] as string }),
  });
}

/** Level 10: the perimeter, by adding the sides. */
function perimeter(rng: Rng): Exercise {
  const shape = pick(rng, ['triangle', 'rectangle', 'square', 'pentagon', 'quad'] as Name[]);
  const n = SIDES[shape];
  const sides =
    shape === 'square'
      ? (() => {
          const a = randInt(rng, 2, 9);
          return [a, a, a, a];
        })()
      : shape === 'rectangle'
        ? (() => {
            const a = randInt(rng, 3, 9);
            const b = randInt(rng, 2, a - 1);
            return [a, b, a, b];
          })()
        : Array.from({ length: n }, () => randInt(rng, 2, 9));
  const total = sides.reduce((s, x) => s + x, 0);
  return exercise({
    factId: `pperim:${shape}:${sides.join(',')}`,
    topicId: ID,
    level: 10,
    prompt: t('ex.poly.perim.prompt'),
    display: '',
    spoken: say('ex.poly.perim.prompt'),
    visual: poly(shape, { sideLabels: sides.map((x) => `${x} ס״מ`) }),
    answer: total,
    operation: 'add',
    input: numpad(2),
    hints: [
      hint(say('ex.poly.perim.hint1')),
      hint(say('ex.poly.perim.hint2'), {
        example: { display: `${sides.join(' + ')} = ?`, spoken: say('ex.poly.perim.hint2') },
      }),
      exampleAvoiding(total, [
        {
          answer: 12,
          hint: () =>
            exampleHint(
              '3 + 4 + 5 = 12',
              say('ex.poly.perim.solution', { r: { n: 12, noun: CM } }),
            ),
        },
        {
          answer: 14,
          hint: () =>
            exampleHint(
              '5 + 2 + 5 + 2 = 14',
              say('ex.poly.perim.solution', { r: { n: 14, noun: CM } }),
            ),
        },
      ]),
    ],
    solution: say('ex.poly.perim.solution', { r: { n: total, noun: CM } }),
    // Forgot a side (the classic slip with rectangles: only two sides added).
    diagnose: (v) => (sides.some((x) => v === total - x) || v === total / 2 ? 'other' : null),
  });
}

const CM = { singular: 'סנטימטר', plural: 'סנטימטרים', gender: 'm' } as const;

export const polygons = defineTopic({
  id: ID,
  labelKey: 'topic.polygons',
  grades: [1, 2],
  startLevel: () => 1,
  lastLevel: (grade) => (grade === 1 ? 5 : 10),
  levels: [
    open(L(1), count(1)),
    open(L(2), count(2)),
    open(L(3), name),
    open(L(4), where),
    open(L(5), moreSides),
    open(L(6), isRight),
    open(L(7), rightAngles),
    open(L(8), whichRight),
    open(L(9), allEqual),
    open(L(10), perimeter),
  ],
});
