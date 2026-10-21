import type { CSSProperties, ReactNode } from 'react';
import type { BalancePan, MeasureThing, Visual } from '@/engine/types';

/**
 * Pictures of the world "מדידה ראשונה" (grade 1): things lying from one start
 * line or standing on one floor (with paper clips to measure them), a balance,
 * and the days of the week. Plain SVG (the week: cards), self-contained: the
 * colours are the design tokens or fixed toy colours, the styles inline.
 */

type Lengths = Extract<Visual, { type: 'lengths' }>;

/** One unit (a paper clip) lying down, and standing up. */
const U = 28;
const SU = 22;
/** A lying picture is never scaled up beyond the size of a thing three clips long. */
const MIN_UNITS = 3;

const INK = 'var(--color-text)';
const MUTED = 'var(--color-text-muted)';
const ACCENT = 'var(--color-accent-strong)';

/* ---------- Lying things: from x0 to x1, centred on y ---------- */

function Lying({ thing, x0, x1, y }: { thing: MeasureThing; x0: number; x1: number; y: number }) {
  switch (thing) {
    case 'pencil':
      return (
        <g>
          <rect x={x0} y={y - 9} width={8} height={18} rx={2.5} fill="#f2a1b5" />
          <rect x={x0 + 7} y={y - 9} width={5} height={18} fill="#b9b9c0" />
          <rect
            x={x0 + 12}
            y={y - 9}
            width={Math.max(0, x1 - 16 - (x0 + 12))}
            height={18}
            fill="#f0b429"
          />
          <line x1={x0 + 12} y1={y} x2={x1 - 16} y2={y} stroke="#d99a1b" strokeWidth={2} />
          <path d={`M${x1 - 16} ${y - 9} L${x1} ${y} L${x1 - 16} ${y + 9} Z`} fill="#f3d9b0" />
          <path d={`M${x1 - 6} ${y - 3.4} L${x1} ${y} L${x1 - 6} ${y + 3.4} Z`} fill="#3a2f2a" />
        </g>
      );
    case 'ribbon':
      return (
        <g>
          <path
            d={`M${x0} ${y - 9} L${x1} ${y - 9} L${x1 - 7} ${y} L${x1} ${y + 9} L${x0} ${y + 9} L${x0 + 7} ${y} Z`}
            fill="#c45f9e"
          />
          <line
            x1={x0 + 11}
            y1={y}
            x2={x1 - 11}
            y2={y}
            stroke="#f0bedc"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        </g>
      );
    case 'snake': {
      // A wavy body from the tail (a round end at x0) to the head (its nose at x1).
      const xs = x0 + 5.5;
      const xe = x1 - 15;
      const pts: string[] = [];
      for (let x = xs; x <= xe + 0.01; x += 2)
        pts.push(`${x.toFixed(1)} ${(y + 4 * Math.sin(((x - xs) / U) * 2 * Math.PI)).toFixed(1)}`);
      return (
        <g>
          <path
            d={`M${pts.join(' L')}`}
            fill="none"
            stroke="#3f9e5a"
            strokeWidth={11}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <ellipse cx={x1 - 9} cy={y} rx={9} ry={8} fill="#3f9e5a" />
          <circle cx={x1 - 7} cy={y - 3} r={2.4} fill="#fff" />
          <circle cx={x1 - 6.4} cy={y - 3} r={1.2} fill="#3a2f2a" />
        </g>
      );
    }
    case 'brush':
      return (
        <g>
          <rect
            x={x0}
            y={y - 4}
            width={Math.max(0, x1 - 24 - x0)}
            height={8}
            rx={4}
            fill="#e8604c"
          />
          <rect x={x1 - 25} y={y - 6} width={11} height={12} rx={1.5} fill="#b9b9c0" />
          <path
            d={`M${x1 - 14} ${y - 7} Q${x1 - 4} ${y - 6} ${x1} ${y} Q${x1 - 4} ${y + 6} ${x1 - 14} ${y + 7} Z`}
            fill="#7a4a12"
          />
          <path
            d={`M${x1 - 6} ${y - 3.2} Q${x1 - 2} ${y - 2} ${x1} ${y} Q${x1 - 2} ${y + 2} ${x1 - 6} ${y + 3.2} Z`}
            fill="#5b63d6"
          />
        </g>
      );
    default:
      return null;
  }
}

/* ---------- Standing things: on the floor at `floor`, reaching up to `top` ---------- */

const BLOCKS = ['#e8604c', '#f0b429', '#5b63d6', '#3f9e5a'];

function Standing({
  thing,
  cx,
  floor,
  top,
}: {
  thing: MeasureThing;
  cx: number;
  floor: number;
  top: number;
}) {
  const h = floor - top;
  switch (thing) {
    case 'tower': {
      const n = Math.round(h / SU);
      return (
        <g>
          {Array.from({ length: n }, (_, i) => (
            <rect
              key={i}
              x={cx - 17}
              y={floor - (i + 1) * SU}
              width={34}
              height={SU}
              rx={3}
              fill={BLOCKS[i % BLOCKS.length]}
              stroke="var(--color-surface)"
              strokeWidth={1.5}
            />
          ))}
        </g>
      );
    }
    case 'tree': {
      const r = Math.min(22, h * 0.36);
      return (
        <g>
          <rect x={cx - 6} y={top + r} width={12} height={h - r} fill="#8a5a3b" />
          <circle cx={cx - r * 0.62} cy={top + r * 1.35} r={r * 0.68} fill="#3a8a50" />
          <circle cx={cx + r * 0.62} cy={top + r * 1.35} r={r * 0.68} fill="#3a8a50" />
          <circle cx={cx} cy={top + r} r={r} fill="#4caf65" />
        </g>
      );
    }
    case 'flower': {
      const c = top + 11;
      return (
        <g>
          <line
            x1={cx}
            y1={floor}
            x2={cx}
            y2={c}
            stroke="#3f9e5a"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <ellipse
            cx={cx + 7}
            cy={floor - h * 0.35}
            rx={8}
            ry={4}
            fill="#3f9e5a"
            transform={`rotate(-30 ${cx + 7} ${floor - h * 0.35})`}
          />
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * 2 * Math.PI - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={cx + 6 * Math.cos(a)}
                cy={c + 6 * Math.sin(a)}
                r={5.5}
                fill="#e8604c"
              />
            );
          })}
          <circle cx={cx} cy={c} r={4.5} fill="#f0b429" />
        </g>
      );
    }
    case 'bottle': {
      const neck = Math.min(14, h * 0.2);
      const shoulder = top + 6 + neck;
      return (
        <g>
          <path
            d={`M${cx - 5} ${top + 6} L${cx + 5} ${top + 6} L${cx + 5} ${shoulder} Q${cx + 15} ${shoulder + 2} ${cx + 15} ${shoulder + 8}
              L${cx + 15} ${floor - 3} Q${cx + 15} ${floor} ${cx + 12} ${floor} L${cx - 12} ${floor} Q${cx - 15} ${floor} ${cx - 15} ${floor - 3}
              L${cx - 15} ${shoulder + 8} Q${cx - 15} ${shoulder + 2} ${cx - 5} ${shoulder} Z`}
            fill="#bfe3f5"
            stroke="#5a9fc4"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <rect x={cx - 6.5} y={top} width={13} height={7} rx={2} fill="#e8604c" />
        </g>
      );
    }
    default:
      return null;
  }
}

/* ---------- Paper clips ---------- */

function Clip({ x, y, color, fill }: { x: number; y: number; color: string; fill?: string }) {
  return (
    <g>
      <rect
        x={x + 1.5}
        y={y}
        width={U - 3}
        height={12}
        rx={6}
        fill={fill ?? 'none'}
        stroke={color}
        strokeWidth={2}
      />
      <path
        d={`M${x + U - 6} ${y + 3.5} H${x + 7.5} a2.5 2.5 0 0 0 0 5 H${x + U - 9}`}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </g>
  );
}

const CLIP = '#5b63d6';
const CLIP_ALT = '#e8793a';
const MARK = '#c45f24';
const MARK_FILL = '#fde3d2';

const dash = { strokeDasharray: '5 4', strokeWidth: 2, strokeLinecap: 'round' } as const;

function svg(width: number, height: number, cssWidth: string, children: ReactNode, name: string) {
  const style: CSSProperties = {
    width: cssWidth,
    height: 'auto',
    display: 'block',
    overflow: 'visible',
  };
  return (
    <div
      dir="ltr"
      data-visual={name}
      aria-hidden="true"
      style={{ display: 'flex', justifyContent: 'center', width: '100%', alignSelf: 'stretch' }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} style={style}>
        {children}
      </svg>
    </div>
  );
}

export function LengthsView({ v }: { v: Lengths }) {
  if (v.icon) {
    const item = v.items[0];
    if (!item) return null;
    if (v.stand) {
      const floor = 3 * SU + 6;
      return svg(
        52,
        floor + 2,
        'min(64px, 18vw)',
        <Standing thing={item.thing} cx={26} floor={floor} top={floor - 3 * SU} />,
        'lengths',
      );
    }
    // Mirrored like the big picture: it starts on the right and points left.
    return svg(
      3 * U + 8,
      26,
      'min(110px, 26vw)',
      <g transform={`translate(${3 * U + 8} 0) scale(-1 1)`}>
        <Lying thing={item.thing} x0={4} x1={4 + 3 * U} y={13} />
      </g>,
      'lengths',
    );
  }
  return v.stand ? <StandingRow v={v} /> : <LyingRows v={v} />;
}

/**
 * Lying things, drawn left to right and then mirrored as a whole: the start line
 * is on the right and everything extends to the left, the way a Hebrew reader
 * looks (the clips are counted from the right). The picture fills the width it
 * is given, the longest thing about 88% of it; a very short set (under three
 * clips) is not blown up beyond the size of three.
 */
function LyingRows({ v }: { v: Lengths }) {
  const units = Math.max(MIN_UNITS, ...v.items.map((i) => i.len));
  const width = (units * U) / 0.88;
  const x0 = width * 0.07;
  const band = 24;
  const clipBand = v.clips ? 18 : 0;
  const gap = 14;
  const rowH = band + clipBand;
  const height = 8 + v.items.length * rowH + (v.items.length - 1) * gap + 6;
  const rowTop = (i: number) => 8 + i * (rowH + gap);
  return svg(
    width,
    height,
    'min(440px, 100%)',
    <g transform={`translate(${width} 0) scale(-1 1)`}>
      {/* The start line: everything is measured from here. */}
      <line x1={x0} y1={2} x2={x0} y2={height - 2} stroke={MUTED} {...dash} />
      {v.guide !== undefined ? (
        <line
          x1={x0 + v.guide * U}
          y1={2}
          x2={x0 + v.guide * U}
          y2={height - 2}
          stroke={ACCENT}
          {...dash}
          strokeWidth={2.5}
        />
      ) : null}
      {v.items.map((item, i) => {
        const top = rowTop(i);
        const x1 = x0 + item.len * U;
        return (
          <g key={i}>
            <Lying thing={item.thing} x0={x0} x1={x1} y={top + band / 2} />
            {v.clips
              ? Array.from({ length: item.len }, (_, k) => {
                  const marked = i === 0 && v.extra !== undefined && k >= v.extra;
                  const color = marked ? MARK : v.alt && k % 2 === 1 ? CLIP_ALT : CLIP;
                  return (
                    <Clip
                      key={k}
                      x={x0 + k * U}
                      y={top + band + 4}
                      color={color}
                      {...(marked ? { fill: MARK_FILL } : {})}
                    />
                  );
                })
              : null}
          </g>
        );
      })}
    </g>,
    'lengths',
  );
}

function StandingRow({ v }: { v: Lengths }) {
  const col = 60;
  const gap = 16;
  const pad = 12;
  const units = Math.max(8, ...v.items.map((i) => i.len));
  const floor = 10 + units * SU;
  const width = pad * 2 + v.items.length * col + (v.items.length - 1) * gap;
  const height = floor + 10;
  return svg(
    width,
    height,
    `min(${Math.round(width * 1.05)}px, 80vw)`,
    <>
      {v.guide !== undefined ? (
        <line
          x1={4}
          y1={floor - v.guide * SU}
          x2={width - 4}
          y2={floor - v.guide * SU}
          stroke={ACCENT}
          {...dash}
          strokeWidth={2.5}
        />
      ) : null}
      {v.items.map((item, i) => {
        const cx = pad + i * (col + gap) + col / 2;
        return (
          <Standing key={i} thing={item.thing} cx={cx} floor={floor} top={floor - item.len * SU} />
        );
      })}
      {/* The floor they all stand on. */}
      <line
        x1={2}
        y1={floor + 1.5}
        x2={width - 2}
        y2={floor + 1.5}
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </>,
    'lengths',
  );
}

/* ---------- The balance ---------- */

function PanLoad({ pan, x, rim }: { pan: BalancePan; x: number; rim: number }) {
  if (pan.emoji)
    return (
      <text x={x} y={rim - 3} fontSize={40} textAnchor="middle">
        {pan.emoji}
      </text>
    );
  const n = pan.cubes ?? 0;
  const size = 18;
  const step = size + 2;
  const perRow = 4;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const row = Math.floor(i / perRow);
        const inRow = Math.min(perRow, n - row * perRow);
        const k = i % perRow;
        const left = x - (inRow * step - 2) / 2;
        return (
          <rect
            key={i}
            x={left + k * step}
            y={rim - 2 - (row + 1) * step + 2}
            width={size}
            height={size}
            rx={2.5}
            fill="#f0b429"
            stroke="#b9800f"
            strokeWidth={1.5}
          />
        );
      })}
    </g>
  );
}

function Arrow({ x, y, up }: { x: number; y: number; up: boolean }) {
  // An arrow 22 long, from y down (or up to y).
  const [from, to] = up ? [y + 22, y] : [y, y + 22];
  const head = up ? to + 7 : to - 7;
  return (
    <g stroke={ACCENT} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={x} y1={from} x2={x} y2={to} />
      <path d={`M${x - 6} ${head} L${x} ${to} L${x + 6} ${head}`} />
    </g>
  );
}

export function BalanceView({ v }: { v: Extract<Visual, { type: 'balance' }> }) {
  const px = 150;
  const py = 44;
  const half = 104;
  const tilt = v.down === 'left' ? 1 : v.down === 'right' ? -1 : 0;
  const a = (tilt * 11 * Math.PI) / 180;
  const ends = [
    { x: px - half * Math.cos(a), y: py + half * Math.sin(a), pan: v.left, down: tilt === 1 },
    { x: px + half * Math.cos(a), y: py - half * Math.sin(a), pan: v.right, down: tilt === -1 },
  ];
  const drop = 62;
  return svg(
    300,
    200,
    'min(320px, 86vw)',
    <>
      {/* The stand */}
      <path d="M118 192 L182 192 L170 180 L130 180 Z" fill="#8a6a4a" />
      <rect x={146} y={py} width={8} height={138} fill="#8a6a4a" />
      {ends.map((e, i) => (
        <g key={i}>
          <line x1={e.x} y1={e.y} x2={e.x - 42} y2={e.y + drop} stroke={MUTED} strokeWidth={1.5} />
          <line x1={e.x} y1={e.y} x2={e.x + 42} y2={e.y + drop} stroke={MUTED} strokeWidth={1.5} />
          <PanLoad pan={e.pan} x={e.x} rim={e.y + drop} />
          <path
            d={`M${e.x - 47} ${e.y + drop} Q${e.x} ${e.y + drop + 20} ${e.x + 47} ${e.y + drop} Z`}
            fill="#e0b979"
            stroke="#a8803f"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {v.arrows && tilt !== 0 ? <Arrow x={e.x} y={e.y + drop + 18} up={!e.down} /> : null}
        </g>
      ))}
      <line
        x1={ends[0]?.x}
        y1={ends[0]?.y}
        x2={ends[1]?.x}
        y2={ends[1]?.y}
        stroke="#8a6a4a"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <circle cx={px} cy={py} r={7} fill="#c48a12" />
    </>,
    'balance',
  );
}

/* ---------- The week ---------- */

const LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function WeekView({ v }: { v: Extract<Visual, { type: 'weekDays' }> }) {
  return (
    <div
      dir="rtl"
      data-visual="weekDays"
      aria-hidden="true"
      style={{ display: 'flex', gap: 4, width: '100%', maxWidth: 440, margin: '0 auto' }}
    >
      {NAMES.map((name, d) => {
        const on = v.mark === d;
        const tag = v.tags?.find((x) => x.day === d)?.text;
        return (
          <div
            key={d}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 0',
                borderRadius: 10,
                background: on ? 'var(--color-accent-soft)' : 'var(--color-surface-alt)',
                border: `${on ? 3 : 1.5}px solid ${on ? ACCENT : 'var(--color-border)'}`,
                color: INK,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.1 }}>{LETTERS[d]}</span>
              <span style={{ fontSize: 11, lineHeight: 1.2, color: MUTED }}>{name}</span>
            </div>
            {tag ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, whiteSpace: 'nowrap' }}>
                {tag}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
