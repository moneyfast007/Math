import { t } from '@/i18n';
import { shown } from '@/lang/compose';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  range,
  say,
  type Character,
} from '../build';
import { randInt } from '../rng';
import type { Exercise, Rng } from '../types';

/**
 * World 13, grade 4: "היקף ושטח". Area by counting squares, perimeter and area
 * of rectangles and squares, a missing side, units of length, word problems.
 */

const ID = 'perimeter-area';
const L = (n: number) => `level.perimeterArea.${n}`;

const CM: Noun = { singular: 'סנטימטר', plural: 'סנטימטרים', gender: 'm' };
const SQCM: Noun = { singular: 'סנטימטר רבוע', plural: 'סנטימטרים רבועים', gender: 'm' };
const SQUARE: Noun = { singular: 'משבצת', plural: 'משבצות', gender: 'f' };

function squares(w: number, h: number): Exercise {
  const answer = w * h;
  return exercise({
    factId: `sq:${w}x${h}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.area.squares.prompt'),
    display: '',
    spoken: say('ex.area.squares.prompt'),
    visual: { type: 'array', rows: h, cols: w, squares: true },
    answer,
    operation: 'mul',
    input: numpad(3),
    hints: [
      hint(say('ex.area.squares.hint1', { w: { n: w, noun: SQUARE } })),
      hint(say('ex.area.squares.hint2')),
      exampleAvoiding(
        answer,
        [
          { h: 3, w: 4 },
          { h: 3, w: 5 },
        ].map((ex) => ({
          answer: ex.h * ex.w,
          hint: () =>
            exampleHint(
              `${ex.h} × ${ex.w} = ${ex.h * ex.w}`,
              say('ex.area.squares.solution', {
                h: ex.h,
                w: { n: ex.w, noun: SQUARE },
                r: { n: ex.h * ex.w, noun: SQUARE },
              }),
            ),
        })),
      ),
    ],
    solution: say('ex.area.squares.solution', {
      h,
      w: { n: w, noun: SQUARE },
      r: { n: answer, noun: SQUARE },
    }),
  });
}

type Shape = { w: number; h: number };

function measure(level: number, s: Shape, perimeter: boolean): Exercise {
  const square = s.w === s.h;
  const answer = perimeter ? 2 * (s.w + s.h) : s.w * s.h;
  const key = `${square ? 'ex.square' : 'ex.rect'}.${perimeter ? 'perimeter' : 'area'}` as const;
  // Two examples whose perimeters differ and whose areas differ: one of them
  // never has this answer.
  const examples: Shape[] = square
    ? [
        { w: 5, h: 5 },
        { w: 4, h: 4 },
      ]
    : [
        { w: 5, h: 3 },
        { w: 6, h: 4 },
      ];
  const unit = perimeter ? CM : SQCM;
  return exercise({
    factId: `${key}:${s.w}x${s.h}`,
    topicId: ID,
    level,
    prompt: t(`${key}.prompt` as const),
    display: '',
    spoken: say(`${key}.spoken` as const, { w: { n: s.w, noun: CM }, h: { n: s.h, noun: CM } }),
    visual: { type: 'rect', width: s.w, height: s.h },
    answer,
    operation: perimeter ? 'add' : 'mul',
    input: numpad(3),
    hints: [
      hint(say(perimeter ? 'ex.perimeter.hint1' : 'ex.area.hint1')),
      hint(
        say(
          perimeter
            ? square
              ? 'ex.square.perimeter.hint2'
              : 'ex.rect.perimeter.hint2'
            : square
              ? 'ex.square.area.hint2'
              : 'ex.rect.area.hint2',
        ),
      ),
      exampleAvoiding(
        answer,
        examples.map((ex) => {
          const exAns = perimeter ? 2 * (ex.w + ex.h) : ex.w * ex.h;
          return {
            answer: exAns,
            hint: () =>
              exampleHint(
                perimeter
                  ? `${ex.w} + ${ex.h} + ${ex.w} + ${ex.h} = ${exAns}`
                  : `${ex.w} × ${ex.h} = ${exAns}`,
                say(`${key}.solution` as const, { r: { n: exAns, noun: unit } }),
              ),
          };
        }),
      ),
    ],
    solution: say(`${key}.solution` as const, { r: { n: answer, noun: unit } }),
    diagnose: (v) =>
      perimeter && v === s.w * s.h
        ? 'shapeFormula'
        : !perimeter && v === 2 * (s.w + s.h)
          ? 'shapeFormula'
          : !perimeter && v === s.w + s.h
            ? 'wrongOperation'
            : perimeter && v === s.w + s.h
              ? 'other'
              : null,
  });
}

function missingSide(level: 6 | 7, rng: Rng): Exercise {
  const w = randInt(rng, 3, 12);
  const h = randInt(rng, 2, 12);
  const fromArea = level === 6;
  const total = fromArea ? w * h : 2 * (w + h);
  const key = fromArea ? ('ex.missingSide.area' as const) : ('ex.missingSide.perimeter' as const);
  return exercise({
    factId: `${key}:${w}:${h}`,
    topicId: ID,
    level,
    // The given total is on screen too, not only heard.
    prompt: t(`${key}.prompt` as const, { params: { total } }),
    display: '',
    spoken: say(`${key}.spoken` as const, {
      total: { n: total, noun: fromArea ? SQCM : CM },
      w: { n: w, noun: CM },
    }),
    // The missing side is the question: drawn as "?", never with its length.
    visual: { type: 'rect', width: w, height: h, hide: 'height' },
    answer: h,
    operation: fromArea ? 'div' : 'sub',
    input: numpad(2),
    hints: [
      hint(say(`${key}.hint1` as const)),
      hint(say(`${key}.hint2` as const)),
      // A side of four, or of five when the missing side is four.
      exampleAvoiding(
        h,
        [4, 5].map((side) => ({
          answer: side,
          hint: () =>
            exampleHint(
              fromArea ? `${6 * side} ÷ 6 = ${side}` : `(${2 * (6 + side)} − 6 − 6) ÷ 2 = ${side}`,
              say(`${key}.solution` as const, { r: { n: side, noun: CM } }),
            ),
        })),
      ),
    ],
    solution: say(`${key}.solution` as const, { r: { n: h, noun: CM } }),
    diagnose: (v) =>
      fromArea && v === total - w
        ? 'wrongOperation'
        : !fromArea && v === total - w
          ? 'other'
          : null,
  });
}

const UNIT_NOUNS = {
  m: { singular: 'מטר', plural: 'מטרים', gender: 'm' },
  cm: { singular: 'סנטימטר', plural: 'סנטימטרים', gender: 'm' },
  mm: { singular: 'מילימטר', plural: 'מילימטרים', gender: 'm' },
  km: { singular: 'קילומטר', plural: 'קילומטרים', gender: 'm' },
} as const satisfies Record<string, Noun>;

/** Written units: "9 מ׳ = ? ס״מ", never the false "9 = 900". */
const ABBR = { m: 'מ׳', cm: 'ס״מ', mm: 'מ״מ', km: 'ק״מ' } as const;

const CONVERSIONS = [
  { from: 'm', to: 'cm', k: 100 },
  { from: 'cm', to: 'mm', k: 10 },
  { from: 'km', to: 'm', k: 1000 },
] as const;

/** 3 m = ? cm. Units are counted nouns: "שלושה מטרים", "שני קילומטרים". */
function convert(n: number, c: (typeof CONVERSIONS)[number]): Exercise {
  const answer = n * c.k;
  const from = UNIT_NOUNS[c.from];
  const to = UNIT_NOUNS[c.to];
  const exN = n === 3 ? 2 : 3;
  return exercise({
    factId: `conv:${n}${c.from}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.convert.prompt', { params: { to: to.plural, amount: `${n} ${from.plural}` } }),
    display: `${n} ${ABBR[c.from]} = ? ${ABBR[c.to]}`,
    spoken: say('ex.convert.spoken', { to: to.plural, amount: { n, noun: from } }),
    answer,
    operation: 'mul',
    input: numpad(5),
    hints: [
      hint(say('ex.convert.hint1', { one: from.singular, k: { n: c.k, noun: to } })),
      hint(say('ex.convert.hint2', { k: c.k })),
      exampleHint(
        `${exN} ${ABBR[c.from]} = ${exN * c.k} ${ABBR[c.to]}`,
        say('ex.convert.solution', {
          amount: { n: exN, noun: from },
          r: { n: exN * c.k, noun: to },
        }),
      ),
    ],
    solution: say('ex.convert.solution', { amount: { n, noun: from }, r: { n: answer, noun: to } }),
    diagnose: (v) => (v === n * (c.k / 10) || v === n * c.k * 10 ? 'placeValue' : null),
  });
}

function story(rng: Rng): Exercise {
  const fence = rng() < 0.5;
  // The length is the longer side; and not a garden whose perimeter and area are the same number.
  const x = randInt(rng, 3, 15);
  const y = randInt(rng, 2, 12);
  const [w, h] = [Math.max(x, y), Math.min(x, y)];
  if (sameNumbers({ w, h })) return story(rng);
  const who = CHARACTERS[(w + h) % CHARACTERS.length] as Character;
  const key = fence ? ('wp.fence' as const) : ('wp.carpet' as const);
  const answer = fence ? 2 * (w + h) : w * h;
  const unit: Noun = fence
    ? { singular: 'מטר', plural: 'מטרים', gender: 'm' }
    : { singular: 'מטר רבוע', plural: 'מטרים רבועים', gender: 'm' };
  const meter: Noun = { singular: 'מטר', plural: 'מטרים', gender: 'm' };
  const spoken = say(
    `${key}.story` as const,
    { name: who.name, w: { n: w, noun: meter }, h: { n: h, noun: meter } },
    who.gender,
  );
  return exercise({
    factId: `pwp:${key}:${w}x${h}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: { type: 'rect', width: w, height: h, unit: t('unit.m') },
    answer,
    operation: fence ? 'add' : 'mul',
    input: numpad(3),
    hints: [
      hint(say(`${key}.hint1` as const)),
      hint(say(fence ? 'ex.rect.perimeter.hint2' : 'ex.rect.area.hint2')),
      exampleAvoiding(
        answer,
        [
          { w: 5, h: 3 },
          { w: 6, h: 4 },
        ].map((ex) => {
          const exAns = fence ? 2 * (ex.w + ex.h) : ex.w * ex.h;
          return {
            answer: exAns,
            hint: () =>
              exampleHint(
                fence
                  ? `${ex.w} + ${ex.h} + ${ex.w} + ${ex.h} = ${exAns}`
                  : `${ex.w} × ${ex.h} = ${exAns}`,
                say(fence ? 'ex.rect.perimeter.solution' : 'ex.rect.area.solution', {
                  // In metres, like the story.
                  r: { n: exAns, noun: unit },
                }),
              ),
          };
        }),
      ),
    ],
    solution: say(`${key}.solution` as const, { r: { n: answer, noun: unit } }),
    diagnose: (v) =>
      fence && v === w * h ? 'shapeFormula' : !fence && v === 2 * (w + h) ? 'shapeFormula' : null,
  });
}

function storyBank(): string[] {
  const meter: Noun = { singular: 'מטר', plural: 'מטרים', gender: 'm' };
  const out: string[] = [];
  for (const key of ['wp.fence', 'wp.carpet'] as const) {
    for (const who of CHARACTERS) {
      out.push(
        ...say(
          `${key}.story` as const,
          { name: who.name, w: { n: 5, noun: meter }, h: { n: 3, noun: meter } },
          who.gender,
        ).parts,
      );
    }
  }
  return out;
}

const RECTS: Shape[] = range(2, 12).flatMap((w) =>
  range(2, 9)
    .filter((h) => h < w)
    .map((h) => ({ w, h })),
);
const SQUARES: Shape[] = range(2, 15).map((n) => ({ w: n, h: n }));

/** 4 × 4 and 6 × 3: perimeter and area are the same number, so "which one?" cannot be checked. */
const sameNumbers = (s: Shape) => 2 * (s.w + s.h) === s.w * s.h;

export const perimeterArea = defineTopic({
  id: ID,
  labelKey: 'topic.perimeterArea',
  grades: [4],
  startLevel: () => 1,
  extraBank: storyBank,
  levels: [
    closed(
      L(1),
      () => range(2, 8).flatMap((w) => range(2, 6).map((h) => ({ w, h }))),
      (s) => squares(s.w, s.h),
    ),
    closed(
      L(2),
      () => RECTS,
      (s) => measure(2, s, true),
    ),
    closed(
      L(3),
      () => RECTS,
      (s) => measure(3, s, false),
    ),
    closed(
      L(4),
      () => SQUARES,
      (s) => measure(4, s, true),
    ),
    closed(
      L(5),
      () => SQUARES,
      (s) => measure(5, s, false),
    ),
    open(L(6), (rng) => missingSide(6, rng)),
    open(L(7), (rng) => missingSide(7, rng)),
    closed(
      L(8),
      () => CONVERSIONS.flatMap((c) => range(2, 9).map((n) => ({ n, c }))),
      (x) => convert(x.n, x.c),
    ),
    // Perimeter or area, mixed: the classic confusion is answering the other one.
    closed(
      L(9),
      () =>
        [...RECTS, ...SQUARES]
          .filter((sh) => !sameNumbers(sh))
          .flatMap((sh) => [
            { sh, p: true },
            { sh, p: false },
          ]),
      (x) => measure(9, x.sh, x.p),
    ),
    open(L(10), story),
  ],
});
