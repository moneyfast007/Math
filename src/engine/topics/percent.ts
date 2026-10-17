import { t } from '@/i18n';
import {
  CHARACTERS,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  say,
  type Character,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Rng } from '../types';
import { sayP } from './percentIntro';

/**
 * World 18, grade 6: "אחוזים". Any percent of a quantity, what percent a part
 * is, the whole from a percent, the price after a discount, an increase,
 * percent of percent-free stories (savings, a class survey).
 * Answers are whole numbers by construction.
 */

const ID = 'percent';
const L = (n: number) => `level.percent.${n}`;

/** p% of base with a whole-number answer. */
function pctPair(rng: Rng, maxBase = 400): { p: number; base: number; part: number } {
  const p = pick(rng, [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]);
  const step = p % 25 === 0 ? 4 : p % 10 === 0 ? 10 : 20;
  const base = randInt(rng, 1, Math.floor(maxBase / step)) * step;
  return { p, base, part: (base * p) / 100 };
}

function of(level: 1 | 2, rng: Rng): Exercise {
  const { p, base, part } = level === 1 ? pctPair(rng, 200) : pctPair(rng, 1000);
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
      exampleHint(p === 15 && base === 60 ? '20% × 45 = 9' : '15% × 60 = 9', sayP('ex.pct.of.solution', p === 15 && base === 60 ? { p: 20, base: 45, r: 9 } : { p: 15, base: 60, r: 9 })),
    ],
    solution: sayP('ex.pct.of.solution', { p, base, r: part }),
    diagnose: (v) => (v === base - part ? 'other' : v === part * 10 || v * 10 === part ? 'placeValue' : null),
  });
}

function whatPercent(rng: Rng): Exercise {
  const { p, base, part } = pctPair(rng, 400);
  if (part === 0) return whatPercent(rng);
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
      hint(sayP('ex.pct.what.hint1')),
      hint(sayP('ex.pct6.what.hint2')),
      exampleHint(part === 15 && base === 60 ? '9 / 36 = 25%' : '15 / 60 = 25%', sayP('ex.pct.what.solution', part === 15 && base === 60 ? { part: 9, base: 36, p: 25 } : { part: 15, base: 60, p: 25 })),
    ],
    solution: sayP('ex.pct.what.solution', { part, base, p }),
  });
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
      exampleHint(p === 20 && part === 12 ? '25% × 48 = 12' : '20% × 60 = 12', sayP('ex.pct6.whole.solution', p === 20 && part === 12 ? { p: 25, part: 12, base: 48 } : { p: 20, part: 12, base: 60 })),
    ],
    solution: sayP('ex.pct6.whole.solution', { p, part, base }),
    diagnose: (v) => (v === part * p || v === (part * p) / 100 ? 'other' : null),
  });
}

/** Price after a discount (level 5) or after an increase (level 6). */
function change(level: 5 | 6, rng: Rng): Exercise {
  const { p, base, part } = pctPair(rng, 600);
  const up = level === 6;
  const answer = up ? base + part : base - part;
  const key = up ? 'ex.pct6.increase' : 'ex.pct6.discount';
  const exBase = 80;
  const exP = 25;
  const same = base === exBase && p === exP;
  const e = same ? { base: 60, p: 10 } : { base: exBase, p: exP };
  const eAns = up ? e.base + (e.base * e.p) / 100 : e.base - (e.base * e.p) / 100;
  return exercise({
    factId: `p6chg${level}:${base}:${p}`,
    topicId: ID,
    level,
    prompt: t(`${key}.prompt` as 'ex.pct6.discount.prompt'),
    display: '',
    spoken: sayP(`${key}.spoken` as 'ex.pct6.discount.spoken', { base, p }),
    answer,
    input: numpad(4),
    hints: [
      hint(sayP(`${key}.hint1` as 'ex.pct6.discount.hint1')),
      hint(sayP('ex.pct6.change.hint2')),
      exampleHint(`${e.base} → ${eAns}`, sayP(`${key}.solution` as 'ex.pct6.discount.solution', { base: e.base, p: e.p, r: eAns })),
    ],
    solution: sayP(`${key}.solution` as 'ex.pct6.discount.solution', { base, p, r: answer }),
    diagnose: (v) => (v === part ? 'other' : v === (up ? base - part : base + part) ? 'wrongOperation' : null),
  });
}

/** The discount percent from the old and new price. */
function discountPercent(rng: Rng): Exercise {
  const { p, base, part } = pctPair(rng, 600);
  if (part === 0) return discountPercent(rng);
  const after = base - part;
  return exercise({
    factId: `p6dp:${base}->${after}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.pct.howMany.prompt'),
    display: `${base} → ${after}`,
    spoken: sayP('ex.pct6.dp.spoken', { base, after }),
    answer: p,
    input: numpad(3),
    hints: [
      hint(sayP('ex.pct6.dp.hint1')),
      hint(sayP('ex.pct.what.hint1')),
      exampleHint(base === 80 && after === 60 ? '50 → 40: 20%' : '80 → 60: 25%', sayP('ex.pct6.dp.solution', base === 80 && after === 60 ? { base: 50, after: 40, p: 20 } : { base: 80, after: 60, p: 25 })),
    ],
    solution: sayP('ex.pct6.dp.solution', { base, after, p }),
    diagnose: (v) => (v === part ? 'other' : v === 100 - p ? 'other' : null),
  });
}

/** A class survey: k of n children chose something; what percent? */
function survey(rng: Rng): Exercise {
  const n = pick(rng, [20, 25, 40, 50]);
  const p = pick(rng, n === 25 ? [4, 8, 12, 20, 40, 60, 80] : n === 40 ? [5, 10, 25, 30, 50, 75] : [10, 20, 30, 40, 50, 60, 70, 80, 90]);
  const k = (n * p) / 100;
  if (!Number.isInteger(k) || k < 3) return survey(rng);
  return exercise({
    factId: `p6survey:${k}/${n}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.pct.howMany.prompt'),
    display: '',
    spoken: say('wp.pct6.survey.story', { k: { n: k, noun: CHILD }, n: { n, noun: CHILD } }),
    answer: p,
    input: numpad(3),
    hints: [hint(sayP('ex.pct.what.hint1')), hint(sayP('ex.pct6.what.hint2')), exampleHint('10 / 40 = 25%', sayP('ex.pct.what.solution', { part: 10, base: 40, p: 25 }))],
    solution: sayP('ex.pct.what.solution', { part: k, base: n, p }),
  });
}

const CHILD = { singular: 'ילד', plural: 'ילדים', gender: 'm' as const };

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
    prompt: t('ex.pct6.discount.prompt'),
    display: '',
    spoken: sayP('ex.pct6.two.spoken', { base, p: p1, q: p2 }, 'f', ['p', 'q']),
    answer,
    input: numpad(4),
    hints: [hint(sayP('ex.pct6.two.hint1')), hint(sayP('ex.pct6.two.hint2')), exampleHint('100 → 90 → 81', sayP('ex.pct6.two.solution', { base: 100, mid: 90, r: 81 }))],
    solution: sayP('ex.pct6.two.solution', { base, mid, r: answer }),
    diagnose: (v) => (v === base - (base * (p1 + p2)) / 100 ? 'other' : null),
  });
}

/** Savings with interest-free deposits: a percent of a sum, story form. */
function story(rng: Rng): Exercise {
  const { p, base, part } = pctPair(rng, 1000);
  const who = CHARACTERS[base % CHARACTERS.length] as Character;
  const spoken = sayP('wp.pct6.save.story', { name: who.name, base, p }, who.gender);
  return exercise({
    factId: `p6wp:${base}:${p}`,
    topicId: ID,
    level: 10,
    prompt: spoken.text,
    display: '',
    spoken,
    answer: part,
    operation: 'mul',
    input: numpad(4),
    hints: [
      hint(sayP('wp.pct6.save.hint1')),
      { ...hint(say('hint.equation')), example: { display: `${p}% × ${base} = ?`, spoken: say('hint.equation').text } },
      exampleHint(p === 15 && base === 60 ? '20% × 45 = 9' : '15% × 60 = 9', sayP('ex.pct.of.solution', p === 15 && base === 60 ? { p: 20, base: 45, r: 9 } : { p: 15, base: 60, r: 9 })),
    ],
    solution: sayP('ex.pct.of.solution', { p, base, r: part }),
  });
}

function storyBank(): string[] {
  return CHARACTERS.flatMap((who) => sayP('wp.pct6.save.story', { name: who.name, base: 200, p: 25 }, who.gender).parts);
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
    open(L(8), survey),
    open(L(9), twoSteps),
    open(L(10), story),
  ],
});
