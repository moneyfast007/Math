import { shown } from '@/lang/compose';
import { t } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  gcd,
  hint,
  numpad,
  range,
  say,
} from '../build';
import type { Exercise } from '../types';

/**
 * World 19, grade 6: "יחס". Simplifying, equivalent ratios, dividing a
 * quantity in a ratio, the whole from a part, map scale, unit price,
 * proportion, distance from speed and time.
 *
 * A ratio is read "שלוש לחמש": the ל belongs to the number, so these sentences
 * cannot be assembled from separate number clips. Every level is closed and
 * every sentence is recorded whole.
 */

const ID = 'ratio';
const L = (n: number) => `level.ratio.${n}`;
const r = (a: number, b: number) => `${a} : ${b}`;

/** 6 : 4 = 3 : ? */
function simplify(a: number, b: number): Exercise {
  const g = gcd(a, b);
  const answer = b / g;
  return exercise({
    factId: `rsimp:${a}:${b}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.ratio.missing.prompt'),
    display: `${r(a, b)} = ${a / g} : ?`,
    spoken: say('ex.ratio.simplify.spoken', { a, b, c: a / g }),
    answer,
    input: numpad(2),
    hints: [
      hint(say('ex.ratio.simplify.hint1')),
      hint(say('ex.ratio.simplify.hint2', { g })),
      // Not an example whose missing number is this answer: it would give it away.
      exampleAvoiding(
        answer,
        [
          { a: 6, b: 4 },
          { a: 10, b: 15 },
        ].map((ex) => {
          const eg = gcd(ex.a, ex.b);
          return {
            answer: ex.b / eg,
            hint: () =>
              exampleHint(
                `${r(ex.a, ex.b)} = ${r(ex.a / eg, ex.b / eg)}`,
                say('ex.ratio.equal.solution', { a: ex.a, b: ex.b, c: ex.a / eg, d: ex.b / eg }),
              ),
          };
        }),
      ),
    ],
    solution: say('ex.ratio.equal.solution', { a, b, c: a / g, d: answer }),
  });
}

/** 2 : 3 = ? : 12 */
function equivalent(a: number, b: number, k: number): Exercise {
  const answer = a * k;
  return exercise({
    factId: `requiv:${a}:${b}x${k}`,
    topicId: ID,
    level: 2,
    prompt: t('ex.ratio.missing.prompt'),
    display: `${r(a, b)} = ? : ${b * k}`,
    spoken: say('ex.ratio.equiv.spoken', { a, b, d: b * k }),
    answer,
    input: numpad(3),
    hints: [
      hint(say('ex.ratio.equiv.hint1', { b, d: b * k })),
      hint(say('ex.ratio.equiv.hint2')),
      // Not an example whose missing number is this answer: it would give it away.
      exampleAvoiding(
        answer,
        [
          { a: 2, b: 3, k: 4 },
          { a: 3, b: 4, k: 2 },
        ].map((ex) => ({
          answer: ex.a * ex.k,
          hint: () =>
            exampleHint(
              `${r(ex.a, ex.b)} = ${r(ex.a * ex.k, ex.b * ex.k)}`,
              say('ex.ratio.equal.solution', { a: ex.a, b: ex.b, c: ex.a * ex.k, d: ex.b * ex.k }),
            ),
        })),
      ),
    ],
    solution: say('ex.ratio.equal.solution', { a, b, c: answer, d: b * k }),
    diagnose: (v) => (v === a + (b * k - b) ? 'other' : null),
  });
}

const PART: Noun = { singular: 'חלק', plural: 'חלקים', gender: 'm' };
const BOYS: Noun = { singular: 'בן', plural: 'בנים', gender: 'm' };

/** Boys to girls a : b, total n: how many boys (level 3) / girls (level 4)? */
function divide(level: 3 | 4, a: number, b: number, n: number): Exercise {
  const unit = n / (a + b);
  const boys = a * unit;
  const girls = b * unit;
  const askBoys = level === 3;
  // The example shows one part, the boys and the girls: none of them may be this answer.
  const shares = (e: { a: number; b: number; n: number }) => {
    const u = e.n / (e.a + e.b);
    return [u, e.a * u, e.b * u];
  };
  const first = { a: 2, b: 3, n: 20 };
  const ex = shares(first).includes(askBoys ? boys : girls) ? { a: 1, b: 3, n: 20 } : first;
  const exU = ex.n / (ex.a + ex.b);
  return exercise({
    factId: `rdiv${level}:${a}:${b}:${n}`,
    topicId: ID,
    level,
    prompt: t(askBoys ? 'ex.ratio.divide.promptBoys' : 'ex.ratio.divide.promptGirls'),
    display: r(a, b),
    spoken: say(askBoys ? 'ex.ratio.divide.spokenBoys' : 'ex.ratio.divide.spokenGirls', {
      a,
      b,
      n: { n, noun: CHILD },
    }),
    answer: askBoys ? boys : girls,
    input: numpad(3),
    hints: [
      hint(say('ex.ratio.divide.hint1', { a, b, parts: { n: a + b, noun: PART } })),
      hint(say('ex.ratio.divide.hint2')),
      exampleHint(
        `${ex.n} ÷ ${ex.a + ex.b} = ${exU}`,
        say('ex.ratio.divide.solution', {
          boys: { n: ex.a * exU, noun: BOYS },
          girls: { n: ex.b * exU, noun: GIRLS },
        }),
      ),
    ],
    solution: say('ex.ratio.divide.solution', {
      boys: { n: boys, noun: BOYS },
      girls: { n: girls, noun: GIRLS },
    }),
    diagnose: (v) => (v === (askBoys ? girls : boys) ? 'other' : v === unit ? 'other' : null),
  });
}

const GIRLS: Noun = { singular: 'בת', plural: 'בנות', gender: 'f' };
const CHILD: Noun = { singular: 'ילד', plural: 'ילדים', gender: 'm' };

/** a : b, and there are x boys: how many children altogether? */
function wholeFromPart(a: number, b: number, unit: number): Exercise {
  const boys = a * unit;
  const total = (a + b) * unit;
  // The example shows its boys and its total: neither may be this answer.
  const first = { a: 2, b: 3, unit: 4 };
  const ex =
    first.a * first.unit === total || (first.a + first.b) * first.unit === total
      ? { a: 1, b: 2, unit: 5 }
      : first;
  return exercise({
    factId: `rwhole:${a}:${b}:${unit}`,
    topicId: ID,
    level: 5,
    prompt: t('ex.ratio.whole.prompt'),
    display: r(a, b),
    spoken: say('ex.ratio.whole.spoken', { a, b, boys: { n: boys, noun: BOYS } }),
    answer: total,
    input: numpad(3),
    hints: [
      hint(say('ex.ratio.whole.hint1', { a })),
      hint(say('ex.ratio.whole.hint2', { parts: { n: a + b, noun: PART } })),
      exampleHint(
        `${ex.a * ex.unit} → ${(ex.a + ex.b) * ex.unit}`,
        say('ex.ratio.whole.solution', { total: { n: (ex.a + ex.b) * ex.unit, noun: CHILD } }),
      ),
    ],
    solution: say('ex.ratio.whole.solution', { total: { n: total, noun: CHILD } }),
    diagnose: (v) => (v === b * unit ? 'other' : null),
  });
}

const CM: Noun = { singular: 'סנטימטר', plural: 'סנטימטרים', gender: 'm' };
const M: Noun = { singular: 'מטר', plural: 'מטרים', gender: 'm' };

/** On a 1 : 100 (level 6) or 1 : 1000 (level 7) map, x cm are ? m. */
function scale(level: 6 | 7, x: number): Exercise {
  const k = level === 6 ? 100 : 1000;
  const answer = (x * k) / 100;
  const ex = x === 3 ? 4 : 3;
  return exercise({
    factId: `rscale${k}:${x}`,
    topicId: ID,
    level,
    prompt: t('ex.ratio.scale.prompt'),
    display: `1 : ${k}`,
    spoken: say(level === 6 ? 'ex.ratio.scale.spoken100' : 'ex.ratio.scale.spoken1000', {
      x: { n: x, noun: CM },
    }),
    answer,
    input: numpad(3),
    hints: [
      hint(say(level === 6 ? 'ex.ratio.scale.hint100' : 'ex.ratio.scale.hint1000')),
      hint(say('ex.ratio.scale.hint2')),
      exampleHint(
        `${ex} → ${(ex * k) / 100}`,
        say('ex.ratio.scale.solution', {
          x: { n: ex, noun: CM },
          m: { n: (ex * k) / 100, noun: M },
        }),
      ),
    ],
    solution: say('ex.ratio.scale.solution', { x: { n: x, noun: CM }, m: { n: answer, noun: M } }),
    diagnose: (v) => (v === x * k ? 'placeValue' : v === (x * k) / 1000 ? 'placeValue' : null),
  });
}

const NOTEBOOK: Noun = { singular: 'מחברת', plural: 'מחברות', gender: 'f' };

/** k notebooks cost c: one costs ? (level 8); m notebooks cost ? (level 9). */
function price(level: 8 | 9, k: number, each: number, m: number): Exercise {
  const total = k * each;
  const answer = level === 8 ? each : m * each;
  // Not an example whose answer is this one: it would give it away.
  const first = { k: 3, each: 4, m: 5 };
  const e =
    (level === 8 ? first.each : first.each * first.m) === answer ? { k: 4, each: 3, m: 6 } : first;
  const spoken =
    level === 8
      ? say('ex.ratio.unit.spoken', { k: { n: k, noun: NOTEBOOK }, total })
      : say('ex.ratio.prop.spoken', {
          k: { n: k, noun: NOTEBOOK },
          total,
          m: { n: m, noun: NOTEBOOK },
        });
  return exercise({
    factId: `rprice${level}:${k}:${each}:${m}`,
    topicId: ID,
    level,
    // The data on screen too (with digits), not only heard.
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    operation: level === 8 ? 'div' : 'mul',
    input: numpad(3),
    hints: [
      hint(say(level === 8 ? 'ex.ratio.unit.hint1' : 'ex.ratio.prop.hint1')),
      hint(say('ex.ratio.unit.hint2')),
      level === 8
        ? exampleHint(
            `${e.k * e.each} ÷ ${e.k} = ${e.each}`,
            say('ex.ratio.unit.solution', { each: e.each }),
          )
        : exampleHint(
            `${e.k * e.each} ÷ ${e.k} × ${e.m} = ${e.each * e.m}`,
            say('ex.ratio.prop.solution', { m: { n: e.m, noun: NOTEBOOK }, r: e.each * e.m }),
          ),
    ],
    solution:
      level === 8
        ? say('ex.ratio.unit.solution', { each })
        : say('ex.ratio.prop.solution', { m: { n: m, noun: NOTEBOOK }, r: answer }),
    diagnose: (v) => (level === 9 && v === total + (m - k) ? 'other' : null),
  });
}

const KM: Noun = { singular: 'קילומטר', plural: 'קילומטרים', gender: 'm' };
const HOUR: Noun = { singular: 'שעה', plural: 'שעות', gender: 'f' };

/** A car drives v km an hour for h hours. */
function distance(v: number, h: number): Exercise {
  const answer = v * h;
  // Not an example whose distance is this answer: it would give it away.
  const e = answer === 60 * 3 ? { v: 50, h: 2 } : { v: 60, h: 3 };
  return exercise({
    factId: `rdist:${v}x${h}`,
    topicId: ID,
    level: 10,
    // The data on screen too (with digits), not only heard.
    prompt: shown(say('ex.ratio.dist.spoken', { v: { n: v, noun: KM }, h: { n: h, noun: HOUR } })),
    display: '',
    spoken: say('ex.ratio.dist.spoken', { v: { n: v, noun: KM }, h: { n: h, noun: HOUR } }),
    answer,
    operation: 'mul',
    input: numpad(4),
    hints: [
      hint(say('ex.ratio.dist.hint1')),
      hint(say('ex.ratio.dist.hint2')),
      exampleHint(
        `${e.v} × ${e.h} = ${e.v * e.h}`,
        say('ex.ratio.dist.solution', { d: { n: e.v * e.h, noun: KM } }),
      ),
    ],
    solution: say('ex.ratio.dist.solution', { d: { n: answer, noun: KM } }),
    diagnose: (v2) => (v2 === v + h ? 'wrongOperation' : null),
  });
}

const SMALL = range(1, 6);

/** k notebooks at `each` shekels. */
const UNIT_FACTS = range(3, 6).flatMap((k) => range(2, 9).map((each) => ({ k, each })));
/** k notebooks at `each` shekels, asked about m notebooks. */
const PROPORTION_FACTS = range(3, 5).flatMap((k) =>
  range(2, 9).flatMap((each) => [k + 2, k + 4].map((m) => ({ k, each, m }))),
);

export const ratio = defineTopic({
  id: ID,
  labelKey: 'topic.ratio',
  grades: [6],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () =>
        range(2, 20).flatMap((a) =>
          range(2, 20)
            .filter((b) => b !== a && gcd(a, b) > 1)
            .map((b) => ({ a, b })),
        ),
      (x) => simplify(x.a, x.b),
    ),
    closed(
      L(2),
      () =>
        SMALL.flatMap((a) =>
          SMALL.filter((b) => b !== a && gcd(a, b) === 1).flatMap((b) =>
            range(2, 6).map((k) => ({ a, b, k })),
          ),
        ),
      (x) => equivalent(x.a, x.b, x.k),
    ),
    closed(
      L(3),
      () =>
        SMALL.flatMap((a) =>
          SMALL.filter((b) => gcd(a, b) === 1 && a + b <= 8).flatMap((b) =>
            range(2, 6).map((u) => ({ a, b, n: (a + b) * u })),
          ),
        ),
      (x) => divide(3, x.a, x.b, x.n),
    ),
    closed(
      L(4),
      () =>
        SMALL.flatMap((a) =>
          SMALL.filter((b) => gcd(a, b) === 1 && a + b <= 8).flatMap((b) =>
            range(2, 6).map((u) => ({ a, b, n: (a + b) * u })),
          ),
        ),
      (x) => divide(4, x.a, x.b, x.n),
    ),
    closed(
      L(5),
      () =>
        SMALL.flatMap((a) =>
          SMALL.filter((b) => gcd(a, b) === 1 && a + b <= 8).flatMap((b) =>
            range(2, 6).map((unit) => ({ a, b, unit })),
          ),
        ).filter((x) => x.a * x.unit >= 3),
      (x) => wholeFromPart(x.a, x.b, x.unit),
    ),
    closed(
      L(6),
      () => range(2, 12),
      (x) => scale(6, x),
    ),
    closed(
      L(7),
      () => range(2, 12),
      (x) => scale(7, x),
    ),
    closed(
      L(8),
      () => UNIT_FACTS,
      (x) => price(8, x.k, x.each, 0),
    ),
    closed(
      L(9),
      () => PROPORTION_FACTS,
      (x) => price(9, x.k, x.each, x.m),
    ),
    closed(
      L(10),
      () => [40, 50, 60, 70, 80, 90, 100].flatMap((v) => range(2, 5).map((h) => ({ v, h }))),
      (x) => distance(x.v, x.h),
    ),
  ],
});
