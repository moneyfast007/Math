import type { Visual } from '@/engine/types';

/**
 * The pictures of the data worlds besides the bar chart (see Bars in
 * Visuals.tsx, whose look these share): tally marks, a small table, a double
 * bar chart, a line graph and a pie chart. Colours come from the theme's
 * tokens (global.css), except the slices of a pie, which need four that
 * differ from each other in every age band.
 */

type Of<T extends Visual['type']> = Extract<Visual, { type: T }>;

/* ---------- Tally marks ---------- */

const STROKE_GAP = 11;
const GROUP_W = 4 * STROKE_GAP + 12;
const MARK_H = 40;

/** One count in tally marks: groups of four strokes closed by a diagonal, then the rest. */
export function TallyMarks({ count }: { count: number }) {
  const groups = Math.floor(count / 5);
  const rest = count % 5;
  const width = Math.max(groups * GROUP_W + rest * STROKE_GAP + 8, 20);
  const stroke = (x: number, key: string) => (
    <line key={key} x1={x} y1={6} x2={x} y2={MARK_H - 6} className="tally__stroke" />
  );
  return (
    <svg
      viewBox={`0 0 ${width} ${MARK_H}`}
      width={width}
      height={MARK_H}
      className="tally__marks"
      aria-hidden="true"
    >
      {Array.from({ length: groups }, (_, g) => {
        const x0 = 6 + g * GROUP_W;
        return (
          <g key={g}>
            {[0, 1, 2, 3].map((k) => stroke(x0 + k * STROKE_GAP, `s${k}`))}
            <line
              x1={x0 - 5}
              y1={MARK_H - 10}
              x2={x0 + 3 * STROKE_GAP + 5}
              y2={10}
              className="tally__stroke tally__stroke--closing"
            />
          </g>
        );
      })}
      {Array.from({ length: rest }, (_, k) =>
        stroke(6 + groups * GROUP_W + k * STROKE_GAP, `r${k}`),
      )}
    </svg>
  );
}

export function Tally({ v }: { v: Of<'tally'> }) {
  const labelled = v.rows.some((r) => r.label);
  if (!labelled)
    return (
      <div className="tally tally--bare" dir="ltr" data-visual="tally" aria-hidden="true">
        {v.rows.map((r, i) => (
          <TallyMarks key={i} count={r.count} />
        ))}
      </div>
    );
  return (
    <figure className="tally" data-visual="tally" aria-hidden="true">
      {v.title ? <figcaption className="bars__title">{v.title}</figcaption> : null}
      <div className="tally__rows" dir="rtl">
        {v.rows.map((r, i) => (
          <div key={i} className="tally__row">
            <span className="tally__label">{r.label}</span>
            <span className="tally__cell" dir="ltr">
              <TallyMarks count={r.count} />
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}

/* ---------- A small table ---------- */

export function DataTable({ v }: { v: Of<'table'> }) {
  return (
    <figure className="dtable" data-visual="table" aria-hidden="true">
      {v.title ? <figcaption className="bars__title">{v.title}</figcaption> : null}
      <table className="dtable__table" dir="rtl">
        <thead>
          <tr>
            {v.head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {v.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  className={
                    cell === '?'
                      ? 'dtable__ask'
                      : typeof cell === 'number'
                        ? 'dtable__num'
                        : undefined
                  }
                  dir={typeof cell === 'number' ? 'ltr' : undefined}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/* ---------- The scale shared by the double bars and the line graph ---------- */

const W = 300;
const H = 180;
const LEFT = 34;
const BOTTOM = 26;
const PLOT_H = H - BOTTOM - 8;

function scale(top: number, step: number) {
  const max = Math.ceil(top / step) * step + step;
  const lines = max / step;
  const y = (n: number) => 8 + PLOT_H - (n / max) * PLOT_H;
  const labelEvery = lines > 10 ? 2 : 1;
  const grid = Array.from({ length: lines + 1 }, (_, i) => i * step).map((n, i) => (
    <g key={n}>
      <line
        x1={LEFT}
        y1={y(n)}
        x2={W - 4}
        y2={y(n)}
        className={n === 0 ? 'bars__axis' : 'bars__grid'}
      />
      {i % labelEvery === 0 ? (
        <text
          x={LEFT - 6}
          y={y(n)}
          textAnchor="end"
          dominantBaseline="middle"
          className="bars__num"
        >
          {n}
        </text>
      ) : null}
    </g>
  ));
  return { y, grid };
}

/* ---------- A double bar chart ---------- */

export function Bars2({ v }: { v: Of<'bars2'> }) {
  const top = Math.max(...v.groups.flatMap((g) => [g.a, g.b]));
  const { y, grid } = scale(top, v.step);
  const slot = (W - LEFT - 6) / v.groups.length;
  const bar = slot * 0.3;
  return (
    <figure
      className="bars"
      dir="ltr"
      data-visual="bars2"
      role="img"
      aria-label={v.groups
        .map((g) => `${g.label}: ${v.series[0]} ${g.a}, ${v.series[1]} ${g.b}`)
        .join('; ')}
    >
      {v.title ? (
        <figcaption className="bars__title" dir="rtl">
          {v.title}
        </figcaption>
      ) : null}
      <div className="bars__legend" dir="rtl">
        <span className="bars__key">
          <span className="bars__swatch bars__swatch--a" />
          {v.series[0]}
        </span>
        <span className="bars__key">
          <span className="bars__swatch bars__swatch--b" />
          {v.series[1]}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="bars__svg">
        {grid}
        {v.groups.map((g, i) => {
          const mid = LEFT + i * slot + slot / 2;
          // As read from the right: the first group's bar on the right, like the legend.
          return (
            <g key={g.label}>
              <rect
                x={mid}
                y={y(g.a)}
                width={bar}
                height={y(0) - y(g.a)}
                className="bars__bar bars__bar--a"
                rx="3"
              />
              <rect
                x={mid - bar}
                y={y(g.b)}
                width={bar}
                height={y(0) - y(g.b)}
                className="bars__bar bars__bar--b"
                rx="3"
              />
              <text x={mid} y={H - 8} textAnchor="middle" className="bars__label">
                {g.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

/* ---------- A line graph ---------- */

export function LineGraph({ v }: { v: Of<'lineGraph'> }) {
  const top = Math.max(...v.points.map((p) => p.value));
  const { y, grid } = scale(top, v.step);
  const slot = (W - LEFT - 6) / v.points.length;
  // Time runs to the right, as on every graph of the maths lesson.
  const x = (i: number) => LEFT + i * slot + slot / 2;
  const path = v.points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  return (
    <figure
      className="bars"
      dir="ltr"
      data-visual="lineGraph"
      role="img"
      aria-label={v.points.map((p) => `${p.label}: ${p.value}`).join(', ')}
    >
      {v.title ? (
        <figcaption className="bars__title" dir="rtl">
          {v.title}
        </figcaption>
      ) : null}
      <svg viewBox={`0 0 ${W} ${H}`} className="bars__svg">
        {grid}
        <polyline points={path} className="line__path" />
        {v.points.map((p, i) => (
          <g key={p.label}>
            <circle cx={x(i)} cy={y(p.value)} r="5" className="line__dot" />
            <text x={x(i)} y={H - 8} textAnchor="middle" className="bars__label">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

/* ---------- A pie chart ---------- */

const PIE_COLORS = ['#5b63d6', '#e2a33b', '#2f8f83', '#c45f9e'];

export function Pie({ v }: { v: Of<'pie'> }) {
  const cx = 82;
  const cy = 82;
  const r = 74;
  const at = (k: number) => {
    // Clockwise from the top, in parts of the whole.
    const a = (k / v.of) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  let start = 0;
  const slices = v.slices.map((s, i) => {
    const a = at(start);
    const b = at(start + s.parts);
    const large = s.parts * 2 > v.of ? 1 : 0;
    const d =
      s.parts === v.of
        ? `M ${cx} ${cy - r} a ${r} ${r} 0 1 1 0 ${2 * r} a ${r} ${r} 0 1 1 0 ${-2 * r}`
        : `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
    start += s.parts;
    return <path key={i} d={d} fill={PIE_COLORS[i % PIE_COLORS.length]} className="pie__slice" />;
  });
  const guides = Array.from({ length: v.of }, (_, k) => {
    const p = at(k);
    return <line key={k} x1={cx} y1={cy} x2={p.x} y2={p.y} className="pie__guide" />;
  });
  const rowH = 30;
  const legendTop = cy - (v.slices.length * rowH) / 2 + rowH / 2;
  return (
    <figure
      className="bars"
      dir="ltr"
      data-visual="pie"
      role="img"
      aria-label={v.slices.map((s) => `${s.label}: ${s.parts}/${v.of}`).join(', ')}
    >
      {v.title ? (
        <figcaption className="bars__title" dir="rtl">
          {v.title}
        </figcaption>
      ) : null}
      <svg viewBox="0 0 300 164" className="bars__svg">
        {slices}
        {guides}
        <circle cx={cx} cy={cy} r={r} className="pie__rim" />
        {v.slices.map((s, i) => {
          const yy = legendTop + i * rowH;
          return (
            <g key={s.label}>
              <rect
                x={268}
                y={yy - 10}
                width={20}
                height={20}
                rx="4"
                fill={PIE_COLORS[i % PIE_COLORS.length]}
              />
              <text
                x={258}
                y={yy}
                textAnchor="end"
                dominantBaseline="middle"
                className="pie__label"
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
