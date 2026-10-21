import { useId, type ReactNode } from 'react';
import type { ShapeKind, SolidItem, Visual } from '@/engine/types';
import './solids.css';

/**
 * Solids (world "גופים", grade 1): a cube, a box, a ball, a cylinder, a cone and
 * a pyramid, drawn in a friendly 3D: a lit top, a front in the solid's colour, a
 * shaded side, a soft shadow on the ground. Round solids are shaded with a
 * gradient. A flat shape among them (a square beside a cube) is drawn flat, with
 * no shade and no shadow, as on paper. Every item sits in a 100 × 100 box (y down).
 */

type P = [number, number];
const pts = (ps: P[]) => ps.map(([x, y]) => `${x},${y}`).join(' ');
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];

const FLAT: readonly string[] = ['circle', 'square', 'triangle', 'rectangle'];

/** How far up the next item of a stack sits (the height of the front). */
const RISE: Partial<Record<SolidItem['kind'], number>> = { cube: 52, box: 38, cylinder: 60 };

function faceClass(item: SolidItem, face: SolidItem['mark'], tone: 'front' | 'top' | 'side') {
  return item.mark === face ? 'solid__face solid__mark' : `solid__face solid__${tone}`;
}

/** A cube or a box: a front rectangle pushed back by `d`; the hidden corner is `a + d`. */
function Prism({ item, a, w, h, d }: { item: SolidItem; a: P; w: number; h: number; d: P }) {
  const b: P = [a[0] + w, a[1]];
  const c: P = [a[0] + w, a[1] - h];
  const e: P = [a[0], a[1] - h];
  const hidden = add(a, d);
  return (
    <>
      <ellipse
        cx={a[0] + (w + d[0]) / 2}
        cy={a[1] - 2}
        rx={(w + d[0]) / 2 + 4}
        ry={-d[1] / 2 + 4}
        className="solid__shadow"
      />
      <polygon
        points={pts([e, c, add(c, d), add(e, d)])}
        className={faceClass(item, 'top', 'top')}
      />
      <polygon
        points={pts([b, add(b, d), add(c, d), c])}
        className={faceClass(item, 'side', 'side')}
      />
      <polygon points={pts([a, b, c, e])} className={faceClass(item, 'front', 'front')} />
      {item.seeThrough ? (
        <g className="solid__hidden">
          <line x1={hidden[0]} y1={hidden[1]} x2={a[0]} y2={a[1]} />
          <line x1={hidden[0]} y1={hidden[1]} x2={b[0] + d[0]} y2={b[1] + d[1]} />
          <line x1={hidden[0]} y1={hidden[1]} x2={e[0] + d[0]} y2={e[1] + d[1]} />
          <Corner p={hidden} />
        </g>
      ) : null}
    </>
  );
}

/** A dot on a hidden vertex, so it can be counted. */
function Corner({ p }: { p: P }) {
  return <circle cx={p[0]} cy={p[1]} r="2.6" className="solid__corner" />;
}

function Pyramid({ item }: { item: SolidItem }) {
  const t: P = [50, 12];
  const p1: P = [12, 86];
  const p2: P = [68, 86];
  const p3: P = [88, 70];
  const p4: P = [32, 70];
  return (
    <>
      <ellipse cx="50" cy="80" rx="44" ry="11" className="solid__shadow" />
      {item.mark === 'base' ? (
        <polygon points={pts([p1, p2, p3, p4])} className="solid__face solid__mark" />
      ) : null}
      <polygon points={pts([t, p2, p3])} className={faceClass(item, 'side', 'side')} />
      <polygon points={pts([t, p1, p2])} className={faceClass(item, 'front', 'front')} />
      {item.seeThrough ? (
        <g className="solid__hidden">
          <line x1={p4[0]} y1={p4[1]} x2={p1[0]} y2={p1[1]} />
          <line x1={p4[0]} y1={p4[1]} x2={p3[0]} y2={p3[1]} />
          <line x1={p4[0]} y1={p4[1]} x2={t[0]} y2={t[1]} />
          <Corner p={p4} />
        </g>
      ) : null}
    </>
  );
}

/** A pyramid on a triangle: two faces in front, the third face and the base behind. */
function Pyramid3({ item }: { item: SolidItem }) {
  const t: P = [46, 12];
  const q1: P = [10, 86];
  const q2: P = [64, 88];
  const q3: P = [90, 68];
  return (
    <>
      <ellipse cx="50" cy="80" rx="44" ry="11" className="solid__shadow" />
      <polygon points={pts([t, q2, q3])} className={faceClass(item, 'side', 'side')} />
      <polygon points={pts([t, q1, q2])} className={faceClass(item, 'front', 'front')} />
      {item.seeThrough ? (
        <g className="solid__hidden">
          <line x1={q1[0]} y1={q1[1]} x2={q3[0]} y2={q3[1]} />
        </g>
      ) : null}
    </>
  );
}

/** A left-to-right gradient for a round body: lit on the left, in shade on the right. */
function Gradient({ id, vertical = false }: { id: string; vertical?: boolean }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
      <stop offset="0" className="solid__g-mid" />
      <stop offset="0.28" className="solid__g-light" />
      <stop offset="1" className="solid__g-dark" />
    </linearGradient>
  );
}

function Sphere({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={id} cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" className="solid__g-light" />
          <stop offset="0.45" className="solid__g-mid" />
          <stop offset="1" className="solid__g-dark" />
        </radialGradient>
      </defs>
      <ellipse cx="52" cy="89" rx="30" ry="6" className="solid__shadow" />
      <circle cx="50" cy="50" r="38" fill={`url(#${id})`} className="solid__round" />
      <path d="M12 50 A38 12 0 0 0 88 50" className="solid__line" />
      <ellipse
        cx="36"
        cy="33"
        rx="9"
        ry="5.5"
        transform="rotate(-35 36 33)"
        className="solid__shine"
      />
    </>
  );
}

function Cylinder({ item, id }: { item: SolidItem; id: string }) {
  if (item.lying) {
    return (
      <>
        <defs>
          <Gradient id={id} vertical />
        </defs>
        <ellipse cx="50" cy="80" rx="42" ry="6" className="solid__shadow" />
        <path
          d="M20 26 H80 V78 H20 A9 26 0 0 1 20 26 Z"
          fill={`url(#${id})`}
          className="solid__round"
        />
        <ellipse cx="80" cy="52" rx="9" ry="26" className={faceClass(item, 'top', 'top')} />
      </>
    );
  }
  return (
    <>
      <defs>
        <Gradient id={id} />
      </defs>
      <ellipse cx="53" cy="82" rx="36" ry="9" className="solid__shadow" />
      {item.seeThrough ? <path d="M22 80 A28 9 0 0 1 78 80" className="solid__hidden" /> : null}
      <path d="M22 20 V80 A28 9 0 0 0 78 80 V20 Z" fill={`url(#${id})`} className="solid__round" />
      <ellipse cx="50" cy="20" rx="28" ry="9" className={faceClass(item, 'top', 'top')} />
    </>
  );
}

function Cone({ item, id }: { item: SolidItem; id: string }) {
  return (
    <>
      <defs>
        <Gradient id={id} />
      </defs>
      <ellipse cx="53" cy="82" rx="40" ry="10" className="solid__shadow" />
      <path
        d="M18 80 L50 10 L82 80 A32 10 0 0 1 18 80 Z"
        fill={`url(#${id})`}
        className="solid__round"
      />
      {item.mark === 'base' ? (
        <ellipse cx="50" cy="80" rx="32" ry="10" className="solid__face solid__mark" />
      ) : item.seeThrough ? (
        <path d="M18 80 A32 10 0 0 1 82 80" className="solid__hidden" />
      ) : null}
    </>
  );
}

function Flat({ kind }: { kind: ShapeKind }) {
  switch (kind) {
    case 'circle':
      return <circle cx="50" cy="50" r="38" className="solid__flat" />;
    case 'square':
      return <rect x="15" y="15" width="70" height="70" rx="3" className="solid__flat" />;
    case 'rectangle':
      return <rect x="4" y="28" width="92" height="44" rx="3" className="solid__flat" />;
    case 'triangle':
      return <path d="M50 14 L90 84 L10 84 Z" className="solid__flat" />;
  }
}

function Body({ item, id }: { item: SolidItem; id: string }): ReactNode {
  switch (item.kind) {
    case 'cube':
      return <Prism item={item} a={[16, 88]} w={52} h={52} d={[18, -14]} />;
    case 'box':
      return <Prism item={item} a={[6, 80]} w={70} h={38} d={[18, -14]} />;
    case 'pyramid':
      return <Pyramid item={item} />;
    case 'pyramid3':
      return <Pyramid3 item={item} />;
    case 'sphere':
      return <Sphere id={id} />;
    case 'cylinder':
      return <Cylinder item={item} id={id} />;
    case 'cone':
      return <Cone item={item} id={id} />;
    default:
      return <Flat kind={item.kind} />;
  }
}

/** One solid (or flat shape) in its own 100 × 100 picture. */
export function SolidView({ item }: { item: SolidItem }) {
  const id = useId().replace(/:/g, '');
  const flat = FLAT.includes(item.kind);
  return (
    <svg
      viewBox="0 0 100 100"
      className={`solid solid--${item.color}${flat ? ' solid--flat' : ''}`}
      aria-hidden="true"
    >
      <Body item={item} id={`sg${id}`} />
    </svg>
  );
}

/** Solids one on top of the other: each sits on the top face of the one below. */
function Stack({ items }: { items: SolidItem[] }) {
  const id = useId().replace(/:/g, '');
  const rises = items.map((it) => RISE[it.kind] ?? 50);
  const height = 100 + rises.slice(0, -1).reduce((s, r) => s + r, 0);
  let y = height - 100;
  return (
    <svg viewBox={`0 0 100 ${height}`} className="solid solid--stack" aria-hidden="true">
      {items.map((it, i) => {
        const at = y;
        y -= rises[i] ?? 50;
        return (
          <g
            key={i}
            transform={`translate(0 ${at})`}
            // Only the bottom one casts a shadow on the ground.
            className={i > 0 ? `solid--${it.color} solid--upper` : `solid--${it.color}`}
          >
            <Body item={it} id={`sg${id}-${i}`} />
          </g>
        );
      })}
    </svg>
  );
}

export function SolidsView({ v }: { v: Extract<Visual, { type: 'solids' }> }) {
  return (
    // Read from the right, like the shapes: the first item is on the right.
    <div className="solids" dir="rtl" data-visual="solids" aria-hidden="true">
      {v.stacked ? (
        <Stack items={v.items} />
      ) : (
        v.items.map((item, i) => <SolidView key={i} item={item} />)
      )}
    </div>
  );
}

const STACK_COLORS = ['blue', 'green', 'red', 'yellow'] as const;

/** Unit cubes in columns, one deep; each column in its own colour, to count column by column. */
export function CubeStackView({ v }: { v: Extract<Visual, { type: 'cubeStack' }> }) {
  const s = 22;
  const d: P = [9, -7];
  const top = Math.max(1, ...v.columns);
  const width = v.columns.length * s + d[0] + 8;
  const base = 4 - d[1] + top * s;
  const height = base + 8;
  const cubes: ReactNode[] = [];
  v.columns.forEach((h, i) => {
    const color = STACK_COLORS[i % STACK_COLORS.length] ?? 'blue';
    for (let j = 0; j < h; j++) {
      const a: P = [4 + i * s, base - j * s];
      const b: P = [a[0] + s, a[1]];
      const c: P = [a[0] + s, a[1] - s];
      const e: P = [a[0], a[1] - s];
      cubes.push(
        <g key={`${i}-${j}`} className={`solid--${color}`}>
          <polygon points={pts([e, c, add(c, d), add(e, d)])} className="solid__face solid__top" />
          <polygon points={pts([b, add(b, d), add(c, d), c])} className="solid__face solid__side" />
          <polygon points={pts([a, b, c, e])} className="solid__face solid__front" />
        </g>,
      );
    }
  });
  return (
    <div className="solids" dir="ltr" data-visual="cubeStack" aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} className="cube-stack">
        <ellipse cx={width / 2} cy={base} rx={width / 2} ry="5" className="solid__shadow" />
        {cubes}
      </svg>
    </div>
  );
}

export function ThingView({ v }: { v: Extract<Visual, { type: 'thing' }> }) {
  return (
    <div className="solids" data-visual="thing" aria-hidden="true">
      <span className="thing">{v.emoji}</span>
    </div>
  );
}
