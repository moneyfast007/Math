import { t } from '@/i18n';
import { displayFraction as f, displayMixed, fractionNoun, fractionWords as w } from '@/lang/fractions';
import { numberToWords, type Noun } from '@/lang/hebrewNumbers';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  numpad,
  range,
  say,
  WORD_NOUNS,
  type Character,
  type WordNoun,
} from '../build';
import type { Exercise, Visual } from '../types';

/**
 * World 14, grade 5: "כפל וחילוק בשברים". A whole times a fraction, finding
 * the whole from a part, a fraction times a fraction, dividing a fraction by
 * a whole and a whole by a unit fraction, a mixed number times a whole,
 * stories. Only denominators with a Hebrew word (2–10), so all can be read.
 * All levels are closed, so every sentence is recorded whole.
 */

const ID = 'fraction-mul-div';
const L = (n: number) => `level.fractionMulDiv.${n}`;
const DENS = [2, 3, 4, 5, 6, 8, 9, 10];
const WHOLE: Noun = { singular: 'שלם', plural: 'שלמים', gender: 'm' };
const bar = (n: number, d: number): Visual => ({ type: 'fraction', parts: d, shaded: Math.min(n, d) });

/** "שלוש כפול רבע" */
const times = (k: number, n: number, d: number) => `${numberToWords(k)} כפול ${w(n, d)}`;

/** 3 × 2/5 = ?/5 */
function wholeTimes(level: 1 | 2, k: number, n: number, d: number): Exercise {
  const answer = k * n;
  const ex = k === 3 && n === 1 && d === 4 ? { k: 2, n: 1, d: 3 } : { k: 3, n: 1, d: 4 };
  return exercise({
    factId: `fwt:${k}x${n}/${d}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.expand.prompt'),
    display: `${k} × ${f(n, d)} = ?/${d}`,
    spoken: say('ex.fmul.question', { q: times(k, n, d) }),
    visual: bar(n, d),
    answer,
    operation: 'mul',
    input: numpad(2),
    hints: [
      hint(say('ex.fmul.wholeTimes.hint1', { a: w(n, d) })),
      hint(say('ex.fmul.wholeTimes.hint2')),
      exampleHint(`${ex.k} × ${f(ex.n, ex.d)} = ${f(ex.k * ex.n, ex.d)}`, say('ex.frac.equal.solution', { a: times(ex.k, ex.n, ex.d), b: w(ex.k * ex.n, ex.d) })),
    ],
    solution: say('ex.frac.equal.solution', { a: times(k, n, d), b: w(answer, d) }),
    diagnose: (v) => (v === n ? 'other' : null),
  });
}

/** 1/4 of ? is 5 (level 3), 3/4 of ? is 15 (level 4). */
function findWhole(level: 3 | 4, n: number, d: number, part: number): Exercise {
  const whole = (part / n) * d;
  const ex = n === 1 && d === 4 && part === 5 ? { n: 1, d: 3, part: 4 } : { n: 1, d: 4, part: 5 };
  const exW = (ex.part / ex.n) * ex.d;
  return exercise({
    factId: `fwhole:${n}/${d}=${part}`,
    topicId: ID,
    level,
    prompt: t('ex.fmul.findWhole.prompt'),
    display: `${f(n, d)} × ? = ${part}`,
    spoken: say('ex.fmul.findWhole.spoken', { a: w(n, d), part }),
    visual: bar(n, d),
    answer: whole,
    operation: 'mul',
    input: numpad(3),
    hints: [
      hint(n === 1 ? say('ex.fmul.findWhole.hint1unit', { d }) : say('ex.fmul.findWhole.hint1', { n, d })),
      hint(say('ex.fmul.findWhole.hint2')),
      exampleHint(`${f(ex.n, ex.d)} × ${exW} = ${ex.part}`, say('ex.fmul.findWhole.solution', { a: w(ex.n, ex.d), whole: exW, part: ex.part })),
    ],
    solution: say('ex.fmul.findWhole.solution', { a: w(n, d), whole, part }),
    diagnose: (v) => (v === part * n || v === part / n ? 'other' : null),
  });
}

/** 1/2 × 1/3 = 1/? (level 5, the denominator), 2/3 × 1/3 = ?/9 (level 6, the numerator). */
function fracTimes(level: 5 | 6, a: { n: number; d: number }, b: { n: number; d: number }): Exercise {
  const num = a.n * b.n;
  const den = a.d * b.d;
  const askDen = level === 5;
  const ex = a.d === 2 && b.d === 3 ? { a: { n: 1, d: 2 }, b: { n: 1, d: 4 } } : { a: { n: 1, d: 2 }, b: { n: 1, d: 3 } };
  const exN = ex.a.n * ex.b.n;
  const exD = ex.a.d * ex.b.d;
  const q = `${w(a.n, a.d)} כפול ${w(b.n, b.d)}`;
  return exercise({
    factId: `fxf${level}:${a.n}/${a.d}x${b.n}/${b.d}`,
    topicId: ID,
    level,
    prompt: t(askDen ? 'ex.fmul.denominator.prompt' : 'ex.frac.expand.prompt'),
    display: askDen ? `${f(a.n, a.d)} × ${f(b.n, b.d)} = ${num}/?` : `${f(a.n, a.d)} × ${f(b.n, b.d)} = ?/${den}`,
    spoken: say('ex.fmul.question', { q }),
    visual: bar(a.n, a.d),
    answer: askDen ? den : num,
    operation: 'mul',
    input: numpad(2),
    hints: [
      hint(say('ex.fmul.fracTimes.hint1')),
      hint(say('ex.fmul.fracTimes.hint2', { a: w(b.n, b.d), b: w(a.n, a.d) })),
      exampleHint(`${f(ex.a.n, ex.a.d)} × ${f(ex.b.n, ex.b.d)} = ${f(exN, exD)}`, say('ex.frac.equal.solution', { a: `${w(ex.a.n, ex.a.d)} כפול ${w(ex.b.n, ex.b.d)}`, b: w(exN, exD) })),
    ],
    solution: say('ex.frac.equal.solution', { a: q, b: w(num, den) }),
    diagnose: (v) => (askDen && v === a.d + b.d ? 'wrongOperation' : null),
  });
}

/** 6/8 ÷ 3 = ?/8 */
function fracDivWhole(n: number, d: number, k: number): Exercise {
  const answer = n / k;
  const ex = n === 6 && d === 8 && k === 2 ? { n: 4, d: 5, k: 2 } : { n: 6, d: 8, k: 2 };
  const q = (x: number, y: number, z: number) => `${w(x, y)} חלקי ${numberToWords(z)}`;
  return exercise({
    factId: `fdw:${n}/${d}÷${k}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.frac.expand.prompt'),
    display: `${f(n, d)} ÷ ${k} = ?/${d}`,
    spoken: say('ex.fmul.question', { q: q(n, d, k) }),
    visual: bar(n, d),
    answer,
    operation: 'div',
    input: numpad(2),
    hints: [
      hint(say('ex.fmul.fracDiv.hint1', { k })),
      hint(say('ex.fmul.fracDiv.hint2')),
      exampleHint(`${f(ex.n, ex.d)} ÷ ${ex.k} = ${f(ex.n / ex.k, ex.d)}`, say('ex.frac.equal.solution', { a: q(ex.n, ex.d, ex.k), b: w(ex.n / ex.k, ex.d) })),
    ],
    solution: say('ex.frac.equal.solution', { a: q(n, d, k), b: w(answer, d) }),
    diagnose: (v) => (v === n * k ? 'wrongOperation' : null),
  });
}

/** 3 ÷ 1/4 = ?: how many quarters in three wholes. */
function wholeDivUnit(k: number, d: number): Exercise {
  const answer = k * d;
  const ex = k === 2 && d === 3 ? { k: 2, d: 4 } : { k: 2, d: 3 };
  const q = (x: number, y: number) => `${numberToWords(x)} חלקי ${w(1, y)}`;
  return exercise({
    factId: `fwdu:${k}÷1/${d}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.arith.prompt'),
    display: `${k} ÷ ${f(1, d)} = ?`,
    spoken: say('ex.fmul.question', { q: q(k, d) }),
    visual: bar(d, d),
    answer,
    operation: 'div',
    input: numpad(3),
    hints: [
      hint(say('ex.fmul.wholeDiv.hint1', { plural: fractionNoun(d).plural, wholes: { n: k, noun: WHOLE } })),
      hint(say('ex.fmul.wholeDiv.hint2', { all: { n: d, noun: fractionNoun(d) } })),
      exampleHint(`${ex.k} ÷ ${f(1, ex.d)} = ${ex.k * ex.d}`, say('ex.frac.equal.solution', { a: q(ex.k, ex.d), b: numberToWords(ex.k * ex.d) })),
    ],
    solution: say('ex.frac.equal.solution', { a: q(k, d), b: numberToWords(answer) }),
    diagnose: (v) => (v === k ? 'other' : null),
  });
}

/** (2 1/3) × 3 = ? — chosen so the answer is a whole number. */
function mixedTimes(whole: number, n: number, d: number): Exercise {
  const answer = whole * d + n;
  const ex = whole === 1 && n === 1 && d === 2 ? { whole: 2, n: 1, d: 3 } : { whole: 1, n: 1, d: 2 };
  const exA = ex.whole * ex.d + ex.n;
  const q = (x: number, y: number, z: number) => `${numberToWords(x)} ו${w(y, z)} כפול ${numberToWords(z)}`;
  return exercise({
    factId: `fmt:${whole} ${n}/${d}x${d}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.arith.prompt'),
    display: `${displayMixed(whole, n, d)} × ${d} = ?`,
    spoken: say('ex.fmul.question', { q: q(whole, n, d) }),
    visual: bar(n, d),
    answer,
    operation: 'mul',
    input: numpad(2),
    hints: [
      hint(say('ex.fmul.mixed.hint1')),
      hint(say('ex.fmul.mixed.hint2')),
      exampleHint(`${displayMixed(ex.whole, ex.n, ex.d)} × ${ex.d} = ${exA}`, say('ex.frac.equal.solution', { a: q(ex.whole, ex.n, ex.d), b: numberToWords(exA) })),
    ],
    solution: say('ex.frac.equal.solution', { a: q(whole, n, d), b: numberToWords(answer) }),
    diagnose: (v) => (v === whole * d ? 'other' : null),
  });
}

/** A story: a fraction of the class / of a collection. Character and noun follow from the fact. */
function story(i: number, n: number, d: number, total: number): Exercise {
  const who = CHARACTERS[i % CHARACTERS.length] as Character;
  const noun = WORD_NOUNS[(i * 3) % WORD_NOUNS.length] as WordNoun;
  const part = (total / d) * n;
  const findWholeStory = i % 2 === 1;
  const spoken = findWholeStory
    ? say('wp.fwhole.story', { name: who.name, a: { n: part, noun }, frac: w(n, d), plural: noun.plural }, who.gender)
    : say('wp.fraction.story', { name: who.name, other: (CHARACTERS[(i + 1) % CHARACTERS.length] as Character).name, a: { n: total, noun }, frac: w(n, d), plural: noun.plural }, who.gender);
  const answer = findWholeStory ? total : part;
  return exercise({
    factId: `fwp2:${i}:${n}/${d}:${total}`,
    topicId: ID,
    level: 10,
    prompt: spoken.text,
    display: '',
    spoken,
    answer,
    operation: findWholeStory ? 'div' : 'mul',
    input: numpad(3),
    hints: [
      hint(say(findWholeStory ? 'wp.fwhole.hint1' : 'wp.fraction.hint1', { frac: w(n, d) })),
      { ...hint(say('hint.equation')), example: { display: findWholeStory ? `${f(n, d)} × ? = ${part}` : `${f(n, d)} × ${total} = ?`, spoken: say('hint.equation').text } },
      findWholeStory
        ? exampleHint('1/4 × 20 = 5', say('ex.fmul.findWhole.solution', { a: w(1, 4), whole: 20, part: 5 }))
        : exampleHint('2/3 × 12 = 8', say('ex.frac.of.solution', { frac: w(2, 3), whole: 12, r: 8 })),
    ],
    solution: findWholeStory ? say('ex.fmul.findWhole.solution', { a: w(n, d), whole: total, part }) : say('ex.frac.of.solution', { frac: w(n, d), whole: total, r: part }),
  });
}

const PROPER = DENS.flatMap((d) => range(1, d - 1).map((n) => ({ n, d })));
const UNIT_PAIRS = DENS.flatMap((a) => DENS.filter((b) => b >= a && DENS.includes(a * b)).map((b) => ({ a: { n: 1, d: a }, b: { n: 1, d: b } })));
const PAIRS = PROPER.flatMap((a) => PROPER.filter((b) => DENS.includes(a.d * b.d) && a.n * b.n < a.d * b.d).map((b) => ({ a, b })));

export const fractionMulDiv = defineTopic({
  id: ID,
  labelKey: 'topic.fractionMulDiv',
  grades: [5],
  startLevel: () => 1,
  levels: [
    closed(L(1), () => DENS.flatMap((d) => range(2, d - 1).map((k) => ({ k, d }))), (x) => wholeTimes(1, x.k, 1, x.d)),
    closed(L(2), () => PROPER.filter((x) => x.n > 1).flatMap((x) => range(2, 5).filter((k) => k * x.n <= 40).map((k) => ({ k, ...x }))), (x) => wholeTimes(2, x.k, x.n, x.d)),
    closed(L(3), () => DENS.flatMap((d) => range(2, 12).map((part) => ({ d, part }))), (x) => findWhole(3, 1, x.d, x.part)),
    closed(L(4), () => PROPER.filter((x) => x.n > 1 && x.d <= 6).flatMap((x) => range(2, 6).map((k) => ({ ...x, part: x.n * k })))), (x) => findWhole(4, x.n, x.d, x.part)),
    closed(L(5), () => UNIT_PAIRS, (x) => fracTimes(5, x.a, x.b)),
    closed(L(6), () => PAIRS, (x) => fracTimes(6, x.a, x.b)),
    closed(L(7), () => PROPER.flatMap((x) => [2, 3, 4].filter((k) => x.n % k === 0 && x.n / k >= 1).map((k) => ({ ...x, k }))), (x) => fracDivWhole(x.n, x.d, x.k)),
    closed(L(8), () => DENS.flatMap((d) => range(2, 6).map((k) => ({ k, d }))), (x) => wholeDivUnit(x.k, x.d)),
    closed(L(9), () => DENS.flatMap((d) => range(1, 4).flatMap((whole) => range(1, d - 1).map((n) => ({ whole, n, d })))), (x) => mixedTimes(x.whole, x.n, x.d)),
    closed(L(10), () => [2, 3, 4, 5].flatMap((d) => range(1, d - 1).flatMap((n) => range(3, 6).map((k, j) => ({ i: d * 11 + n * 5 + j, n, d, total: d * k })))), (x) => story(x.i, x.n, x.d, x.total)),
  ],
});
