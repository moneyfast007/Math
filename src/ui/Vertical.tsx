import { useEffect, useRef, useState } from 'react';
import { cellDigits, marksUpTo, typedAnswer } from '@/engine/vertical';
import type { Line, Visual, VerticalLayout, VerticalMark } from '@/engine/types';
import { t } from '@/i18n';
import type { MistakeKind } from '@/state/schema';
import { NumberPad } from './NumberPad';
import { SpeakerButton } from './SpeakerButton';

/**
 * Column arithmetic, drawn as in the notebook: the numbers one under the
 * other, a line, and the rows written under it (for a multiplication by two
 * digits, two rows and their sum), with the carries and borrows written small
 * above. Columns run left to right like every number; digits are written
 * from the units, as on paper.
 */

type CellState = 'empty' | 'cursor' | 'typed' | 'ok' | 'wrong' | 'given' | 'static';

interface Cell {
  digit?: number;
  state: CellState;
}

const key = (row: number, col: number) => `${row}:${col}`;
const digitsOf = (n: number): number[] => String(n).split('').reverse().map(Number);

/** Column headers (אחדות, עשרות, מאות) are drawn for short exercises only: a 4th letter would repeat א׳. */
const HEADERS = ['col.head.0', 'col.head.1', 'col.head.2'] as const;

interface GridProps {
  layout: VerticalLayout;
  cells: ReadonlyMap<string, Cell>;
  marks: VerticalMark[];
  /** Marks of an earlier group (row) are faded. */
  group: number;
  missing?: { operand: 'top' | 'bottom'; col: number };
  headers?: boolean;
  small?: boolean;
  label: string;
  /** A cell to shake once (a wrong digit in guided mode). */
  shake?: { key: string; n: number } | null;
}

export function VerticalGrid({
  layout,
  cells,
  marks,
  group,
  missing,
  headers = false,
  small = false,
  label,
  shake = null,
}: GridProps) {
  const { width, rows } = layout;
  const hasLabels = rows.some((r) => r.label);
  const columns = (hasLabels ? 1 : 0) + 1 + width;
  /** Grid position of digit column `col` (0 = units, rightmost). */
  const at = (col: number) => (hasLabels ? 1 : 0) + 1 + (width - 1 - col) + 1;
  const signCol = (hasLabels ? 1 : 0) + 1;
  const markAt = new Map<number, VerticalMark>();
  for (const m of marks) {
    const prev = markAt.get(m.col);
    // The current row's mark wins; an older one shows only where there is none.
    if (!prev || (m.group === group && prev.group !== group) || m.group > prev.group)
      markAt.set(m.col, m);
  }
  const struck = new Set(marks.filter((m) => m.strike).map((m) => m.col));
  const top = digitsOf(layout.top);
  const bottom = digitsOf(layout.bottom);
  const sign = layout.op === 'add' ? '+' : layout.op === 'sub' ? '−' : '×';
  const items: React.ReactNode[] = [];
  let r = 1;

  if (headers) {
    for (let c = 0; c < Math.min(width, HEADERS.length); c++) {
      items.push(
        <span key={`h${c}`} className="vgrid__head" style={{ gridRow: r, gridColumn: at(c) }}>
          {t(HEADERS[c] ?? 'col.head.0')}
        </span>,
      );
    }
    r++;
  }

  // Carries and borrows, small, above the top number.
  for (const [col, m] of markAt) {
    items.push(
      <span
        key={`m${col}`}
        className={m.group === group ? 'vgrid__mark' : 'vgrid__mark vgrid__mark--old'}
        style={{ gridRow: r, gridColumn: at(col) }}
      >
        {m.text}
      </span>,
    );
  }
  items.push(<span key="mrow" className="vgrid__markrow" style={{ gridRow: r, gridColumn: 1 }} />);
  r++;

  const operand = (digits: number[], which: 'top' | 'bottom', row: number) =>
    digits.map((d, c) =>
      missing && missing.operand === which && missing.col === c ? (
        <span
          key={`${which}${c}`}
          className="vcell vcell--missing"
          style={{ gridRow: row, gridColumn: at(c) }}
        >
          ?
        </span>
      ) : (
        <span
          key={`${which}${c}`}
          className={
            which === 'top' && struck.has(c) ? 'vgrid__digit vgrid__digit--struck' : 'vgrid__digit'
          }
          style={{ gridRow: row, gridColumn: at(c) }}
        >
          {d}
        </span>
      ),
    );

  items.push(...operand(top, 'top', r));
  r++;
  items.push(
    <span key="sign" className="vgrid__sign" style={{ gridRow: r, gridColumn: signCol }}>
      {sign}
    </span>,
  );
  items.push(...operand(bottom, 'bottom', r));
  r++;
  items.push(
    <span
      key="line0"
      className="vgrid__line"
      style={{ gridRow: r, gridColumn: `${signCol} / -1` }}
    />,
  );
  r++;

  rows.forEach((row, i) => {
    if (row.sum) {
      items.push(
        <span
          key={`line${i}`}
          className="vgrid__line"
          style={{ gridRow: r, gridColumn: `${signCol} / -1` }}
        />,
      );
      r++;
    }
    if (row.label) {
      items.push(
        <span key={`label${i}`} className="vgrid__label" style={{ gridRow: r, gridColumn: 1 }}>
          {row.label}
        </span>,
      );
    }
    if (rows[i + 1]?.sum) {
      items.push(
        <span key={`plus${i}`} className="vgrid__sign" style={{ gridRow: r, gridColumn: signCol }}>
          +
        </span>,
      );
    }
    for (let c = 0; c < row.from; c++) {
      items.push(
        <span key={`z${i}:${c}`} className="vgrid__zero" style={{ gridRow: r, gridColumn: at(c) }}>
          0
        </span>,
      );
    }
    for (const [k, cell] of cells) {
      const [rr, cc] = k.split(':').map(Number);
      if (rr !== i || cc === undefined) continue;
      const shaking = shake?.key === k;
      items.push(
        <span
          key={shaking ? `${k}:${shake.n}` : k}
          className={`vcell vcell--${cell.state}${shaking ? ' vcell--shake' : ''}`}
          style={{ gridRow: r, gridColumn: at(cc) }}
        >
          {cell.digit ?? ''}
        </span>,
      );
    }
    r++;
  });

  return (
    <div
      className={small ? 'vgrid vgrid--small' : 'vgrid'}
      dir="ltr"
      role="img"
      aria-label={label}
      data-math=""
      style={{
        gridTemplateColumns: `${hasLabels ? 'auto ' : ''}repeat(${columns - (hasLabels ? 1 : 0)}, var(--vcell))`,
      }}
    >
      {items}
    </div>
  );
}

/** A solved (or partly solved, or wrong) column exercise as a picture: hints, find the mistake. */
export function VerticalView({ visual }: { visual: Extract<Visual, { type: 'vertical' }> }) {
  const { layout, upto = layout.steps.length, wrong, missing } = visual;
  const cells = new Map<string, Cell>();
  layout.steps.forEach((s, i) => {
    const k = key(s.row, s.col);
    if (i < upto) cells.set(k, { digit: s.digit, state: 'static' });
  });
  if (wrong) cells.set(key(wrong.row, wrong.col), { digit: wrong.digit, state: 'static' });
  const clean = wrong !== undefined || missing !== undefined;
  const marks = clean ? [] : marksUpTo(layout, upto);
  const group = layout.steps[Math.max(0, upto - 1)]?.row ?? 0;
  return (
    <div className="vertical-visual" data-visual="vertical">
      <VerticalGrid
        layout={layout}
        cells={cells}
        marks={marks}
        group={group}
        {...(missing ? { missing } : {})}
        small
        label={describe(layout)}
      />
    </div>
  );
}

function describe(layout: VerticalLayout): string {
  const op = layout.op === 'add' ? t('op.add') : layout.op === 'sub' ? t('op.sub') : t('op.mul');
  return t('col.aria', { params: { a: layout.top, op, b: layout.bottom } });
}

/* ---------- Writing the answer ---------- */

interface WorkProps {
  layout: VerticalLayout;
  guided: boolean;
  /** The round's phase for this exercise. */
  phase: 'answering' | 'wrong' | 'correct' | 'revealed';
  slow: boolean;
  /** A wrong digit in guided mode (assisted: then written for the child). */
  onMiss: (mistake: MistakeKind | null, assisted: boolean) => void;
  /** The finished answer: guided, always the right one; otherwise what was written. */
  onSubmit: (value: number) => void;
}

/**
 * The column exercise being answered: the grid, the line that says what to do
 * (guided) or what went wrong, and the number pad.
 */
export function ColumnWork({
  layout,
  guided: startGuided,
  phase,
  slow,
  onMiss,
  onSubmit,
}: WorkProps) {
  const steps = layout.steps;
  const expected = cellDigits(layout);
  const [guided, setGuided] = useState(startGuided);
  const [typed, setTyped] = useState<Map<string, number>>(() => new Map());
  const [checked, setChecked] = useState(false);
  const [misses, setMisses] = useState(0);
  const [message, setMessage] = useState<{ lines: Line[]; tone: 'ask' | 'explain' } | null>(null);
  const [shake, setShake] = useState<{ key: string; n: number } | null>(null);
  const submitted = useRef(false);

  const finished = phase === 'correct' || phase === 'revealed';
  const pos = steps.findIndex((s) => !typed.has(key(s.row, s.col)));
  const next = pos < 0 ? undefined : steps[pos];

  const askAt = (i: number): Line[] => {
    const s = steps[i];
    if (!s) return [];
    const firstOfRow = i === 0 || steps[i - 1]?.row !== s.row;
    const intro = firstOfRow ? layout.rowIntro[s.row] : null;
    return intro ? [intro, s.ask] : [s.ask];
  };

  // Guided: say what to do in the first column.
  useEffect(() => {
    if (startGuided) setMessage({ lines: askAt(0), tone: 'ask' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Written whole and checked wrong: the round says so; here, which cells and the marks.
  useEffect(() => {
    if (phase === 'wrong' && !guided && submitted.current) setChecked(true);
    if (phase === 'answering' || phase === 'wrong') submitted.current = false;
  }, [phase, guided]);

  const cells = new Map<string, Cell>();
  for (const s of steps) {
    const k = key(s.row, s.col);
    const d = typed.get(k);
    if (finished) {
      cells.set(k, {
        digit: s.digit,
        state: phase === 'revealed' && d !== s.digit ? 'given' : 'ok',
      });
    } else if (d !== undefined) {
      const right = d === expected.get(k);
      cells.set(k, { digit: d, state: guided || checked ? (right ? 'ok' : 'wrong') : 'typed' });
    } else {
      cells.set(k, { state: next && k === key(next.row, next.col) ? 'cursor' : 'empty' });
    }
  }
  const showAll = finished || checked;
  const marks = showAll
    ? marksUpTo(layout, steps.length)
    : guided
      ? marksUpTo(layout, pos < 0 ? steps.length : pos)
      : [];
  const group = next?.row ?? layout.rows.length - 1;

  const write = (digit: number) => {
    if (finished || !next) return;
    const k = key(next.row, next.col);
    if (!guided) {
      if (checked) {
        // Writing again after a check: the wrong cells are cleared first.
        const kept = new Map([...typed].filter(([kk, d]) => d === expected.get(kk)));
        kept.set(key(next.row, next.col), digit);
        setChecked(false);
        setTyped(kept);
        return;
      }
      setTyped(new Map(typed).set(k, digit));
      return;
    }
    if (digit === next.digit) {
      const t2 = new Map(typed).set(k, digit);
      setTyped(t2);
      setMisses(0);
      if (pos === steps.length - 1) {
        setMessage(null);
        onSubmit(layout.rows.at(-1)?.value ?? 0);
      } else {
        setMessage({ lines: askAt(pos + 1), tone: 'ask' });
      }
      return;
    }
    const kind = next.slips.find((x) => x.digit === digit)?.kind ?? null;
    setShake({ key: k, n: (shake?.n ?? 0) + 1 });
    if (misses === 0) {
      onMiss(kind, false);
      setMisses(1);
      setMessage({ lines: [next.explain], tone: 'explain' });
      return;
    }
    // A second slip on the same digit: it is written for her, and on we go.
    onMiss(kind, true);
    const t2 = new Map(typed).set(k, next.digit);
    setTyped(t2);
    setMisses(0);
    if (pos === steps.length - 1) onSubmit(layout.rows.at(-1)?.value ?? 0);
    else setMessage({ lines: [next.explain, ...askAt(pos + 1)], tone: 'explain' });
  };

  const erase = () => {
    if (guided || finished) return;
    const written = steps.filter((s) => typed.has(key(s.row, s.col)));
    const last = written.at(-1);
    if (!last) return;
    const t2 = new Map(typed);
    t2.delete(key(last.row, last.col));
    setTyped(t2);
    setChecked(false);
  };

  const check = () => {
    const value = typedAnswer(layout, typed);
    if (value === null || pos >= 0) return;
    submitted.current = true;
    onSubmit(value);
  };

  /** From the first wrong cell on, column by column with help. */
  const together = () => {
    const firstWrong = steps.findIndex((s) => typed.get(key(s.row, s.col)) !== s.digit);
    const keep = new Map<string, number>();
    steps.slice(0, Math.max(0, firstWrong)).forEach((s) => keep.set(key(s.row, s.col), s.digit));
    setTyped(keep);
    setGuided(true);
    setChecked(false);
    setMisses(0);
    setMessage({ lines: askAt(Math.max(0, firstWrong)), tone: 'ask' });
  };

  const again = () => {
    setTyped(new Map([...typed].filter(([k, d]) => d === expected.get(k))));
    setChecked(false);
  };

  const headers = guided && layout.width <= HEADERS.length;

  return (
    <div className="column-work">
      <VerticalGrid
        layout={layout}
        cells={cells}
        marks={marks}
        group={group}
        headers={headers}
        label={describe(layout)}
        shake={shake}
      />
      {!finished && message ? (
        <div
          className={
            message.tone === 'explain'
              ? 'column-work__say column-work__say--explain'
              : 'column-work__say'
          }
          role="status"
        >
          {message.lines.map((l, i) => (
            <p key={i} className="column-work__line">
              <SpeakerButton text={l.spoken} parts={l.parts} slow={slow} />
              <span>{l.text}</span>
            </p>
          ))}
        </div>
      ) : null}
      {!finished ? (
        checked ? (
          <div className="row column-work__after" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn" onClick={together}>
              {t('col.together')}
            </button>
            <button type="button" className="btn btn--secondary" onClick={again}>
              {t('col.again')}
            </button>
          </div>
        ) : (
          <NumberPad
            label={t('practice.answerLabel')}
            value={typed.size > 0 && !guided ? '#' : ''}
            onChange={() => undefined}
            onDigit={(d) => write(Number(d))}
            onBackspace={erase}
            maxLength={99}
            code
            {...(guided ? {} : { onSubmit: check, submitDisabled: pos >= 0 })}
          />
        )
      ) : null}
    </div>
  );
}
