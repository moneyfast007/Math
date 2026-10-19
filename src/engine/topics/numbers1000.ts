import { t } from '@/i18n';
import {
  arith,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  open,
  say,
  spreadChoices,
  wordProblem,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Rng } from '../types';

/**
 * World "מספרים עד 1,000", grade 2: the curriculum opens the year with numbers
 * to 1,000 and their decimal structure (hundreds, tens, units), comparing,
 * counting in tens and hundreds, the number line, and adding and taking away
 * whole hundreds and tens.
 */

const ID = 'numbers-1000';
const L = (n: number) => `level.numbers1000.${n}`;

const digits = (n: number) => ({ h: Math.floor(n / 100), te: Math.floor(n / 10) % 10, u: n % 10 });

/** "3 hundreds, 4 tens, 5 units: which number?" */
function build(rng: Rng): Exercise {
  const n = randInt(rng, 101, 999);
  const { h, te, u } = digits(n);
  return exercise({
    factId: `build3:${n}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.build3.prompt', { params: { h, te, u } }),
    display: '',
    spoken: say('ex.build3.spoken', { h, te, u }),
    answer: n,
    input: numpad(3),
    hints: [
      hint(say('ex.build3.hint1')),
      hint(say('ex.build3.hint2'), { visual: { type: 'placeValue', n: n === 352 ? 471 : 352 } }),
      exampleAvoiding(n, [
        { answer: 352, hint: () => exampleHint('300 + 50 + 2 = 352', say('ex.build3.solution', { h: 3, te: 5, u: 2, n: 352 })) },
        { answer: 471, hint: () => exampleHint('400 + 70 + 1 = 471', say('ex.build3.solution', { h: 4, te: 7, u: 1, n: 471 })) },
      ]),
    ],
    solution: say('ex.build3.solution', { h, te, u, n }),
    diagnose: (v) => (v === u * 100 + te * 10 + h ? 'digitReversal' : v === h + te + u ? 'placeValue' : null),
  });
}

/** "What is the 4 in 345 worth?" — a digit that appears once. */
function placeValue(rng: Rng): Exercise {
  let n = 0;
  let pos: number[] = [];
  do {
    n = randInt(rng, 101, 999);
    const ds = String(n).split('').reverse().map(Number);
    pos = ds.map((d, i) => (d !== 0 && ds.filter((x) => x === d).length === 1 ? i : -1)).filter((i) => i >= 0);
  } while (pos.length === 0);
  const i = pick(rng, pos);
  const d = Number(String(n).split('').reverse()[i]);
  const answer = d * 10 ** i;
  return exercise({
    factId: `pv3:${n}:${i}`,
    topicId: ID,
    level: 2,
    prompt: t('ex.placeValue.prompt', { params: { d, n } }),
    display: String(n),
    spoken: say('ex.placeValue.spoken', { d, n }),
    answer,
    input: numpad(3),
    hints: [
      // Where to look, not the answer: counting places from the right.
      hint(say('ex.pv3.hint1')),
      hint(say('ex.placeValue.hint2'), { visual: { type: 'placeValue', n: n === 352 ? 471 : 352 } }),
      exampleAvoiding(answer, [
        { answer: 50, hint: () => exampleHint('352: 5 → 50', say('ex.placeValue.solution', { d: 5, n: 352, v: 50 })) },
        { answer: 400, hint: () => exampleHint('471: 4 → 400', say('ex.placeValue.solution', { d: 4, n: 471, v: 400 })) },
      ]),
    ],
    solution: say('ex.placeValue.solution', { d, n, v: answer }),
    diagnose: (v) => ([1, 10, 100].some((k) => k !== 10 ** i && v === d * k) ? 'placeValue' : null),
  });
}

/** Which is bigger? Same hundreds half the time, so the tens decide. */
function compare(rng: Rng): Exercise {
  const a = randInt(rng, 100, 999);
  let b = rng() < 0.5 ? Math.floor(a / 100) * 100 + randInt(rng, 0, 99) : randInt(rng, 100, 999);
  if (b === a) b = a === 999 ? 998 : a + 1;
  return exercise({
    factId: `cmp3:${a},${b}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.bigger.prompt'),
    display: '',
    spoken: say('ex.bigger.spoken', { a, b }),
    answer: a > b ? 0 : 1,
    input: labelledChoices([String(a), String(b)]),
    hints: [
      hint(say('ex.cmp3.hint1')),
      hint(say('ex.cmp3.hint2')),
      exampleHint('452 > 425', say('ex.bigger.solution', { w: 452, l: 425 })),
    ],
    solution: say('ex.bigger.solution', { w: Math.max(a, b), l: Math.min(a, b) }),
  });
}

/** After, before, ten more, a hundred more. */
function neighbour(rng: Rng): Exercise {
  const kind = pick(rng, ['after', 'before', 'tenMore', 'tenLess', 'hundredMore', 'hundredLess'] as const);
  const delta = { after: 1, before: -1, tenMore: 10, tenLess: -10, hundredMore: 100, hundredLess: -100 }[kind];
  // Crossing a hundred half the time: 399 → 400, 400 → 399, 395 → 405, 704 → 694.
  const h = randInt(rng, 2, 8) * 100;
  const crossing: Record<typeof kind, () => number> = {
    after: () => h + 99,
    before: () => h,
    tenMore: () => h + 90 + randInt(rng, 0, 9),
    tenLess: () => h + randInt(rng, 0, 9),
    hundredMore: () => randInt(rng, 120, 880),
    hundredLess: () => randInt(rng, 120, 880),
  };
  const m = rng() < 0.5 ? crossing[kind]() : randInt(rng, 120, 880);
  const answer = m + delta;
  const key = `ex.n1000.${kind}` as const;
  return exercise({
    factId: `nb3:${kind}:${m}`,
    topicId: ID,
    level: 4,
    prompt: t(`${key}.prompt`, { params: { n: m } }),
    display: String(m),
    spoken: say(`${key}.spoken`, { n: m }),
    answer,
    input: numpad(4),
    hints: [
      hint(say(Math.abs(delta) === 1 ? 'ex.n1000.hint1' : Math.abs(delta) === 10 ? 'ex.n1000.hint10' : 'ex.n1000.hint100')),
      hint(say('ex.n1000.hint2')),
      exampleAvoiding(answer, [
        { answer: 400, hint: () => exampleHint('399 → 400', say('ex.after.solution', { n: 399, c: 400 })) },
        { answer: 600, hint: () => exampleHint('599 → 600', say('ex.after.solution', { n: 599, c: 600 })) },
      ]),
    ],
    solution: say(`${key}.solution`, { n: m, c: answer }),
    diagnose: (v) => (Math.abs(v - answer) === 10 || Math.abs(v - answer) === 100 ? 'offByTen' : null),
  });
}

/** Counting in tens or hundreds: "230, 240, 250, ?" */
function skip(rng: Rng): Exercise {
  const step = pick(rng, [10, 100, 50, 5] as const);
  const start = step === 100 ? randInt(rng, 1, 5) * 100 + pick(rng, [0, 20, 50]) : randInt(rng, 10, 80) * 10;
  const seq = [0, 1, 2].map((k) => start + k * step);
  const answer = start + 3 * step;
  return exercise({
    factId: `skip3:${step}:${start}`,
    topicId: ID,
    level: 5,
    prompt: t('ex.skip.prompt'),
    display: `${seq.join(', ')}, ?`,
    spoken: say('ex.skip3.spoken' as const, Object.fromEntries(seq.map((v, k) => [`n${k}`, v]))),
    answer,
    input: { type: 'choices', choices: spreadChoices(rng, answer, { deltas: [step, 1, 2 * step], min: 0, max: 1200, mix: true }) },
    hints: [
      hint(say('ex.skip.hint1', { step })),
      hint(say('ex.skip3.hint2')),
      exampleAvoiding(answer, [
        { answer: 400, hint: () => exampleHint('100, 200, 300, 400', say('ex.skip.solution', { last: 300, step: 100, next: 400 })) },
        { answer: 160, hint: () => exampleHint('130, 140, 150, 160', say('ex.skip.solution', { last: 150, step: 10, next: 160 })) },
      ]),
    ],
    solution: say('ex.skip.solution', { last: seq[2] ?? start, step, next: answer }),
  });
}

/** 345 = 300 + 40 + ? */
function decompose(rng: Rng): Exercise {
  const n = randInt(rng, 101, 999);
  const { h, te, u } = digits(n);
  const ask = pick(rng, ['h', 'te', 'u'] as const);
  const parts = { h: h * 100, te: te * 10, u };
  const answer = parts[ask];
  const show = (k: 'h' | 'te' | 'u') => (k === ask ? '?' : String(parts[k]));
  return exercise({
    factId: `dec3:${n}:${ask}`,
    topicId: ID,
    level: 6,
    prompt: t('ex.missing.prompt'),
    display: `${n} = ${show('h')} + ${show('te')} + ${show('u')}`,
    spoken: say('ex.dec3.spoken', { n }),
    answer,
    operation: 'add',
    input: numpad(3),
    hints: [
      hint(say('ex.dec3.hint1')),
      hint(say('ex.build3.hint2'), { visual: { type: 'placeValue', n: n === 352 ? 471 : 352 } }),
      exampleAvoiding(answer, [
        { answer: 50, hint: () => exampleHint('352 = 300 + 50 + 2', say('ex.dec3.solution', { n: 352, a: 300, b: 50, c: 2 })) },
        { answer: 70, hint: () => exampleHint('471 = 400 + 70 + 1', say('ex.dec3.solution', { n: 471, a: 400, b: 70, c: 1 })) },
      ]),
    ],
    solution: say('ex.dec3.solution', { n, a: parts.h, b: parts.te, c: parts.u }),
    diagnose: (v) => (v === (ask === 'h' ? h : ask === 'te' ? te : -1) ? 'placeValue' : null),
  });
}

/** Which number is marked on a line from 0 to 1,000 (hundreds and fifties)? */
function marked(rng: Rng): Exercise {
  const n = pick(rng, [100, 200, 300, 400, 500, 600, 700, 800, 900, 150, 250, 350, 450, 550, 650, 750, 850]);
  return exercise({
    factId: `mark3:${n}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.marked.prompt'),
    display: '',
    spoken: say('ex.marked.spoken'),
    visual: { type: 'numberLine', from: 0, to: 1000, start: n, hops: 0, step: 100, hide: n },
    answer: n,
    input: { type: 'choices', choices: spreadChoices(rng, n, { deltas: [50, 100, 10], min: 0, max: 1000, mix: true }) },
    hints: [
      hint(say('ex.mark3.hint1')),
      hint(say('ex.mark3.hint2')),
      exampleAvoiding(n, [
        { answer: 300, hint: () => exampleHint('300', say('ex.marked.solution', { n: 300 })) },
        { answer: 450, hint: () => exampleHint('450', say('ex.marked.solution', { n: 450 })) },
      ]),
    ],
    solution: say('ex.marked.solution', { n }),
  });
}

/** Whole hundreds: 300 + 400, 700 − 200. */
function hundreds(rng: Rng): Exercise {
  const op = rng() < 0.5 ? '+' : '-';
  const a = randInt(rng, 1, 8) * 100;
  const b = op === '+' ? randInt(rng, 1, 9 - a / 100) * 100 : randInt(rng, 1, a / 100) * 100;
  if (op === '-' && a === b) return hundreds(rng);
  return arith({
    topicId: ID,
    level: 8,
    a,
    op,
    b,
    hints: [hint(say('ex.h3.hint1')), hint(say('ex.h3.hint2'))],
    example: op === '+' ? { a: 200, b: 500 } : { a: 900, b: 300 },
    input: numpad(4),
  });
}

/** Whole tens to a three-digit number: 340 + 50, 560 − 30 (no crossing a hundred). */
function tens(rng: Rng): Exercise {
  const op = rng() < 0.5 ? '+' : '-';
  const h = randInt(rng, 1, 9);
  const t1 = randInt(rng, op === '+' ? 0 : 2, op === '+' ? 7 : 9);
  const a = h * 100 + t1 * 10;
  const b = (op === '+' ? randInt(rng, 1, 9 - t1) : randInt(rng, 1, t1 - 1)) * 10;
  return arith({
    topicId: ID,
    level: 9,
    a,
    op,
    b,
    hints: [hint(say('ex.t3.hint1')), hint(say('ex.t3.hint2'))],
    example: op === '+' ? { a: 520, b: 30 } : { a: 480, b: 50 },
    input: numpad(3),
  });
}

/** Word problems with hundreds and tens. */
function word(rng: Rng): Exercise {
  const add = rng() < 0.5;
  const a = randInt(rng, 2, 7) * 100 + randInt(rng, 0, 9) * 10;
  // Something is always left after taking away.
  const b = randInt(rng, 1, add ? 2 : Math.max(1, Math.floor((a - 10) / 100))) * 100;
  return wordProblem({
    topicId: ID,
    level: 10,
    key: add ? 'wp.n1000.add' : 'wp.n1000.sub',
    rng,
    a,
    op: add ? '+' : '-',
    b,
    example: add ? { a: 350, b: 200 } : { a: 640, b: 300 },
    input: numpad(4),
  });
}

export const numbers1000 = defineTopic({
  id: ID,
  labelKey: 'topic.numbers1000',
  grades: [2],
  startLevel: () => 1,
  levels: [
    open(L(1), build),
    open(L(2), placeValue),
    open(L(3), compare),
    open(L(4), neighbour),
    open(L(5), skip),
    open(L(6), decompose),
    open(L(7), marked),
    open(L(8), hundreds),
    open(L(9), tens),
    open(L(10), word),
  ],
});
