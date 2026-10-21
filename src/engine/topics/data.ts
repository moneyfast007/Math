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
  type Said,
} from '../build';
import { pick, randInt, shuffle } from '../rng';
import type { Exercise, Rng, Visual } from '../types';
import {
  THEMES,
  chart,
  more,
  moreExample,
  most,
  pickIndex,
  read,
  smallChoices,
  sum,
  survey,
  themeTitle,
  twoSteps,
  type Survey,
} from './dataKit';

/**
 * World "חקר נתונים", grades 1–3. A class survey, shown as a picture graph
 * (one picture per child), tally marks and a small table for grade 1, then a
 * bar chart with a scale of 2, 5 or 10, two steps, and the results of a
 * survey in a table (grade 3). The average and the percent are in the next
 * world, "נתונים וממוצע" (grades 4–6).
 */

const ID = 'data';
const L = (n: number) => `level.data.${n}`;

const KIDS = { singular: 'ילד', plural: 'ילדים', gender: 'm' } as const;
const LINES = { singular: 'קו', plural: 'קווים', gender: 'm' } as const;

/** Level 4: how many children answered in all? (three small bars, at most twelve) */
function total(rng: Rng): Exercise {
  for (;;) {
    const s = survey(rng, 3, 1, 6);
    const answer = sum(s.vals);
    if (answer > 12) continue;
    return exercise({
      factId: `dtotal:${s.labels.join(',')}:${s.vals.join(',')}`,
      topicId: ID,
      level: 4,
      prompt: t('ex.data.total.prompt'),
      display: '',
      spoken: say('ex.data.total.prompt'),
      visual: chart(s, true),
      answer,
      operation: 'add',
      input: smallChoices(rng, answer),
      hints: [
        hint(say('ex.data.total.hint1')),
        hint(say('ex.data.total.hint2'), {
          example: { display: `${s.vals.join(' + ')} = ?`, spoken: say('ex.data.total.hint2') },
        }),
        exampleAvoiding(answer, [
          {
            answer: 9,
            hint: () => exampleHint('2 + 3 + 4 = 9', say('ex.data.total.example', { r: 9 })),
          },
          {
            answer: 8,
            hint: () => exampleHint('1 + 3 + 4 = 8', say('ex.data.total.example', { r: 8 })),
          },
        ]),
      ],
      solution: say('ex.data.total.solution', { r: answer }),
      diagnose: (v) => (s.vals.some((x) => v === answer - x) ? 'other' : null),
    });
  }
}

/* ---------- Level 5: tally marks ---------- */

function tallyOf(s: Survey): Visual {
  return {
    type: 'tally',
    rows: s.labels.map((label, i) => ({ label, count: s.vals[i] ?? 0 })),
    title: themeTitle(s.theme),
  };
}

/** A solved tally: five and two more is seven (eight when the answer is seven). */
function tallyExample(answer: number) {
  const n = answer === 7 ? 8 : 7;
  return pictureExample(
    say('ex.data2.tally.example', { k: { n: n - 5, noun: LINES }, r: n }),
    { type: 'tally', rows: [{ count: n }] },
    `5 + ${n - 5} = ${n}`,
  );
}

/** How many chose this, from a row of tally marks? Or: which tally shows this number? */
function tally(rng: Rng): Exercise {
  if (rng() < 0.5) {
    const s = survey(rng, 3, 2, 12);
    const i = pickIndex(rng, 3);
    const item = s.labels[i] as string;
    const answer = s.vals[i] as number;
    return exercise({
      factId: `dtally:${s.labels.join(',')}:${s.vals.join(',')}:${i}`,
      topicId: ID,
      level: 5,
      prompt: t('ex.data2.tally.prompt', { params: { item } }),
      display: '',
      spoken: say('ex.data2.tally.prompt', { item }),
      visual: tallyOf(s),
      answer,
      input: smallChoices(rng, answer),
      hints: [
        hint(say('ex.data2.tally.hint1')),
        hint(say('ex.data2.tally.hint2')),
        tallyExample(answer),
      ],
      solution:
        answer === 1
          ? say('ex.data.read.solution1', { item })
          : say('ex.data.read.solution', { item, n: answer }),
      // Counted a closed group as four (its lines), or forgot the diagonal.
      diagnose: (v) => (v === answer - Math.floor(answer / 5) ? 'other' : null),
    });
  }
  const n = randInt(rng, 3, 12);
  // Neighbours, and one group of five more or less: the usual confusions.
  const near = shuffle(
    rng,
    [n - 1, n + 1, n - 5, n + 5].filter((x) => x >= 1 && x <= 15),
  ).slice(0, 2);
  const counts = shuffle(rng, [n, ...near]);
  return exercise({
    factId: `dtallywhich:${counts.join(',')}`,
    topicId: ID,
    level: 5,
    prompt: t('ex.data2.tally.which.prompt', { params: { n } }),
    display: '',
    spoken: say('ex.data2.tally.which.prompt', { n }),
    answer: counts.indexOf(n),
    input: pictureChoices(
      counts.map(String),
      counts.map((count): Visual => ({ type: 'tally', rows: [{ count }] })),
    ),
    hints: [
      hint(say('ex.data2.tally.which.hint1')),
      hint(say('ex.data2.tally.hint2')),
      tallyExample(n),
    ],
    solution: say('ex.data2.tally.which.solution', { n }),
  });
}

/* ---------- Level 6: a small table ---------- */

export function tableOf(s: Survey, cells: (string | number)[] = s.vals): Visual {
  return {
    type: 'table',
    head: [t(`ex.data2.col.${s.theme.key}`), t('ex.data2.col.kids')],
    rows: s.labels.map((label, i) => [label, cells[i] ?? '']),
    title: themeTitle(s.theme),
  };
}

/** Read a row, find the most or the least, or how many more: from a table of counts. */
function table(rng: Rng): Exercise {
  const kind = pick(rng, ['read', 'most', 'more'] as const);
  const s = survey(rng, rng() < 0.5 ? 3 : 4, 1, 10);
  const key = `${s.labels.join(',')}:${s.vals.join(',')}`;
  if (kind === 'read') {
    const i = pickIndex(rng, s.labels.length);
    const item = s.labels[i] as string;
    const answer = s.vals[i] as number;
    return exercise({
      factId: `dtable:${key}:${i}`,
      topicId: ID,
      level: 6,
      prompt: t('ex.data2.table.read.prompt', { params: { item } }),
      display: '',
      spoken: say('ex.data2.table.read.prompt', { item }),
      visual: tableOf(s),
      answer,
      input: smallChoices(rng, answer),
      hints: [
        hint(say('ex.data2.table.read.hint1', { item })),
        hint(say('ex.data2.table.read.hint2')),
        hint(say('ex.data2.table.read.hint3')),
      ],
      solution:
        answer === 1
          ? say('ex.data.read.solution1', { item })
          : say('ex.data.read.solution', { item, n: answer }),
    });
  }
  if (kind === 'most') {
    const least = rng() < 0.5;
    const target = least ? Math.min(...s.vals) : Math.max(...s.vals);
    const right = s.labels[s.vals.indexOf(target)] as string;
    return exercise({
      factId: `dtablemost:${least}:${key}`,
      topicId: ID,
      level: 6,
      prompt: t(least ? 'ex.data2.table.least.prompt' : 'ex.data2.table.most.prompt'),
      display: '',
      spoken: say(least ? 'ex.data2.table.least.prompt' : 'ex.data2.table.most.prompt'),
      visual: tableOf(s),
      answer: s.labels.indexOf(right),
      input: labelledChoices(s.labels, true),
      hints: [
        hint(say(least ? 'ex.data2.table.least.hint1' : 'ex.data2.table.most.hint1')),
        hint(say('ex.data2.table.most.hint2')),
        hint(say('ex.data2.table.read.hint3')),
      ],
      solution: say(least ? 'ex.data.least.solution' : 'ex.data.most.solution', { item: right }),
    });
  }
  const [i, j] = shuffle(
    rng,
    s.vals.map((_, k) => k),
  ).slice(0, 2) as [number, number];
  const [a, b] = (s.vals[i] as number) > (s.vals[j] as number) ? [i, j] : [j, i];
  const A = s.labels[a] as string;
  const B = s.labels[b] as string;
  const answer = (s.vals[a] as number) - (s.vals[b] as number);
  return exercise({
    factId: `dtablemore:${key}:${a},${b}`,
    topicId: ID,
    level: 6,
    prompt: t('ex.data2.table.more.prompt', { params: { a: A, b: B } }),
    display: '',
    spoken: say('ex.data2.table.more.prompt', { a: A, b: B }),
    visual: tableOf(s),
    answer,
    operation: 'sub',
    input: smallChoices(rng, answer),
    hints: [
      hint(say('ex.data.more.hint1')),
      hint(say('ex.data.more.hint2', { a: A, b: B })),
      moreExample(answer),
    ],
    solution: say('ex.data.more.solution', { a: A, b: B, d: answer }),
    diagnose: (v) =>
      v === (s.vals[a] as number) + (s.vals[b] as number) ? 'wrongOperation' : null,
  });
}

/* ---------- Level 10: a class survey (grade 3) ---------- */

/** The results of a survey in a table: how many in all, which two make this many, how many did not. */
function surveyResults(rng: Rng): Exercise {
  const kind = pick(rng, ['total', 'pair', 'not'] as const);
  const s = survey(rng, 4, 3, 18);
  const key = `${s.labels.join(',')}:${s.vals.join(',')}`;
  const all = sum(s.vals);
  if (kind === 'total') {
    return exercise({
      factId: `dsurvey:${key}`,
      topicId: ID,
      level: 10,
      prompt: t('ex.data2.survey.total.prompt'),
      display: '',
      spoken: say('ex.data2.survey.total.prompt'),
      visual: tableOf(s),
      answer: all,
      operation: 'add',
      input: numpad(2),
      hints: [
        hint(say('ex.data2.survey.total.hint1')),
        hint(say('ex.data2.survey.total.hint2'), {
          example: {
            display: `${s.vals.join(' + ')} = ?`,
            spoken: say('ex.data2.survey.total.hint2'),
          },
        }),
        exampleAvoiding(all, [
          {
            answer: 28,
            hint: () =>
              exampleHint('8 + 6 + 9 + 5 = 28', say('ex.data2.survey.total.example', { r: 28 })),
          },
          {
            answer: 26,
            hint: () =>
              exampleHint('7 + 9 + 4 + 6 = 26', say('ex.data2.survey.total.example', { r: 26 })),
          },
        ]),
      ],
      solution: say('ex.data.total.solution', { r: all }),
      diagnose: (v) => (s.vals.some((x) => v === all - x) ? 'other' : null),
    });
  }
  if (kind === 'not') {
    const i = pickIndex(rng, 4);
    const item = s.labels[i] as string;
    const k = s.vals[i] as number;
    const answer = all - k;
    return exercise({
      factId: `dsurveynot:${key}:${i}`,
      topicId: ID,
      level: 10,
      prompt: t('ex.data2.survey.not.prompt', { params: { item } }),
      display: '',
      spoken: say('ex.data2.survey.not.prompt', { item }),
      visual: tableOf(s),
      answer,
      operation: 'sub',
      input: numpad(2),
      hints: [
        hint(say('ex.data2.survey.not.hint1')),
        hint(say('ex.data2.survey.not.hint2', { s: all, item, k: { n: k, noun: KIDS } })),
        exampleAvoiding(answer, [
          {
            answer: 14,
            hint: () =>
              exampleHint(
                '20 − 6 = 14',
                say('ex.data2.survey.not.example', { s: 20, k: { n: 6, gender: 'm' }, r: 14 }),
              ),
          },
          {
            answer: 16,
            hint: () =>
              exampleHint(
                '25 − 9 = 16',
                say('ex.data2.survey.not.example', { s: 25, k: { n: 9, gender: 'm' }, r: 16 }),
              ),
          },
        ]),
      ],
      solution: say('ex.data2.survey.not.solution', { r: answer, item }),
      diagnose: (v) => (v === k ? 'other' : v === all ? 'other' : null),
    });
  }
  // Which two together: exactly one pair of rows makes the number.
  const pairs: [number, number][] = [];
  for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) pairs.push([a, b]);
  const sumOf = ([a, b]: [number, number]) => (s.vals[a] as number) + (s.vals[b] as number);
  const unique = pairs.filter((p) => pairs.filter((q) => sumOf(q) === sumOf(p)).length === 1);
  if (unique.length === 0) return surveyResults(rng);
  const right = pick(rng, unique);
  const n = sumOf(right);
  const others = shuffle(
    rng,
    pairs.filter((p) => sumOf(p) !== n),
  ).slice(0, 2);
  const options = shuffle(rng, [right, ...others]);
  const name = ([a, b]: [number, number]) => `${s.labels[a] as string} ו${s.labels[b] as string}`;
  const tryFirst = options.find((p) => p !== right) as [number, number];
  const said = (p: [number, number]): Said =>
    say('ex.data2.survey.pair.solution', {
      a: s.labels[p[0]] as string,
      b: s.labels[p[1]] as string,
      n: sumOf(p),
    });
  return exercise({
    factId: `dsurveypair:${key}:${options.map((p) => p.join('')).join(',')}`,
    topicId: ID,
    level: 10,
    prompt: t('ex.data2.survey.pair.prompt', { params: { n } }),
    display: '',
    spoken: say('ex.data2.survey.pair.prompt', { n }),
    visual: tableOf(s),
    answer: options.indexOf(right),
    input: labelledChoices(options.map(name), true),
    hints: [
      hint(say('ex.data2.survey.pair.hint1', { n })),
      hint(
        say('ex.data2.survey.pair.hint2', {
          a: s.labels[tryFirst[0]] as string,
          b: s.labels[tryFirst[1]] as string,
          s: sumOf(tryFirst),
          n,
        }),
      ),
      exampleHint('6 + 7 = 13', say('ex.data2.survey.pair.example', { x: 6, y: 7, r: 13 })),
    ],
    solution: said(right),
  });
}

/**
 * The clips of every sentence that names a category: the categories and their
 * pairs are too many for the bank's sample to meet them all. Numbers of 1 and 2
 * are read with their noun inside the clip ("ילד אחד", "שני ילדים"), 3 stands
 * for every larger number (its clips come from the number bank).
 */
function bank(): string[] {
  const out = new Set<string>();
  const add = (...said: { parts: readonly string[] }[]) => {
    for (const x of said) for (const p of x.parts) out.add(p);
  };
  const ns = [1, 2, 3];
  for (const theme of THEMES) {
    for (const item of theme.items) {
      add(
        say('ex.data.read.prompt', { item }),
        say('ex.data.read.hint1', { item }),
        say('ex.data.read.solution1', { item }),
        say('ex.data.most.solution', { item }),
        say('ex.data.least.solution', { item }),
        say('ex.data.two.hint2', { c: item }),
        ...ns.map((n) => say('ex.data.read.solution', { item, n })),
        ...ns.map((r) => say('ex.data.two.solution', { s: 10, c: item, r })),
      );
      for (const b of theme.items) {
        if (b === item) continue;
        add(
          say('ex.data.more.prompt', { a: item, b }),
          say('ex.data.more.hint2', { a: item, b }),
          say('ex.data.two.hint1', { a: item, b }),
          ...ns.map((d) => say('ex.data.more.solution', { a: item, b, d })),
        );
        for (const c of theme.items)
          if (c !== item && c !== b) add(say('ex.data.two.prompt', { a: item, b, c }));
      }
    }
  }
  return [...out];
}

export const data = defineTopic({
  id: ID,
  labelKey: 'topic.data',
  grades: [1, 2, 3],
  // Grade 1 plays the picture graph, tallies and the table; grade 2 the scales; grade 3 the survey.
  startLevel: (grade) => ({ 1: 1, 2: 3, 3: 5 })[grade] ?? 1,
  lastLevel: (grade) => ({ 1: 6, 2: 9 })[grade] ?? 10,
  levels: [
    open(L(1), read({ id: ID, level: 1, steps: [1], bars: 3, top: 8, pictures: true })),
    open(L(2), most(ID, 2, 3, 8, true)),
    open(L(3), more(ID, 3, 3, 9, true)),
    open(L(4), total),
    open('level.data.tally', tally),
    open('level.data.table', table),
    open(L(5), read({ id: ID, level: 7, steps: [2], bars: 4, top: 10 })),
    open(L(6), read({ id: ID, level: 8, steps: [5, 10], bars: 4, top: 10 })),
    open(L(7), twoSteps(ID, 9, 2)),
    open('level.data.survey', surveyResults),
  ],
  extraBank: bank,
});
