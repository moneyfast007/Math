import type { CSSProperties } from 'react';

/**
 * The scenes of the fifth world (SceneStrip.tsx has the engine):
 *
 * - The train (gan to grade 2): every exercise adds a wagon to טוטו's train,
 *   with an animal in it for a right answer. The end: he toots and drives off.
 * - The mountain (grades 3 to 6): צוקי climbs to the next stop on the trail,
 *   100 metres higher. The end: the summit, a flag and fireworks.
 */

export interface Size {
  w: number;
  h: number;
}

const ANIMALS = [
  '#f2789f',
  '#ffb547',
  '#5bb8f0',
  '#9b7bea',
  '#7cc47f',
  '#ff7a59',
  '#f05b8b',
  '#ffd45c',
  '#4fb3a6',
  '#c99260',
];

/* ---------- The train ---------- */

export interface TrainLayout {
  ground: number;
  engine: number;
  ex: number;
  wagon: number;
  wy: number;
}

export function trainLayout({ w, h }: Size, total: number): TrainLayout {
  const ground = h - 14;
  const engine = Math.min(54, h * 0.4);
  const ex = 12;
  const wagon = Math.max(12, Math.min(30, (w - ex - engine - 14) / Math.max(total, 1)));
  return { ground, engine, ex, wagon, wy: ground - wagon * 0.8 };
}

export function Train({
  size,
  layout,
  total,
  marks,
  shown,
  reacting,
}: {
  size: Size;
  layout: TrainLayout;
  total: number;
  marks: readonly boolean[];
  shown: number;
  reacting: number;
}) {
  const { w, h } = size;
  const { ground, engine, ex, wagon, wy } = layout;
  const ties: number[] = [];
  for (let x = 4; x < w; x += 12) ties.push(x);
  return (
    <svg
      className="scene-strip__art"
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      style={{ '--scene-w': `${w}px` } as CSSProperties}
    >
      <path
        className="train__hill"
        d={`M0 ${ground}Q${w * 0.25} ${ground - h * 0.27} ${w * 0.5} ${ground}T${w} ${ground - 10}V${h}H0z`}
      />
      {ties.map((x) => (
        <line key={x} className="train__tie" x1={x} y1={ground + 2} x2={x + 6} y2={ground + 6} />
      ))}
      <line className="train__track" x1="0" y1={ground + 2} x2={w} y2={ground + 2} />
      <g className="train__all">
        {Array.from({ length: 3 }, (_, k) => (
          <circle
            key={k}
            className="train__puff"
            cx={ex + engine * 0.62}
            cy={ground - engine * 0.95}
            r="5"
            style={{ animationDelay: `${k * 0.35}s` }}
          />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const x = ex + engine + 2 + i * wagon;
          const color = ANIMALS[i % ANIMALS.length] ?? '#f2789f';
          const here = i < shown;
          const rider = here && marks[i] === true;
          return (
            <g
              key={i}
              className={here ? 'train__wagon train__wagon--in' : 'train__wagon'}
              style={{ transform: here ? 'none' : `translateX(${w}px)` }}
            >
              <rect
                x={x}
                y={wy}
                width={wagon - 3}
                height={wagon * 0.6}
                rx="3"
                className="train__car"
              />
              {rider ? (
                <g>
                  <circle
                    cx={x + wagon * 0.45}
                    cy={wy - wagon * 0.12}
                    r={wagon * 0.24}
                    fill={color}
                  />
                  <circle
                    cx={x + wagon * 0.3}
                    cy={wy - wagon * 0.32}
                    r={wagon * 0.09}
                    fill={color}
                  />
                  <circle
                    cx={x + wagon * 0.6}
                    cy={wy - wagon * 0.32}
                    r={wagon * 0.09}
                    fill={color}
                  />
                  <circle cx={x + wagon * 0.38} cy={wy - wagon * 0.14} r="1.4" fill="#2b2320" />
                  <circle cx={x + wagon * 0.52} cy={wy - wagon * 0.14} r="1.4" fill="#2b2320" />
                </g>
              ) : null}
              <circle cx={x + wagon * 0.2} cy={wy + wagon * 0.62} r={wagon * 0.13} fill="#2b2f5c" />
              <circle
                cx={x + wagon * 0.75}
                cy={wy + wagon * 0.62}
                r={wagon * 0.13}
                fill="#2b2f5c"
              />
            </g>
          );
        })}
        <g
          key={reacting}
          className={reacting > 0 ? 'train__engine train__engine--sad' : 'train__engine'}
          transform={`translate(${ex} ${ground - engine}) scale(${engine / 100})`}
        >
          <TotoShapes />
        </g>
      </g>
    </svg>
  );
}

function TotoShapes() {
  return (
    <>
      <rect x="58" y="14" width="16" height="22" rx="4" fill="#2b2f5c" />
      <rect
        x="12"
        y="34"
        width="70"
        height="40"
        rx="10"
        fill="#e24b4b"
        stroke="#8a2222"
        strokeWidth="3"
      />
      <rect
        x="52"
        y="20"
        width="34"
        height="32"
        rx="6"
        fill="#e24b4b"
        stroke="#8a2222"
        strokeWidth="3"
      />
      <rect x="58" y="26" width="22" height="16" rx="4" fill="#cfe7ff" />
      <circle cx="28" cy="52" r="6" fill="#fff" />
      <circle cx="46" cy="52" r="6" fill="#fff" />
      <circle cx="29" cy="53" r="3" fill="#2b2320" />
      <circle cx="47" cy="53" r="3" fill="#2b2320" />
      <path
        d="M30 63q7 5 14 0"
        stroke="#2b2320"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="26" cy="80" r="9" fill="#2b2f5c" />
      <circle cx="66" cy="80" r="9" fill="#2b2f5c" />
      <circle cx="26" cy="80" r="3" fill="#ffd45c" />
      <circle cx="66" cy="80" r="3" fill="#ffd45c" />
    </>
  );
}

/** טוטו: the little engine. */
export function TotoArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <TotoShapes />
    </svg>
  );
}

/* ---------- The mountain ---------- */

export interface MountainLayout {
  base: number;
  top: { x: number; y: number };
  stops: { x: number; y: number }[];
  climber: number;
}

export function mountainLayout({ w, h }: Size, total: number): MountainLayout {
  const base = h - 6;
  const top = { x: w * 0.2, y: Math.max(16, h * 0.15) };
  const n = Math.max(total, 1);
  const stops = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const zig = (i % 2 ? 1 : -1) * 12 * (1 - t);
    return {
      x: w * 0.8 - (w * 0.8 - top.x) * t + zig,
      y: base - 12 - (base - 12 - top.y - 6) * t,
    };
  });
  return { base, top, stops, climber: Math.max(18, Math.min(30, h * 0.22)) };
}

export function Mountain({
  size,
  layout,
  marks,
  shown,
  reacting,
}: {
  size: Size;
  layout: MountainLayout;
  marks: readonly boolean[];
  shown: number;
  reacting: number;
}) {
  const { w, h } = size;
  const { base, top, stops, climber } = layout;
  const at = stops[Math.min(shown, stops.length - 1)] ?? top;
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} className="sky-star" cx={(i * 37) % w} cy={4 + ((i * 13) % 40)} r="1.2" />
        ))}
        <path
          className="mountain__rock"
          d={`M${w * 0.02} ${base}L${top.x} ${top.y}L${w * 0.98} ${base}z`}
        />
        <path
          className="mountain__snow"
          d={`M${top.x - 16} ${top.y + 22}L${top.x} ${top.y}L${top.x + 22} ${top.y + 24}l-8 -4l-6 6l-6 -6z`}
        />
        <path className="mountain__trail" d={`M${stops.map((p) => `${p.x} ${p.y}`).join('L')}`} />
        {stops.slice(1).map((p, i) => (
          <circle
            key={i}
            className={
              i < shown && marks[i] === true
                ? 'mountain__stop mountain__stop--on'
                : 'mountain__stop'
            }
            cx={p.x}
            cy={p.y}
            r="3"
          />
        ))}
        <g className="mountain__flag">
          <line x1={top.x} y1={top.y} x2={top.x} y2={top.y - 16} stroke="#eef1fb" strokeWidth="2" />
          <path d={`M${top.x} ${top.y - 16}l14 4l-14 4z`} fill="#ff9a3c" />
        </g>
        <g
          className="mountain__climber"
          style={{ transform: `translate(${at.x - climber / 2}px, ${at.y - climber}px)` }}
        >
          <g transform={`scale(${climber / 100})`}>
            <TzukiShapes />
          </g>
        </g>
      </svg>
      <span
        key={reacting}
        className={reacting > 0 ? 'mountain__alt mountain__alt--warn' : 'mountain__alt'}
      >
        {`${shown * 100} מ׳`}
      </span>
    </>
  );
}

function TzukiShapes() {
  return (
    <>
      <path d="M22 50a28 26 0 0 1 56 0z" fill="#ffb547" stroke="#20232f" strokeWidth="3" />
      <rect x="18" y="48" width="64" height="8" rx="4" fill="#20232f" />
      <circle cx="50" cy="66" r="18" fill="#f0d3ad" stroke="#20232f" strokeWidth="3" />
      <rect
        x="34"
        y="58"
        width="32"
        height="10"
        rx="5"
        fill="#34e0d0"
        stroke="#20232f"
        strokeWidth="2.5"
      />
      <path
        d="M43 76q7 4 14 0"
        stroke="#20232f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <rect
        x="70"
        y="60"
        width="14"
        height="24"
        rx="4"
        fill="#3f9a4a"
        stroke="#20232f"
        strokeWidth="2.5"
      />
    </>
  );
}

/** צוקי: the climber. */
export function TzukiArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <TzukiShapes />
    </svg>
  );
}
