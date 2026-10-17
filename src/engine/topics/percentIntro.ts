import { t, type TranslationKey } from '@/i18n';
import type { Slot } from '@/lang/compose';
import type { Gender } from '@/lang/gender';
import type { Noun } from '@/lang/hebrewNumbers';
import { displayFraction as f, fractionWords as w } from '@/lang/fractions';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  range,
  round,
  say,
  type Character,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Rng } from '../types';

/**
 * World 16, grade 5: "אחוזים: היכרות". A percent as part of a hundred, the
 * familiar percents as fractions (50% = half, 25% = quarter, 10% = tenth),
 * fractions and decimals as percents, a percent of a quantity, what is left,
 * what percent one number is of another, a first discount story.
 */

const ID = 'percent-intro';
const PERCENT: Noun = { singular: 'אחוז', plural: 'אחוזים', gender: 'm' };

/** Like `say`, but the percent slots are read as "עשרים וחמישה אחוזים" (masculine noun). */
function sayP(
  key: TranslationKey,
  slots: Record<string, Slot> = {},
  gender: Gender = 'f',
  percentSlots: readonly string[] = ['p'],
) {
  const out: Record<string, Slot> = { ...slots };
  for (const k of percentSlots) {
    const v = slots[k];
    if (typeof v === 'number') out[k] = { n: v, noun: PERCENT };
  }
  return say(key, out, gender);
}
const L = (n: number) => `level.percentIntro.${n}`;

/** A bar of ten: what percent is coloured? */
function shaded(k: number): Exercise {
  const answer = k * 10;
  return exercise({
    factId: `pshade:${k}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.pct.shaded.prompt'),
    display: '?%',
    spoken: sayP('ex.pct.shaded.prompt'),
    visual: { type: 'fraction', parts: 10, shaded: k },
    answer,
    input: numpad(3),
    hints: [
      hint(sayP('ex.pct.shaded.hint1')),
      hint(sayP('ex.pct.shaded.hint2')),
      exampleHint(
        k === 3 ? '7 → 70%' : '3 → 30%',
        sayP('ex.pct.shaded.solution', { k: k === 3 ? 7 : 3, p: k === 3 ? 70 : 30 }),
      ),
    ],
    solution: sayP('ex.pct.shaded.solution', { k, p: answer }),
    diagnose: (v) => (v === k ? 'placeValue' : null),
  });
}

const FAMILIAR: readonly [number, number][] = [
  [50, 2],
  [25, 4],
  [20, 5],
  [10, 10],
];

/** 25% = 1/? */
function familiar(p: number, d: number): Exercise {
  return exercise({
    factId: `pfam:${p}`,
    topicId: ID,
    level: 2,
    prompt: t('ex.fmul.denominator.prompt'),
    display: `${p}% = 1/?`,
    spoken: sayP('ex.pct.familiar.spoken', { p }),
    visual: { type: 'fraction', parts: d, shaded: 1 },
    answer: d,
    input: numpad(3),
    hints: [
      hint(sayP('ex.pct.familiar.hint1', { p })),
      hint(sayP('ex.pct.familiar.hint2')),
      exampleHint(
        p === 50 ? '25% = 1/4' : '50% = 1/2',
        sayP(
          'ex.pct.familiar.solution',
          p === 50 ? { p: 25, frac: w(1, 4) } : { p: 50, frac: w(1, 2) },
        ),
      ),
    ],
    solution: sayP('ex.pct.familiar.solution', { p, frac: w(1, d) }),
  });
}

/** 3/4 = ?% */
function fromFraction(n: number, d: number): Exercise {
  const answer = (n * 100) / d;
  const ex = n === 3 && d === 4 ? { n: 2, d: 5 } : { n: 3, d: 4 };
  return exercise({
    factId: `pfrac:${n}/${d}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.pct.howMany.prompt'),
    display: `${f(n, d)} = ?%`,
    spoken: sayP('ex.pct.fromFrac.spoken', { frac: w(n, d) }),
    visual: { type: 'fraction', parts: d, shaded: n },
    answer,
    input: numpad(3),
    hints: [
      hint(sayP('ex.pct.fromFrac.hint1')),
      hint(sayP('ex.pct.fromFrac.hint2', { d })),
      exampleHint(
        `${f(ex.n, ex.d)} = ${(ex.n * 100) / ex.d}%`,
        sayP('ex.pct.fromFrac.solution', { frac: w(ex.n, ex.d), p: (ex.n * 100) / ex.d }),
      ),
    ],
    solution: sayP('ex.pct.fromFrac.solution', { frac: w(n, d), p: answer }),
    diagnose: (v) => (v === n * 10 ? 'other' : null),
  });
}

/** 0.35 = ?% (level 4), 40% = ? as a decimal (level 5). */
function decimal(level: 4 | 5, p: number): Exercise {
  const x = round(p / 100, 2);
  const toPercent = level === 4;
  const ex = p === 35 ? 60 : 35;
  return exercise({
    factId: `pdec${level}:${p}`,
    topicId: ID,
    level,
    prompt: t(toPercent ? 'ex.pct.howMany.prompt' : 'ex.dec.fromFrac.prompt'),
    display: toPercent ? `${x} = ?%` : `${p}% = ?`,
    spoken: toPercent ? sayP('ex.pct.fromDec.spoken', { x }) : sayP('ex.pct.toDec.spoken', { p }),
    answer: toPercent ? p : x,
    input: toPercent ? numpad(3) : numpad(3, true),
    hints: [
      hint(sayP('ex.pct.dec.hint1')),
      hint(say(toPercent ? 'ex.pct.dec.hint2to' : 'ex.pct.dec.hint2from')),
      exampleHint(
        `${round(ex / 100, 2)} = ${ex}%`,
        sayP('ex.pct.dec.solution', { x: round(ex / 100, 2), p: ex }),
      ),
    ],
    solution: sayP('ex.pct.dec.solution', { x, p }),
    diagnose: (v) =>
      toPercent
        ? v === x || v === p / 10
          ? 'placeValue'
          : null
        : v === p || v === p / 10
          ? 'placeValue'
          : null,
  });
}

/** 50%, 25%, 10% of a quantity (level 6); any ten-percent step (level 7). */
function percentOf(level: 6 | 7, rng: Rng): Exercise {
  const p = level === 6 ? pick(rng, [50, 25, 10]) : randInt(rng, 1, 9) * 10;
  const base =
    level === 6
      ? p === 25
        ? randInt(rng, 2, 25) * 4
        : randInt(rng, 2, 50) * (p === 50 ? 2 : 10)
      : randInt(rng, 1, 30) * 10;
  const answer = (base * p) / 100;
  return exercise({
    factId: `pof:${p}%${base}`,
    topicId: ID,
    level,
    prompt: t('ex.pct.of.prompt'),
    display: `${p}% × ${base} = ?`,
    spoken: sayP('ex.pct.of.spoken', { p, base }),
    answer,
    operation: 'mul',
    input: numpad(3),
    hints: [
      hint(say(level === 6 ? 'ex.pct.of.hint1familiar' : 'ex.pct.of.hint1tens')),
      hint(sayP('ex.pct.of.hint2', { base })),
      exampleHint(
        base === 80 && p === 30 ? '20% × 50 = 10' : '30% × 80 = 24',
        sayP(
          'ex.pct.of.solution',
          base === 80 && p === 30 ? { p: 20, base: 50, r: 10 } : { p: 30, base: 80, r: 24 },
        ),
      ),
    ],
    solution: sayP('ex.pct.of.solution', { p, base, r: answer }),
    diagnose: (v) => (v === base - answer ? 'other' : null),
  });
}

/** 100% − 35% = ?% */
function rest(p: number): Exercise {
  const answer = 100 - p;
  return exercise({
    factId: `prest:${p}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.pct.rest.prompt'),
    display: `100% − ${p}% = ?%`,
    spoken: sayP('ex.pct.rest.spoken', { p }),
    answer,
    operation: 'sub',
    input: numpad(3),
    hints: [
      hint(sayP('ex.pct.rest.hint1')),
      hint(sayP('ex.pct.rest.hint2')),
      // Never the exercise itself.
      p === 35
        ? exampleHint('100% − 40% = 60%', sayP('ex.pct.rest.solution', { p: 40, r: 60 }, 'f', ['p', 'r']))
        : exampleHint('100% − 35% = 65%', sayP('ex.pct.rest.solution', { p: 35, r: 65 }, 'f', ['p', 'r'])),
    ],
    solution: sayP('ex.pct.rest.solution', { p, r: answer }, 'f', ['p', 'r']),
  });
}

/** 15 out of 60 is ?% */
function whatPercent(rng: Rng): Exercise {
  const base = pick(rng, [20, 25, 50, 200, 10, 4, 5]);
  const p = pick(
    rng,
    base === 4
      ? [25, 50, 75]
      : base === 5
        ? [20, 40, 60, 80]
        : [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90],
  );
  const part = (base * p) / 100;
  if (!Number.isInteger(part) || part === 0) return whatPercent(rng);
  return exercise({
    factId: `pwhat:${part}/${base}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.pct.howMany.prompt'),
    display: `${part} / ${base} = ?%`,
    spoken: sayP('ex.pct.what.spoken', { part, base }),
    answer: p,
    input: numpad(3),
    hints: [
      hint(sayP('ex.pct.what.hint1')),
      hint(sayP('ex.pct.what.hint2', { base })),
      exampleHint(
        part === 15 && base === 60 ? '10 / 50 = 20%' : '15 / 60 = 25%',
        sayP(
          'ex.pct.what.solution',
          part === 15 && base === 60
            ? { part: 10, base: 50, p: 20 }
            : { part: 15, base: 60, p: 25 },
        ),
      ),
    ],
    solution: sayP('ex.pct.what.solution', { part, base, p }),
    diagnose: (v) => (v === part ? 'other' : null),
  });
}

/** The discount in shekels. */
function story(rng: Rng): Exercise {
  const p = pick(rng, [10, 20, 25, 50]);
  const price = p === 25 ? randInt(rng, 3, 30) * 4 : randInt(rng, 2, 40) * 10;
  const who = CHARACTERS[price % CHARACTERS.length] as Character;
  const answer = (price * p) / 100;
  const spoken = sayP('wp.pct.discount.story', { name: who.name, price, p }, who.gender);
  return exercise({
    factId: `pwp:${price}:${p}`,
    topicId: ID,
    level: 10,
    prompt: spoken.text,
    display: '',
    spoken,
    answer,
    operation: 'mul',
    input: numpad(3),
    hints: [
      hint(sayP('wp.pct.discount.hint1')),
      {
        ...hint(say('hint.equation')),
        example: { display: `${p}% × ${price} = ?`, spoken: say('hint.equation').text },
      },
      exampleHint(
        price === 80 && p === 25 ? '10% × 50 = 5' : '25% × 80 = 20',
        sayP(
          'ex.pct.of.solution',
          price === 80 && p === 25 ? { p: 10, base: 50, r: 5 } : { p: 25, base: 80, r: 20 },
        ),
      ),
    ],
    solution: sayP('ex.pct.of.solution', { p, base: price, r: answer }),
    diagnose: (v) => (v === price - answer ? 'other' : null),
  });
}

function storyBank(): string[] {
  return CHARACTERS.flatMap(
    (who) => sayP('wp.pct.discount.story', { name: who.name, price: 80, p: 25 }, who.gender).parts,
  );
}

export const percentIntro = defineTopic({
  id: ID,
  labelKey: 'topic.percentIntro',
  grades: [5],
  startLevel: () => 1,
  extraBank: storyBank,
  levels: [
    closed(
      L(1),
      () => range(1, 9),
      (k) => shaded(k),
    ),
    closed(
      L(2),
      () => FAMILIAR,
      ([p, d]) => familiar(p, d),
    ),
    closed(
      L(3),
      () =>
        [
          [1, 2],
          [1, 4],
          [3, 4],
          [1, 5],
          [2, 5],
          [3, 5],
          [4, 5],
          ...range(1, 9).map((n) => [n, 10]),
        ] as [number, number][],
      ([n, d]) => fromFraction(n, d),
    ),
    closed(
      L(4),
      () => range(1, 99).filter((p) => p % 5 === 0),
      (p) => decimal(4, p),
    ),
    closed(
      L(5),
      () => range(1, 99).filter((p) => p % 5 === 0),
      (p) => decimal(5, p),
    ),
    open(L(6), (rng) => percentOf(6, rng)),
    open(L(7), (rng) => percentOf(7, rng)),
    closed(
      L(8),
      () => range(1, 99).filter((p) => p % 5 === 0),
      (p) => rest(p),
    ),
    open(L(9), whatPercent),
    open(L(10), story),
  ],
});
