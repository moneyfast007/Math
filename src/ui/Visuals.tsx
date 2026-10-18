import type { ClockTime, ShapeItem, Visual } from '@/engine/types';
import { t } from '@/i18n';
import { digitalTime } from '@/lang/time';

/** Renders an exercise or hint picture. Always left-to-right, like the arithmetic. */
export function VisualView({ visual }: { visual: Visual }) {
  switch (visual.type) {
    case 'objects':
      return <Objects v={visual} />;
    case 'numberLine':
      return <NumberLine v={visual} />;
    case 'fraction':
      return <Fraction v={visual} />;
    case 'array':
      return <ArrayDots v={visual} />;
    case 'rect':
      return <Rect v={visual} />;
    case 'placeValue':
      return <PlaceValue v={visual} />;
    case 'clock':
      return <Clocks v={visual} />;
    case 'money':
      return <Money v={visual} />;
    case 'shapes':
      return <Shapes v={visual} />;
    case 'pencils':
      return <Pencils v={visual} />;
  }
}

function rowsOfFive(n: number): number[] {
  const rows: number[] = [];
  for (let left = n; left > 0; left -= 5) rows.push(Math.min(5, left));
  return rows;
}

function Objects({ v }: { v: Extract<Visual, { type: 'objects' }> }) {
  const removed = v.removed ?? 0;
  return (
    <div className="objects" dir="ltr" aria-hidden="true" data-visual="objects">
      {v.groups.map((count, g) => {
        // Crossed-out items are the last ones of the first group.
        const isRemoved = (i: number) => g === 0 && i >= count - removed;
        const kind = v.kinds?.[g] ?? v.kind;
        const items = Array.from({ length: count }, (_, i) => (
          <span key={i} className={isRemoved(i) ? 'obj obj--removed' : 'obj'}>
            {kind.emoji}
          </span>
        ));
        return (
          <div
            key={g}
            className={v.arranged ? 'objects__group objects__group--arranged' : 'objects__group'}
          >
            {v.arranged
              ? rowsOfFive(count).map((len, r) => (
                  <div key={r} className="objects__row">
                    {items.slice(r * 5, r * 5 + len)}
                  </div>
                ))
              : items}
          </div>
        );
      })}
    </div>
  );
}

function NumberLine({ v }: { v: Extract<Visual, { type: 'numberLine' }> }) {
  const step = v.step ?? 1;
  const unit = 40;
  const pad = 24;
  const n = Math.round((v.to - v.from) / step);
  const width = n * unit + pad * 2;
  const x = (k: number) => pad + ((k - v.from) / step) * unit;
  const baseY = 70;
  const hops = Array.from({ length: Math.abs(v.hops) }, (_, i) => {
    const dir = Math.sign(v.hops);
    return { from: v.start + dir * i * step, to: v.start + dir * (i + 1) * step };
  });

  return (
    <div className="numberline" dir="ltr" data-visual="numberLine">
      <svg
        viewBox={`0 0 ${width} 100`}
        role="img"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        <line x1={pad - 10} y1={baseY} x2={width - pad + 10} y2={baseY} className="nl-axis" />
        {Array.from({ length: n + 1 }, (_, i) => v.from + i * step).map((k) => (
          <g key={k}>
            <line
              x1={x(k)}
              y1={baseY - 7}
              x2={x(k)}
              y2={baseY + 7}
              className={k === v.stopAt ? 'nl-tick nl-tick--stop' : 'nl-tick'}
            />
            <text
              x={x(k)}
              y={baseY + 26}
              textAnchor="middle"
              className={k === v.stopAt ? 'nl-label nl-label--stop' : 'nl-label'}
            >
              {k}
            </text>
          </g>
        ))}
        {hops.map((h, i) => {
          const x1 = x(h.from);
          const x2 = x(h.to);
          const mid = (x1 + x2) / 2;
          return (
            <path
              key={i}
              d={`M ${x1} ${baseY - 4} Q ${mid} ${baseY - 40} ${x2} ${baseY - 4}`}
              className="nl-hop"
            />
          );
        })}
        <circle cx={x(v.start)} cy={baseY} r={8} className="nl-start" />
        {v.target !== undefined ? (
          <circle cx={x(v.target)} cy={baseY} r={8} className="nl-target" />
        ) : null}
      </svg>
    </div>
  );
}

function Fraction({ v }: { v: Extract<Visual, { type: 'fraction' }> }) {
  if (v.shape === 'circle') {
    const r = 46;
    const cx = 50;
    const cy = 50;
    const slices = Array.from({ length: v.parts }, (_, i) => {
      const a0 = (i / v.parts) * 2 * Math.PI - Math.PI / 2;
      const a1 = ((i + 1) / v.parts) * 2 * Math.PI - Math.PI / 2;
      const large = v.parts === 1 ? 1 : 0;
      if (v.parts === 1)
        return `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 -${r * 2} 0`;
      return `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
    });
    return (
      <div className="fraction fraction--circle" dir="ltr" data-visual="fraction">
        <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
          {slices.map((d, i) => (
            <path
              key={i}
              d={d}
              className={i < v.shaded ? 'frac-cell frac-cell--on' : 'frac-cell'}
            />
          ))}
        </svg>
      </div>
    );
  }
  return (
    <div className="fraction fraction--bar" dir="ltr" data-visual="fraction" aria-hidden="true">
      {Array.from({ length: v.parts }, (_, i) => (
        <span key={i} className={i < v.shaded ? 'frac-cell frac-cell--on' : 'frac-cell'} />
      ))}
    </div>
  );
}

function ArrayDots({ v }: { v: Extract<Visual, { type: 'array' }> }) {
  return (
    <div
      className={v.squares ? 'dots dots--squares' : 'dots'}
      dir="ltr"
      data-visual="array"
      aria-hidden="true"
      style={{ gridTemplateColumns: `repeat(${v.cols}, auto)` }}
    >
      {Array.from({ length: v.rows * v.cols }, (_, i) => (
        <span key={i} className="dots__cell" />
      ))}
    </div>
  );
}

function Rect({ v }: { v: Extract<Visual, { type: 'rect' }> }) {
  const unit = v.unit ?? t('unit.cm');
  const scale = 160 / Math.max(v.width, v.height, 1);
  const w = Math.max(40, v.width * scale);
  const h = Math.max(40, v.height * scale);
  return (
    <div className="rect" dir="ltr" data-visual="rect">
      <svg viewBox={`0 0 ${w + 80} ${h + 60}`} role="img" aria-hidden="true">
        <rect x="40" y="20" width={w} height={h} className="rect__shape" />
        <text x={40 + w / 2} y={h + 50} textAnchor="middle" className="rect__label">
          {v.width} {unit}
        </text>
        <text
          x={w + 56}
          y={20 + h / 2}
          textAnchor="start"
          dominantBaseline="middle"
          className="rect__label"
        >
          {v.height} {unit}
        </text>
      </svg>
    </div>
  );
}

function PlaceValue({ v }: { v: Extract<Visual, { type: 'placeValue' }> }) {
  const digits = String(v.n).split('').map(Number);
  const names = [
    t('place.units'),
    t('place.tens'),
    t('place.hundreds'),
    t('place.thousands'),
    t('place.tenThousands'),
    t('place.hundredThousands'),
    t('place.millions'),
  ];
  return (
    <div className="place-value" dir="ltr" data-visual="placeValue" aria-hidden="true">
      {digits.map((d, i) => {
        const power = digits.length - 1 - i;
        return (
          <div key={i} className="place-value__col">
            <span className="place-value__digit">{d}</span>
            <span className="place-value__name">{names[power] ?? ''}</span>
            <span className="place-value__worth">{d * 10 ** power}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Clocks (world: שעון) ---------- */

const DIAL_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);

/** A point at `angle` degrees clockwise from 12, `r` from the centre of a 300 × 300 dial. */
function onDial(angle: number, r: number): { x: number; y: number } {
  const a = (angle * Math.PI) / 180;
  return { x: 150 + r * Math.sin(a), y: 150 - r * Math.cos(a) };
}

/** An analog clock face: every hour numbered, a short thick hour hand and a long orange minute hand. */
export function AnalogClock({ h, m }: ClockTime) {
  const hour = onDial(((h % 12) + m / 60) * 30, 68);
  const minute = onDial(m * 6, 86);
  return (
    <svg viewBox="0 0 300 300" className="clock__face" aria-hidden="true">
      <circle cx="150" cy="150" r="142" className="clock__rim" />
      <circle cx="150" cy="150" r="128" className="clock__dial" />
      {DIAL_NUMBERS.map((n) => {
        const p = onDial(n * 30, 108);
        return (
          <text
            key={n}
            x={p.x}
            y={p.y}
            className="clock__num"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {n}
          </text>
        );
      })}
      <line x1="150" y1="150" x2={hour.x} y2={hour.y} className="clock__hour" />
      <line x1="150" y1="150" x2={minute.x} y2={minute.y} className="clock__minute" />
      <circle cx="150" cy="150" r="9" className="clock__pin" />
    </svg>
  );
}

function Clocks({ v }: { v: Extract<Visual, { type: 'clock' }> }) {
  return (
    <div className="clocks" dir="ltr" data-visual="clock" aria-hidden="true">
      {v.times.map((time, i) => (
        <div key={i} className="clocks__item">
          {i > 0 ? <span className="clocks__arrow">→</span> : null}
          {v.digital ? (
            <span className="clock-digital">{digitalTime(time)}</span>
          ) : (
            <AnalogClock h={time.h} m={time.m} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Money (world: כסף) ---------- */

const NOTE_COLORS: Record<number, string> = {
  20: 'note--20',
  50: 'note--50',
  100: 'note--100',
  200: 'note--200',
};

/** One shekel coin or note, with its value written on it. Simple drawings, not the real designs. */
export function MoneyItem({ value }: { value: number }) {
  if (value >= 20) {
    return (
      <svg
        viewBox="0 0 96 52"
        className={`money__note ${NOTE_COLORS[value] ?? ''}`}
        aria-hidden="true"
      >
        <rect x="2" y="2" width="92" height="48" rx="8" className="note__paper" />
        <text x="48" y="27" textAnchor="middle" dominantBaseline="central" className="note__value">
          {value}
        </text>
      </svg>
    );
  }
  const size =
    value === 10 ? 'coin--10' : value === 5 ? 'coin--5' : value === 2 ? 'coin--2' : 'coin--1';
  return (
    <svg viewBox="0 0 60 60" className={`money__coin ${size}`} aria-hidden="true">
      {value === 5 ? (
        <polygon
          points="30,2 44,6 54,16 58,30 54,44 44,54 30,58 16,54 6,44 2,30 6,16 16,6"
          className="coin__metal"
        />
      ) : (
        <circle cx="30" cy="30" r="28" className="coin__metal" />
      )}
      {value === 10 ? <circle cx="30" cy="30" r="19" className="coin__gold" /> : null}
      <text
        x="30"
        y="31"
        textAnchor="middle"
        dominantBaseline="central"
        className={value === 10 ? 'coin__value coin__value--gold' : 'coin__value'}
      >
        {value}
      </text>
    </svg>
  );
}

function Money({ v }: { v: Extract<Visual, { type: 'money' }> }) {
  const items = [...v.items].sort((a, b) => b - a);
  return (
    <div className="money" dir="ltr" data-visual="money" aria-hidden="true">
      {v.price !== undefined ? <span className="money__price">{v.price} ₪</span> : null}
      {items.map((value, i) => (
        <MoneyItem key={i} value={value} />
      ))}
    </div>
  );
}

/* ---------- Shapes and pencils (world: צורות ודפוסים) ---------- */

/** One shape in a 100 × 100 box, scaled and turned about its centre. */
export function ShapeView({ item }: { item: ShapeItem }) {
  const k = item.size ?? 1;
  const transform = `rotate(${item.turn ?? 0} 50 50) translate(50 50) scale(${k}) translate(-50 -50)`;
  let body;
  switch (item.shape) {
    case 'circle':
      body = <circle cx="50" cy="50" r="40" />;
      break;
    case 'square':
      body = <rect x="12" y="12" width="76" height="76" rx="6" />;
      break;
    case 'rectangle':
      body = <rect x="4" y="27" width="92" height="46" rx="6" />;
      break;
    case 'triangle':
      body = <path d="M50 12 L90 84 L10 84 Z" strokeLinejoin="round" />;
      break;
  }
  return (
    <svg viewBox="0 0 100 100" className={`shape shape--${item.color}`} aria-hidden="true">
      <g transform={transform}>{body}</g>
    </svg>
  );
}

function Shapes({ v }: { v: Extract<Visual, { type: 'shapes' }> }) {
  return (
    <div className="shapes" dir="ltr" data-visual="shapes" aria-hidden="true">
      {v.items.map((item, i) =>
        item ? (
          <ShapeView key={i} item={item} />
        ) : (
          <span key={i} className="shapes__blank">
            ?
          </span>
        ),
      )}
    </div>
  );
}

const PENCIL_COLORS = ['#e2a33b', '#5b63d6', '#2f8f83', '#e8793a', '#c45f9e'];

/** Pencils standing on a line; each is drawn in a box of the longest possible height, so they line up. */
function Pencils({ v }: { v: Extract<Visual, { type: 'pencils' }> }) {
  return (
    <div className="pencils" dir="ltr" data-visual="pencils" aria-hidden="true">
      {v.lengths.map((len, i) => {
        const body = 20 + len * 28;
        const top = 200 - body - 30;
        return (
          <svg key={i} viewBox="0 0 40 200" className="pencil">
            <path d={`M20 ${top} L32 ${top + 30} L8 ${top + 30} Z`} fill="#f3d9b0" />
            <path d={`M20 ${top} L24 ${top + 10} L16 ${top + 10} Z`} fill="#3a2f2a" />
            <rect
              x="8"
              y={top + 30}
              width="24"
              height={body - 12}
              fill={PENCIL_COLORS[(len + i) % PENCIL_COLORS.length]}
            />
            <rect x="8" y={200 - 12} width="24" height="12" rx="3" fill="#e8793a" opacity="0.8" />
          </svg>
        );
      })}
    </div>
  );
}
