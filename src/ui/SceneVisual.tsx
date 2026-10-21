import type { CSSProperties, ReactNode } from 'react';
import type { SceneItem, SceneProp, ShapeColor, ShapeItem, Visual } from '@/engine/types';

/**
 * The little scenes of the gan worlds "מרחב ומיקום" and "מיון והשוואה": emoji
 * and flat shapes on a board, over simple props (a floor, a box, a table,
 * shelves, sorting hoops, paths, a train). Plain SVG in board units, always
 * left to right: screen right is the child's right. Self-contained: the colours
 * are the design tokens or fixed toy colours, the styles inline.
 */

type Scene = Extract<Visual, { type: 'scene' }>;

const INK = 'var(--color-text)';
const MUTED = 'var(--color-text-muted)';
const ACCENT = 'var(--color-accent-strong)';
const SOFT = 'var(--color-accent-soft)';
const WOOD = '#b07a45';
const WOOD_LIGHT = '#e0b979';
const SHAPE_FILL: Record<ShapeColor, string> = {
  red: '#e8604c',
  blue: '#5b63d6',
  yellow: '#f0b429',
  green: '#3f9e5a',
};
const PATH_TONES = ['#e8604c', '#5b63d6', '#3f9e5a'];
/** The gap between the two boards of a before-and-after scene. */
const GAP = 10;

/** A smooth curve through the points (Catmull–Rom as cubic Béziers). */
function smooth(points: [number, number][]): string {
  if (points.length < 2) return '';
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))] as [number, number];
  let d = `M${p(0)[0]} ${p(0)[1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = p(i - 1);
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    const [x3, y3] = p(i + 2);
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    d += ` C${c1[0]?.toFixed(1)} ${c1[1]?.toFixed(1)} ${c2[0]?.toFixed(1)} ${c2[1]?.toFixed(1)} ${x2} ${y2}`;
  }
  return d;
}

function Arrow({ from, to }: { from: [number, number]; to: [number, number] }) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = 4;
  const p = (da: number) =>
    `${(x2 - head * Math.cos(a + da)).toFixed(1)} ${(y2 - head * Math.sin(a + da)).toFixed(1)}`;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2 - 1.5 * Math.cos(a)}
        y2={y2 - 1.5 * Math.sin(a)}
        stroke={ACCENT}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <path d={`M${x2} ${y2} L${p(0.5)} L${p(-0.5)} Z`} fill={ACCENT} />
    </g>
  );
}

/** The engine, its front at x, and `cars` cars behind it; y is the top of the cars. */
function Train({ x, y, cars, car }: { x: number; y: number; cars: number; car: number }) {
  const wheel = (cx: number) => <circle key={cx} cx={cx} cy={y + 10.5} r={2.6} fill={INK} />;
  return (
    <g>
      {Array.from({ length: cars }, (_, k) => {
        const right = x - 22 - k * car;
        const left = right - car + 1.5;
        return (
          <g key={k}>
            <line
              x1={right}
              y1={y + 6}
              x2={right + 1.5}
              y2={y + 6}
              stroke={INK}
              strokeWidth={1.2}
            />
            <rect x={left} y={y} width={car - 1.5} height={8.5} rx={1.5} fill="#f0b429" />
            {wheel(left + 3.5)}
            {wheel(right - 3.5)}
          </g>
        );
      })}
      {/* The engine: the cab at the back, the boiler and the chimney in front. */}
      <rect x={x - 21} y={y - 7} width={9} height={15.5} rx={1.5} fill="#5b63d6" />
      <rect x={x - 19.5} y={y - 5} width={6} height={4.5} rx={1} fill="var(--color-surface)" />
      <rect x={x - 13} y={y - 1} width={12.5} height={9.5} rx={3} fill="#e8604c" />
      <rect x={x - 6} y={y - 6.5} width={3.4} height={6} fill={INK} />
      {wheel(x - 17)}
      {wheel(x - 5)}
    </g>
  );
}

function Prop({ p, w }: { p: SceneProp; w: number }) {
  switch (p.kind) {
    case 'floor':
      return <line x1={0} y1={p.y} x2={w} y2={p.y} stroke={MUTED} strokeWidth={1.2} />;
    case 'box':
      return (
        <g>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={WOOD_LIGHT} opacity={0.45} />
          <path
            d={`M${p.x} ${p.y} L${p.x} ${p.y + p.h} L${p.x + p.w} ${p.y + p.h} L${p.x + p.w} ${p.y}`}
            fill="none"
            stroke={WOOD}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    case 'table':
      return (
        <g fill={WOOD}>
          <rect x={p.x} y={p.y - 1.5} width={p.w} height={3} rx={1} />
          <rect x={p.x + 2} y={p.y} width={2.2} height={p.h} />
          <rect x={p.x + p.w - 4.2} y={p.y} width={2.2} height={p.h} />
        </g>
      );
    case 'shelves':
      return (
        <g>
          <rect
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            fill={WOOD_LIGHT}
            fillOpacity={0.3}
            stroke={WOOD}
            strokeWidth={1.6}
          />
          {Array.from({ length: p.n }, (_, k) => {
            const y = p.y + (p.h * (k + 1)) / p.n;
            return (
              <line key={k} x1={p.x} y1={y} x2={p.x + p.w} y2={y} stroke={WOOD} strokeWidth={2.6} />
            );
          })}
        </g>
      );
    case 'hoop':
      return (
        <ellipse
          cx={p.x}
          cy={p.y}
          rx={p.w / 2}
          ry={p.h / 2}
          fill={SOFT}
          fillOpacity={0.55}
          stroke={ACCENT}
          strokeWidth={1.6}
        />
      );
    case 'path':
      return (
        <path
          d={smooth(p.points)}
          fill="none"
          stroke={PATH_TONES[p.tone % PATH_TONES.length]}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'arrow':
      return <Arrow from={p.from} to={p.to} />;
    case 'line':
      return (
        <line
          x1={p.from[0]}
          y1={p.from[1]}
          x2={p.to[0]}
          y2={p.to[1]}
          stroke={ACCENT}
          strokeWidth={1.3}
          strokeDasharray="2 1.6"
        />
      );
    case 'train':
      return <Train x={p.x} y={p.y} cars={p.cars} car={p.car} />;
    case 'label':
      return (
        <text
          x={p.x}
          y={p.y}
          fontSize={6.5}
          fontWeight={800}
          fill={ACCENT}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {p.text}
        </text>
      );
  }
}

/** A flat shape in a box of `s` units centred on x, y (as the shapes world draws it, in 100 × 100). */
function Shape({ item, x, y, s }: { item: ShapeItem; x: number; y: number; s: number }) {
  const k = item.size ?? 1;
  let body: ReactNode;
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
      body = <path d="M50 12 L90 84 L10 84 Z" strokeWidth={6} strokeLinejoin="round" />;
      break;
  }
  const fill = SHAPE_FILL[item.color];
  return (
    <g
      transform={`translate(${x - s / 2} ${y - s / 2}) scale(${s / 100})`}
      fill={fill}
      stroke={fill}
    >
      <g
        transform={`rotate(${item.turn ?? 0} 50 50) translate(50 50) scale(${k}) translate(-50 -50)`}
      >
        {body}
      </g>
    </g>
  );
}

function Item({ it }: { it: SceneItem }) {
  const s = it.size ?? 16;
  return (
    <g>
      {it.ring ? (
        <circle cx={it.x} cy={it.y} r={s * 0.66} fill="none" stroke={ACCENT} strokeWidth={1.5} />
      ) : null}
      {it.blank ? (
        <g>
          <rect
            x={it.x - s / 2}
            y={it.y - s / 2}
            width={s}
            height={s}
            rx={2}
            fill="none"
            stroke={ACCENT}
            strokeWidth={1.3}
            strokeDasharray="2.2 1.6"
          />
          <text
            x={it.x}
            y={it.y}
            fontSize={s * 0.7}
            fontWeight={800}
            fill={ACCENT}
            textAnchor="middle"
            dominantBaseline="central"
          >
            ?
          </text>
        </g>
      ) : null}
      {it.shape ? <Shape item={it.shape} x={it.x} y={it.y} s={s} /> : null}
      {it.emoji ? (
        <text x={it.x} y={it.y} fontSize={s} textAnchor="middle" dominantBaseline="central">
          {it.emoji}
        </text>
      ) : null}
      {it.text ? (
        <text
          x={it.x}
          y={it.y}
          fontSize={s}
          fontWeight={800}
          fill={INK}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {it.text}
        </text>
      ) : null}
    </g>
  );
}

function Board({ v, items }: { v: Scene; items: SceneItem[] }) {
  return (
    <>
      {(v.props ?? []).map((p, i) => (
        <Prop key={i} p={p} w={v.w} />
      ))}
      {items.map((it, i) => (
        <Item key={i} it={it} />
      ))}
    </>
  );
}

export function SceneView({ v }: { v: Scene }) {
  const height = v.then ? v.h * 2 + GAP : v.h;
  // A button's picture stays small; a scene in the question is as wide as the phone allows.
  const css = v.icon ? Math.min(120, v.w * 5.5) : Math.min(560, v.w * 3.6);
  const style: CSSProperties = {
    width: `min(100%, ${css}px)`,
    height: 'auto',
    display: 'block',
    overflow: 'visible',
  };
  return (
    <div
      dir="ltr"
      data-visual="scene"
      aria-hidden="true"
      style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
    >
      <svg viewBox={`0 0 ${v.w} ${height}`} style={style}>
        {v.then ? (
          <>
            {/* Before above, after below, an arrow between: no right or left to read. */}
            <rect
              width={v.w}
              height={v.h}
              rx={3}
              fill="var(--color-surface)"
              stroke="var(--color-border)"
            />
            <Board v={v} items={v.items} />
            <Arrow from={[v.w / 2, v.h + 2]} to={[v.w / 2, v.h + GAP - 2]} />
            <g transform={`translate(0 ${v.h + GAP})`}>
              <rect
                width={v.w}
                height={v.h}
                rx={3}
                fill="var(--color-surface)"
                stroke="var(--color-border)"
              />
              <Board v={v} items={v.then} />
            </g>
          </>
        ) : (
          <Board v={v} items={v.items} />
        )}
      </svg>
    </div>
  );
}
