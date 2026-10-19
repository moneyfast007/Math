import { shown, type Slot } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
import type { Gender } from '@/lang/gender';
import { numberToWords, type Noun } from '@/lang/hebrewNumbers';
import {
  displayFraction as f,
  FRACTION_NOUNS,
  fractionWords as w,
} from '@/lang/fractions';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  gcd,
  hint,
  numpad,
  open,
  range,
  round,
  say,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng, Visual } from '../types';

/**
 * Grades 5 and 6: "אחוזים: היכרות". A percent as part of a hundred (bars of
 * 2 to 20 parts), the familiar percents as fractions (50% = half, 5% = 1/20),
 * fractions and decimals as percents and back, all of them mixed, a percent
 * of a quantity, what is left, what percent one number is of another, and
 * discount stories (the discount, or what is paid).
 */

const ID = 'percent-intro';
const PERCENT: Noun = { singular: 'אחוז', plural: 'אחוזים', gender: 'm' };

/** Like `say`, but the percent slots are read as "עשרים וחמישה אחוזים" (masculine noun). */
export function sayP(
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

/**
 * Hint 3 for "p% × base = ?": the first [p, base] whose result is not this
 * exercise's answer, which the example would give away.
 */
export function percentOfExample(answer: number, options: readonly [number, number][]): Hint {
  return exampleAvoiding(
    answer,
    options.map(([p, base]) => {
      const r = (p * base) / 100;
      return {
        answer: r,
        hint: () => exampleHint(`${p}% × ${base} = ${r}`, sayP('ex.pct.of.solution', { p, base, r })),
      };
    }),
  );
}

/** Hint 3 for "part / base = ?%": the first [part, base] whose percent is not this answer. */
export function whatPercentExample(answer: number, options: readonly [number, number][]): Hint {
  return exampleAvoiding(
    answer,
    options.map(([part, base]) => {
      const p = (part * 100) / base;
      return {
        answer: p,
        hint: () =>
          exampleHint(`${part} / ${base} = ${p}%`, sayP('ex.pct.what.solution', { part, base, p })),
      };
    }),
  );
}

/** A fraction read aloud: "שלושה רבעים", or "שלוש חלקי עשרים" when the denominator has no word. */
function fracWords(n: number, d: number): string {
  return FRACTION_NOUNS[d] ? w(n, d) : `${numberToWords(n)} חלקי ${numberToWords(d)}`;
}

/** A bar for a fraction, when it is not too fine to see (up to 20 parts). */
function barOf(n: number, d: number): Visual | undefined {
  return d <= 20 ? { type: 'fraction', parts: d, shaded: n } : undefined;
}

/* ---------- Level 1: what percent of the bar is coloured? ---------- */

/** k of `parts` cells coloured: a bar of 2, 4, 5, 10 or 20, so not always tens. */
function shaded(parts: number, k: number): Exercise {
  const each = 100 / parts;
  const answer = k * each;
  const solved = (x: number, d: number) =>
    sayP('pi.shaded.solution', {
      k: { n: x, gender: 'm' },
      parts: { n: d, gender: 'm' },
      p: (x * 100) / d,
    });
  return exercise({
    factId: `pshade:${k}/${parts}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.pct.shaded.prompt'),
    display: '?%',
    spoken: sayP('ex.pct.shaded.prompt'),
    visual: { type: 'fraction', parts, shaded: k },
    answer,
    input: numpad(3),
    hints: [
      hint(sayP('pi.shaded.hint1', { parts: { n: parts, noun: { singular: 'חלק', plural: 'חלקים', gender: 'm' } } })),
      // What one part is worth, for this bar.
      hint(sayP('pi.shaded.hint2', { p: each })),
      exampleAvoiding(
        answer,
        [
          [3, 10],
          [1, 4],
        ].map(([x, d]) => ({
          answer: ((x as number) * 100) / (d as number),
          hint: () =>
            exampleHint(`${x}/${d} → ${((x as number) * 100) / (d as number)}%`, solved(x as number, d as number)),
        })),
      ),
    ],
    solution: solved(k, parts),
    // The coloured cells counted, not turned into percents.
    diagnose: (v) => (v === k ? (parts === 10 ? 'placeValue' : 'other') : null),
  });
}

/* ---------- Level 2: the familiar ones, both ways ---------- */

/** 25% = 1/? (asks the denominator), or 1/4 = ?% (asks the percent). */
function familiar(d: number, toFraction: boolean): Exercise {
  const p = 100 / d;
  const solved = (dd: number) => sayP('ex.pct.familiar.solution', { p: 100 / dd, frac: fracWords(1, dd) });
  const exD = [4, 2].find((x) => x !== d) as number;
  return exercise({
    factId: `pfam:${toFraction ? 'f' : 'p'}:${d}`,
    topicId: ID,
    level: 2,
    prompt: t(toFraction ? 'ex.fmul.denominator.prompt' : 'ex.pct.howMany.prompt'),
    display: toFraction ? `${p}% = 1/?` : `${f(1, d)} = ?%`,
    spoken: toFraction
      ? sayP('ex.pct.familiar.spoken', { p })
      : sayP('ex.pct.fromFrac.spoken', { frac: fracWords(1, d) }),
    ...(barOf(1, d) ? { visual: barOf(1, d) as Visual } : {}),
    answer: toFraction ? d : p,
    input: numpad(3),
    hints: [
      hint(sayP(toFraction ? 'ex.pct.familiar.hint1' : 'ex.pct.fromFrac.hint1', { p })),
      hint(sayP(toFraction ? 'ex.pct.familiar.hint2' : 'ex.pct.fromFrac.hint2', { d })),
      exampleHint(toFraction ? `${100 / exD}% = 1/${exD}` : `1/${exD} = ${100 / exD}%`, solved(exD)),
    ],
    solution: solved(d),
    // The denominator and the percent swapped.
    diagnose: (v) => (v === (toFraction ? p : d) ? 'other' : null),
  });
}

/* ---------- Level 3: from a fraction to a percent ---------- */

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
    spoken: sayP('ex.pct.fromFrac.spoken', { frac: fracWords(n, d) }),
    ...(barOf(n, d) ? { visual: barOf(n, d) as Visual } : {}),
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
    solution: sayP('ex.pct.fromFrac.solution', { frac: fracWords(n, d), p: answer }),
    // The numerator times ten: right only for tenths.
    diagnose: (v) => (v === n * 10 ? 'other' : null),
  });
}

/* ---------- Levels 4–5: decimals and percents, both ways; then everything mixed ---------- */

/** 0.35 = ?% (to a percent), or 40% = ? as a decimal; the example and solution go the same way. */
function decimal(level: 4 | 5, p: number, toPercent: boolean): Exercise {
  const x = round(p / 100, 2);
  const ex = p === 35 ? 60 : 35;
  const exX = round(ex / 100, 2);
  return exercise({
    factId: `pdec${level}:${toPercent ? 'p' : 'd'}:${p}`,
    topicId: ID,
    level,
    prompt: t(toPercent ? 'ex.pct.howMany.prompt' : 'pi.toDec.prompt'),
    display: toPercent ? `${x} = ?%` : `${p}% = ?`,
    spoken: toPercent ? sayP('ex.pct.fromDec.spoken', { x }) : sayP('ex.pct.toDec.spoken', { p }),
    answer: toPercent ? p : x,
    input: toPercent ? numpad(3) : numpad(3, true),
    hints: [
      hint(sayP('ex.pct.dec.hint1')),
      hint(say(toPercent ? 'ex.pct.dec.hint2to' : 'ex.pct.dec.hint2from')),
      toPercent
        ? exampleHint(`${exX} = ${ex}%`, sayP('ex.pct.dec.solution', { x: exX, p: ex }))
        : exampleHint(`${ex}% = ${exX}`, sayP('pi.toDec.solution', { x: exX, p: ex })),
    ],
    solution: toPercent
      ? sayP('ex.pct.dec.solution', { x, p })
      : sayP('pi.toDec.solution', { x, p }),
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

/** 40% = ?/5: a percent as a fraction with this denominator (the numerator is asked). */
function toFraction(n: number, d: number): Exercise {
  const p = (n * 100) / d;
  const ex = n === 3 && d === 4 ? { n: 2, d: 5 } : { n: 3, d: 4 };
  const solved = (a: number, b: number) =>
    sayP('ex.pct.familiar.solution', { p: (a * 100) / b, frac: fracWords(a, b) });
  return exercise({
    factId: `ptofrac:${n}/${d}`,
    topicId: ID,
    level: 5,
    prompt: t('ex.frac.expand.prompt'),
    display: `${p}% = ?/${d}`,
    spoken: sayP('pi.toFrac.spoken', { p, plural: (FRACTION_NOUNS[d] as Noun).plural }),
    ...(barOf(n, d) ? { visual: { type: 'fraction', parts: d, shaded: 0 } as Visual } : {}),
    answer: n,
    input: numpad(2),
    hints: [
      hint(sayP('pi.toFrac.hint1', { p })),
      hint(sayP('pi.toFrac.hint2', { d, k: 100 / d }, 'f', ['k'])),
      exampleHint(`${(ex.n * 100) / ex.d}% = ${f(ex.n, ex.d)}`, solved(ex.n, ex.d)),
    ],
    solution: solved(n, d),
    diagnose: (v) => (v === p ? 'other' : null),
  });
}

/** Proper fractions with a denominator that divides a hundred, in lowest terms. */
const FRACTIONS: [number, number][] = [2, 4, 5, 10, 20, 25, 50].flatMap((d) =>
  range(1, d - 1)
    .filter((n) => gcd(n, d) === 1)
    .map((n): [number, number] => [n, d]),
);

/** Level 5: any of the four ways between fractions, decimals and percents. */
function mixed(rng: Rng): Exercise {
  const way = pick(rng, ['fracToPct', 'pctToFrac', 'decToPct', 'pctToDec'] as const);
  if (way === 'fracToPct' || way === 'pctToFrac') {
    // Fractions with a word for the denominator, so the question can say "כמה חמישיות".
    const [n, d] = pick(
      rng,
      FRACTIONS.filter(([, dd]) => way === 'fracToPct' || FRACTION_NOUNS[dd] !== undefined),
    );
    const e = way === 'fracToPct' ? fromFraction(n, d) : toFraction(n, d);
    return { ...e, level: 5 };
  }
  const p = pick(rng, [...range(1, 9), ...range(10, 95, 5), 12, 48, 64, 85]);
  return decimal(5, p, way === 'decToPct');
}

/* ---------- Levels 6–7: a percent of a quantity ---------- */

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
      // The shortcut for this percent: half, a quarter, or a tenth.
      hint(
        sayP(
          p === 50 ? 'ex.pct.of.hint2half' : p === 25 ? 'ex.pct.of.hint2quarter' : 'ex.pct.of.hint2',
          { base },
        ),
      ),
      // Level 6: an example with one of the level's own percents.
      percentOfExample(
        answer,
        level === 6
          ? [
              [25, 60],
              [50, 40],
            ]
          : [
              [30, 80],
              [20, 50],
            ],
      ),
    ],
    solution: sayP('ex.pct.of.solution', { p, base, r: answer }),
    diagnose: (v) => (v === base - answer ? 'other' : null),
  });
}

/* ---------- Level 8: what is left of a hundred ---------- */

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
        ? exampleHint(
            '100% − 40% = 60%',
            sayP('ex.pct.rest.solution', { p: 40, r: 60 }, 'f', ['p', 'r']),
          )
        : exampleHint(
            '100% − 35% = 65%',
            sayP('ex.pct.rest.solution', { p: 35, r: 65 }, 'f', ['p', 'r']),
          ),
    ],
    solution: sayP('ex.pct.rest.solution', { p, r: answer }, 'f', ['p', 'r']),
  });
}

/* ---------- Level 9: what percent is it? ---------- */

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
      // Reduce or expand: 6 of 200 does not expand to hundredths, it reduces.
      hint(sayP('p6.what.hint1')),
      hint(sayP('ex.pct.what.hint2', { base })),
      whatPercentExample(p, [
        [15, 60],
        [10, 50],
      ]),
    ],
    solution: sayP('ex.pct.what.solution', { part, base, p }),
    diagnose: (v) => (v === part ? 'other' : null),
  });
}

/* ---------- Level 10: discount stories ---------- */

/** The stories: the discount in shekels (a shirt, a book), or what is paid after it. */
const STORIES: readonly { key: TranslationKey; pay: boolean }[] = [
  { key: 'wp.pct.discount.story', pay: false },
  { key: 'pi.wp.book', pay: false },
  { key: 'pi.wp.pay', pay: true },
];

/** The discount, or what is paid after it. The character and story follow from the numbers. */
function story(rng: Rng): Exercise {
  const p = pick(rng, [10, 20, 25, 50]);
  const price = p === 25 ? randInt(rng, 3, 30) * 4 : randInt(rng, 2, 40) * 10;
  // Any character (the price is even, so price % 6 would pick only the girls).
  const who = pick(rng, CHARACTERS);
  const s = STORIES[(price / 2 + p) % STORIES.length] as (typeof STORIES)[number];
  const discount = (price * p) / 100;
  const answer = s.pay ? price - discount : discount;
  const spoken = sayP(s.key, { name: who.name, price, p }, who.gender);
  return exercise({
    factId: `pwp:${s.pay ? 'pay:' : ''}${price}:${p}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    operation: s.pay ? 'sub' : 'mul',
    input: numpad(3),
    hints: s.pay
      ? [
          // Two ways: take the discount off, or pay what is left of a hundred percent.
          hint(sayP('pi.wp.pay.hint1')),
          hint(sayP('ex.pct6.discount.hint2', { p, q: 100 - p }, 'f', ['p', 'q'])),
          exampleAvoiding(
            answer,
            [
              { base: 80, p: 25 },
              { base: 60, p: 10 },
            ].map((e) => {
              const r = e.base - (e.base * e.p) / 100;
              return {
                answer: r,
                hint: () =>
                  exampleHint(`${e.base} → ${r}`, sayP('ex.pct6.discount.solution', { ...e, r })),
              };
            }),
          ),
        ]
      : [
          hint(sayP('wp.pct.discount.hint1')),
          {
            ...hint(say('hint.equation')),
            example: { display: `${p}% × ${price} = ?`, spoken: say('hint.equation').text },
          },
          percentOfExample(answer, [
            [25, 80],
            [10, 50],
          ]),
        ],
    solution: s.pay
      ? sayP('ex.pct6.discount.solution', { base: price, p, r: answer })
      : sayP('ex.pct.of.solution', { p, base: price, r: answer }),
    // The other one: what is paid when the discount was asked, or the other way round.
    diagnose: (v) => (v === (s.pay ? discount : price - discount) ? 'other' : null),
  });
}

function storyBank(): string[] {
  return CHARACTERS.flatMap((who) =>
    STORIES.flatMap((s) => sayP(s.key, { name: who.name, price: 80, p: 25 }, who.gender).parts),
  );
}

export const percentIntro = defineTopic({
  id: ID,
  labelKey: 'topic.percentIntro',
  // Grade 5 meets percent (levels 1–5); grade 6 goes on to a percent of a quantity (6–10).
  grades: [5, 6],
  startLevel: (grade) => (grade === 6 ? 6 : 1),
  lastLevel: (grade) => (grade === 5 ? 5 : 10),
  extraBank: storyBank,
  levels: [
    closed(
      L(1),
      () => [2, 4, 5, 10, 20].flatMap((parts) => range(1, parts - 1).map((k) => ({ parts, k }))),
      (x) => shaded(x.parts, x.k),
    ),
    closed(
      'level.percentIntro5.2',
      // Percent to unit fraction for any divisor of a hundred; back only where the fraction has a word.
      () => [
        ...[2, 4, 5, 10, 20, 25, 50, 100].map((d) => ({ d, toFraction: true })),
        ...[2, 4, 5, 10, 100].map((d) => ({ d, toFraction: false })),
      ],
      (x) => familiar(x.d, x.toFraction),
    ),
    closed(
      L(3),
      () => FRACTIONS,
      ([n, d]) => fromFraction(n, d),
    ),
    closed(
      'level.percentIntro5.4',
      () =>
        range(1, 99)
          .filter((p) => p % 5 === 0 || p < 10)
          .flatMap((p) => [true, false].map((toPercent) => ({ p, toPercent }))),
      (x) => decimal(4, x.p, x.toPercent),
    ),
    open('level.percentIntro5.5', mixed),
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
