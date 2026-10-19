import { shown } from '@/lang/compose';
import { t } from '@/i18n';
import {
  CHARACTERS,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise as baseExercise,
  gcd,
  hint,
  numpad,
  open,
  say,
  type AdviceSpec,
  type Character,
  type Said,
  type ExerciseParts,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng } from '../types';
import { percentOfExample, sayP, whatPercentExample } from './percentIntro';

/**
 * World 18, grade 6: "אחוזים". Any percent of a quantity, what percent a part
 * is, the whole from a percent, the price after a discount, an increase,
 * the discount percent, a survey, two discounts in a row, and mixed stories.
 * Answers are whole numbers by construction.
 */

const ID = 'percent';

/**
 * Every exercise here also hears "very close" for an answer one off; the
 * typical slips of each question are diagnosed first.
 */
function exercise(p: ExerciseParts): Exercise {
  return baseExercise({
    ...p,
    diagnose: (v) =>
      p.diagnose?.(v) ??
      (Number.isInteger(p.answer) && Math.abs(v - p.answer) === 1 ? 'offByOne' : null),
  });
}
const L = (n: number) => `level.percent.${n}`;
const PERCENTS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];

/** p% of base with a whole-number answer, the base in [minBase, maxBase]. */
function pctPair(rng: Rng, maxBase = 400, minBase = 1): { p: number; base: number; part: number } {
  const p = pick(rng, PERCENTS);
  const step = p % 25 === 0 ? 4 : p % 10 === 0 ? 10 : 20;
  const base = randInt(rng, Math.ceil(minBase / step), Math.floor(maxBase / step)) * step;
  return { p, base, part: (base * p) / 100 };
}

/**
 * The way to "what percent is part of base", for these numbers: with tens
 * when ten percent is a whole number and the answer is tens of percent;
 * otherwise reduce the fraction (34 of 136 is 1 of 4), then make it hundredths.
 */
function waysHint(part: number, base: number, p: number): Hint {
  if (p % 10 === 0 && base % 10 === 0)
    return hint(sayP('p6.what.tens', { base, ten: base / 10, part }));
  const g = gcd(part, base);
  return hint(sayP('p6.what.reduce', { part, base, n: part / g, d: base / g }));
}

/* ---------- Advice for the typical wrong answers ---------- */

/** What is left (base − part) when p% itself was asked. */
function restAdvice(base: number, p: number, part: number): AdviceSpec {
  return { value: base - part, say: sayP('p6.adv.rest', { w: base - part, base, p }) };
}

/** The part itself typed as the percent. */
function partAdvice(part: number, base: number): AdviceSpec {
  return { value: part, say: sayP('p6.adv.what.part', { w: part, base }) };
}

/** The whole from p% = part: p% of the part taken, or the part times p. */
function wholeAdvice(p: number, part: number): AdviceSpec[] {
  const ofPart = (part * p) / 100;
  return [
    ...(Number.isInteger(ofPart) && ofPart > 0
      ? [{ value: ofPart, say: sayP('p6.adv.whole.ofPart', { w: ofPart, p, part }) }]
      : []),
    { value: part * p, say: sayP('p6.adv.whole.times', { w: part * p, p, part }) },
  ];
}

/** A new price: the change alone, or the change made the other way. */
function changeAdvice(up: boolean, base: number, part: number): AdviceSpec[] {
  const other = up ? base - part : base + part;
  return [
    { value: part, say: sayP(up ? 'p6.adv.inc.part' : 'p6.adv.disc.part', { w: part, base }) },
    {
      value: other,
      say: sayP(up ? 'p6.adv.inc.sub' : 'p6.adv.disc.added', { w: other, base }),
      kind: 'wrongOperation',
    },
  ];
}

function of(level: 1 | 2, rng: Rng): Exercise {
  // Level 2: big quantities only (from 200), not level 1 again.
  const { p, base, part } = level === 1 ? pctPair(rng, 200) : pctPair(rng, 1000, 200);
  return exercise({
    factId: `p6of:${p}%${base}`,
    topicId: ID,
    level,
    prompt: t('ex.pct.of.prompt'),
    display: `${p}% × ${base} = ?`,
    spoken: sayP('ex.pct.of.spoken', { p, base }),
    answer: part,
    operation: 'mul',
    input: numpad(4),
    hints: [
      hint(sayP('ex.pct6.of.hint1')),
      hint(sayP('ex.pct.of.hint2', { base })),
      percentOfExample(part, [
        [15, 60],
        [25, 80],
      ]),
    ],
    solution: sayP('ex.pct.of.solution', { p, base, r: part }),
    diagnose: (v) =>
      v === base - part ? 'other' : v === part * 10 || v * 10 === part ? 'placeValue' : null,
    advice: [
      restAdvice(base, p, part),
      // A tenth or ten times the part: the size checked through ten percent (not when that is the answer).
      ...(base % 10 === 0 && p !== 10
        ? [part * 10, part / 10]
            .filter((v) => Number.isInteger(v) && v > 0)
            .map(
              (v): AdviceSpec => ({
                value: v,
                say: sayP('p6.adv.of.size', { base, ten: base / 10, p }),
                kind: 'placeValue',
              }),
            )
        : []),
    ],
  });
}

/** Wholes that divide a hundred, and their multiples: the fraction reduces to tenths, quarters, fifths. */
const WHAT_BASES = [20, 25, 40, 50, 60, 80, 120, 150, 200, 250, 300, 400];

function whatPercent(rng: Rng): Exercise {
  const base = pick(rng, WHAT_BASES);
  const p = pick(
    rng,
    PERCENTS.filter((q) => Number.isInteger((base * q) / 100) && (base * q) / 100 >= 2),
  );
  const part = (base * p) / 100;
  return exercise({
    factId: `p6what:${part}/${base}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.pct.howMany.prompt'),
    display: `${part} / ${base} = ?%`,
    spoken: sayP('ex.pct.what.spoken', { part, base }),
    answer: p,
    input: numpad(3),
    hints: [
      hint(sayP('p6.what.hint1')),
      waysHint(part, base, p),
      // Not grade 5's example (15 of 60).
      whatPercentExample(p, [
        [18, 120],
        [14, 40],
      ]),
    ],
    solution: sayP('ex.pct.what.solution', { part, base, p }),
    diagnose: (v) => (v === part ? 'other' : null),
    advice: [partAdvice(part, base)],
  });
}

/** "20% = 12 → 10% = 6 → 100% = 60": the way from a part to the whole, as the worked example. */
function wholePathExample(answer: number): Hint {
  return exampleAvoiding(
    answer,
    [
      { p: 20, part: 12, base: 60 },
      { p: 30, part: 15, base: 50 },
    ]
      .filter((e) => e.part !== answer)
      .map((e) => ({
        answer: e.base,
        hint: () =>
          exampleHint(
            `${e.p}% = ${e.part} → 10% = ${e.part / (e.p / 10)} → 100% = ${e.base}`,
            sayP('p6.whole.path', { p: e.p, part: e.part, ten: e.part / (e.p / 10), base: e.base }),
          ),
      })),
  );
}

function findWhole(rng: Rng): Exercise {
  const { p, base, part } = pctPair(rng, 400);
  if (part === 0) return findWhole(rng);
  return exercise({
    factId: `p6whole:${p}%=${part}`,
    topicId: ID,
    level: 4,
    prompt: t('ex.fmul.findWhole.prompt'),
    display: `${p}% × ? = ${part}`,
    spoken: sayP('ex.pct6.whole.spoken', { p, part }),
    answer: base,
    operation: 'div',
    input: numpad(4),
    hints: [
      hint(sayP('ex.pct6.whole.hint1', { p })),
      hint(sayP('ex.pct6.whole.hint2')),
      wholePathExample(base),
    ],
    solution: sayP('ex.pct6.whole.solution', { p, part, base }),
    diagnose: (v) => (v === part * p || v === (part * p) / 100 ? 'other' : null),
    advice: wholeAdvice(p, part),
  });
}

/** Things with a price, for the discount and increase questions (all masculine: "הוא עולה"). */
const ITEMS = ['ספר', 'משחק', 'תיק', 'כדור'];

/** The question about a new price: the plain one, or about an item; it follows from the numbers. */
function changeSpoken(up: boolean, base: number, p: number): Said {
  const item = (base / 10 + p) % (ITEMS.length + 1);
  const name = ITEMS[item];
  if (name === undefined)
    return sayP(up ? 'ex.pct6.increase.spoken' : 'ex.pct6.discount.spoken', { base, p });
  return sayP(up ? 'p6.increase.item' : 'p6.discount.item', { base, p, item: name });
}

/** Hints 2 and 3 for a new price: what is paid as a percent of the price, and a solved example. */
function changeHints(up: boolean, answer: number, p: number): [Hint, Hint] {
  const key = up ? 'ex.pct6.increase' : 'ex.pct6.discount';
  return [
    // What is paid, as a percent of the price: 100 − p after a discount, 100 + p after an increase.
    hint(
      sayP(
        up ? 'ex.pct6.increase.hint2' : 'ex.pct6.discount.hint2',
        { p, q: up ? 100 + p : 100 - p },
        'f',
        ['p', 'q'],
      ),
    ),
    // Not an example whose new price is this answer: it would give it away.
    exampleAvoiding(
      answer,
      [
        { base: 80, p: 25 },
        { base: 60, p: 10 },
      ].map((e) => {
        const r = up ? e.base + (e.base * e.p) / 100 : e.base - (e.base * e.p) / 100;
        return {
          answer: r,
          hint: () =>
            exampleHint(
              `${e.base} → ${r}`,
              sayP(`${key}.solution` as 'ex.pct6.discount.solution', { ...e, r }),
            ),
        };
      }),
    ),
  ];
}

/** Price after a discount (level 5) or after an increase (level 6). */
function change(level: 5 | 6, rng: Rng): Exercise {
  const { p, base, part } = pctPair(rng, 600);
  const up = level === 6;
  const answer = up ? base + part : base - part;
  const key = up ? 'ex.pct6.increase' : 'ex.pct6.discount';
  const spoken = changeSpoken(up, base, p);
  return exercise({
    factId: `p6chg${level}:${base}:${p}`,
    topicId: ID,
    level,
    // The data on screen too (with digits), not only heard.
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    // A discount is taken off, an increase added: doing the other is "read the question again".
    operation: up ? 'add' : 'sub',
    input: numpad(4),
    hints: [hint(sayP(`${key}.hint1` as 'ex.pct6.discount.hint1')), ...changeHints(up, answer, p)],
    solution: sayP(`${key}.solution` as 'ex.pct6.discount.solution', { base, p, r: answer }),
    diagnose: (v) =>
      v === part ? 'other' : v === (up ? base - part : base + part) ? 'wrongOperation' : null,
    advice: changeAdvice(up, base, part),
  });
}

/** The discount percent from the old and new price. */
function discountPercent(rng: Rng): Exercise {
  const { p, base, part } = pctPair(rng, 600);
  if (part === 0) return discountPercent(rng);
  const after = base - part;
  // Neither the example's percent nor its new price may be this answer: either would give it away.
  const first = { base: 80, after: 60, p: 25 };
  const e = first.p !== p && first.after !== p ? first : { base: 50, after: 40, p: 20 };
  return exercise({
    factId: `p6dp:${base}->${after}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.pct.howMany.prompt'),
    display: `${base} → ${after}`,
    spoken: sayP('p6.dp.spoken', { base, after }),
    answer: p,
    input: numpad(3),
    hints: [
      hint(sayP('ex.pct6.dp.hint1')),
      // Out of the original price, not the new one.
      hint(sayP('p6.dp.hint2', { d: part, base })),
      exampleHint(`${e.base} → ${e.after}: ${e.p}%`, sayP('ex.pct6.dp.solution', e)),
    ],
    solution: sayP('ex.pct6.dp.solution', { base, after, p }),
    diagnose: (v) => (v === part ? 'other' : v === 100 - p ? 'other' : null),
    // The discount in shekels, the percent that is paid, or the new price.
    advice: [
      { value: part, say: sayP('p6.adv.dp.shekels', { w: part, base }) },
      { value: 100 - p, say: sayP('p6.adv.dp.paid', { w: 100 - p }) },
      { value: after, say: sayP('p6.adv.dp.after', { w: after }) },
    ],
  });
}

const CHILD = { singular: 'ילד', plural: 'ילדים', gender: 'm' as const };
const QUESTION = { singular: 'שאלה', plural: 'שאלות', gender: 'f' as const };

/** What children chose in a survey. */
const CHOICES = ['כדורגל', 'כדורסל', 'שחייה', 'ציור', 'מוזיקה'];

/** A survey: k of n children chose something; what percent? A class up to 40, a whole grade above. */
function survey(rng: Rng): Exercise {
  const n = pick(rng, [20, 25, 40, 50, 60, 80, 120, 150]);
  const p = pick(
    rng,
    PERCENTS.filter((q) => Number.isInteger((n * q) / 100) && (n * q) / 100 >= 3),
  );
  const k = (n * p) / 100;
  const what = CHOICES[(n + k) % CHOICES.length] as string;
  const spoken = say('p6.survey.story', {
    where: n <= 40 ? 'בכיתה' : 'בשכבה',
    k: { n: k, noun: CHILD },
    n: { n, noun: CHILD },
    what,
  });
  return exercise({
    factId: `p6survey:${k}/${n}`,
    topicId: ID,
    level: 8,
    // The data on screen too (with digits), not only heard.
    prompt: shown(spoken),
    display: '',
    spoken,
    answer: p,
    input: numpad(3),
    hints: [
      hint(sayP('p6.what.hint1')),
      waysHint(k, n, p),
      whatPercentExample(p, [
        [10, 40],
        [6, 20],
      ]),
    ],
    solution: sayP('ex.pct.what.solution', { part: k, base: n, p }),
    diagnose: (v) => (v === k ? 'other' : null),
    advice: [partAdvice(k, n)],
  });
}

/** Two discounts in a row are not one discount of the sum: 10% then 10% of 100 = 81. */
function twoSteps(rng: Rng): Exercise {
  const base = randInt(rng, 2, 10) * 100;
  const p1 = pick(rng, [10, 20, 50]);
  const p2 = pick(rng, [10, 20, 50]);
  const mid = base - (base * p1) / 100;
  const answer = mid - (mid * p2) / 100;
  return exercise({
    factId: `p6two:${base}:${p1}:${p2}`,
    topicId: ID,
    level: 9,
    // The data on screen too (with digits), not only heard.
    prompt: shown(sayP('ex.pct6.two.spoken', { base, p: p1, q: p2 }, 'f', ['p', 'q'])),
    display: '',
    spoken: sayP('ex.pct6.two.spoken', { base, p: p1, q: p2 }, 'f', ['p', 'q']),
    answer,
    input: numpad(4),
    hints: [
      hint(sayP('ex.pct6.two.hint1')),
      hint(sayP('ex.pct6.two.hint2')),
      exampleHint('100 → 90 → 81', sayP('ex.pct6.two.solution', { base: 100, mid: 90, r: 81 })),
    ],
    solution: sayP('ex.pct6.two.solution', { base, mid, r: answer }),
    diagnose: (v) => (v === base - (base * (p1 + p2)) / 100 ? 'other' : null),
    // The two discounts added into one, or only the first one taken.
    advice: [
      {
        value: base - (base * (p1 + p2)) / 100,
        say: sayP('p6.adv.two.sum', { s: p1 + p2, base }, 'f', ['s']),
      },
      { value: mid, say: sayP('p6.adv.two.mid', { w: mid, q: p2 }, 'f', ['q']) },
    ],
  });
}

/**
 * Level 10, mixed stories: a percent of savings, what is paid after a discount
 * (two steps), a test score as a percent, and the whole from a part.
 */
function story(rng: Rng): Exercise {
  const kind = pick(rng, ['donate', 'pay', 'score', 'whole'] as const);
  if (kind === 'score') {
    const n = pick(rng, [20, 25, 40, 50]);
    const p = pick(
      rng,
      PERCENTS.filter((q) => Number.isInteger((n * q) / 100) && (n * q) / 100 >= 3),
    );
    const k = (n * p) / 100;
    const who = CHARACTERS[(n + k) % CHARACTERS.length] as Character;
    const spoken = say('p6.wp.score', { name: who.name, n: { n, noun: QUESTION }, k }, who.gender);
    return exercise({
      factId: `p6wp:score:${k}/${n}`,
      topicId: ID,
      level: 10,
      prompt: shown(spoken),
      display: '',
      spoken,
      answer: p,
      input: numpad(3),
      hints: [
        hint(sayP('p6.what.hint1')),
        waysHint(k, n, p),
        whatPercentExample(p, [
          [18, 120],
          [14, 40],
        ]),
      ],
      solution: sayP('ex.pct.what.solution', { part: k, base: n, p }),
      diagnose: (v) => (v === k ? 'other' : null),
      advice: [partAdvice(k, n)],
    });
  }
  if (kind === 'whole') {
    const { p, base, part } = pctPair(rng, 200, 20);
    if (part < 3) return story(rng);
    const spoken = sayP('p6.wp.whole', { p, k: { n: part, noun: CHILD } });
    return exercise({
      factId: `p6wp:whole:${p}%=${part}`,
      topicId: ID,
      level: 10,
      prompt: shown(spoken),
      display: '',
      spoken,
      answer: base,
      operation: 'div',
      input: numpad(4),
      hints: [
        hint(sayP('ex.pct6.whole.hint1', { p })),
        hint(sayP('ex.pct6.whole.hint2')),
        wholePathExample(base),
      ],
      solution: sayP('ex.pct6.whole.solution', { p, part, base }),
      diagnose: (v) => (v === part * p || v === (part * p) / 100 ? 'other' : null),
      advice: wholeAdvice(p, part),
    });
  }
  const { p, base, part } = pctPair(rng, 1000, 40);
  // Any character (the base is even, so base % 6 would pick only the girls).
  const who = pick(rng, CHARACTERS);
  if (kind === 'pay') {
    const answer = base - part;
    const spoken = sayP('p6.wp.pay', { name: who.name, base, p }, who.gender);
    return exercise({
      factId: `p6wp:pay:${base}:${p}`,
      topicId: ID,
      level: 10,
      prompt: shown(spoken),
      display: '',
      spoken,
      answer,
      operation: 'sub',
      input: numpad(4),
      hints: [hint(sayP('ex.pct6.discount.hint1')), ...changeHints(false, answer, p)],
      solution: sayP('ex.pct6.discount.solution', { base, p, r: answer }),
      // The discount itself (one step only), or the discount added.
      diagnose: (v) => (v === part ? 'other' : v === base + part ? 'wrongOperation' : null),
      advice: changeAdvice(false, base, part),
    });
  }
  const spoken = sayP('wp.pct6.save.story', { name: who.name, base, p }, who.gender);
  return exercise({
    factId: `p6wp:${base}:${p}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer: part,
    operation: 'mul',
    input: numpad(4),
    hints: [
      hint(sayP('wp.pct6.save.hint1')),
      {
        ...hint(say('hint.equation')),
        example: { display: `${p}% × ${base} = ?`, spoken: say('hint.equation').text },
      },
      percentOfExample(part, [
        [15, 60],
        [25, 80],
      ]),
    ],
    solution: sayP('ex.pct.of.solution', { p, base, r: part }),
    diagnose: (v) => (v === base - part ? 'other' : null),
    advice: [restAdvice(base, p, part)],
  });
}

/** Story and item pieces for the audio bank (sampling may miss a character or an item). */
function storyBank(): string[] {
  return [
    ...CHARACTERS.flatMap((who) => [
      ...sayP('wp.pct6.save.story', { name: who.name, base: 200, p: 25 }, who.gender).parts,
      ...sayP('p6.wp.pay', { name: who.name, base: 200, p: 25 }, who.gender).parts,
      ...say('p6.wp.score', { name: who.name, n: { n: 20, noun: QUESTION }, k: 15 }, who.gender)
        .parts,
    ]),
    ...ITEMS.flatMap((item) => [
      ...sayP('p6.discount.item', { base: 200, p: 25, item }).parts,
      ...sayP('p6.increase.item', { base: 200, p: 25, item }).parts,
    ]),
    ...CHOICES.flatMap((what) =>
      ['בכיתה', 'בשכבה'].flatMap(
        (where) =>
          say('p6.survey.story', {
            where,
            k: { n: 5, noun: CHILD },
            n: { n: 20, noun: CHILD },
            what,
          }).parts,
      ),
    ),
  ];
}

export const percent = defineTopic({
  id: ID,
  labelKey: 'topic.percent',
  grades: [6],
  startLevel: () => 1,
  extraBank: storyBank,
  levels: [
    open(L(1), (rng) => of(1, rng)),
    open(L(2), (rng) => of(2, rng)),
    open(L(3), whatPercent),
    open(L(4), findWhole),
    open(L(5), (rng) => change(5, rng)),
    open(L(6), (rng) => change(6, rng)),
    open(L(7), discountPercent),
    open('level.percent6.8', survey),
    open(L(9), twoSteps),
    open('level.percent6.10', story),
  ],
});
