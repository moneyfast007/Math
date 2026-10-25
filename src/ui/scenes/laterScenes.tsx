import type { CSSProperties } from 'react';

/**
 * The scenes of the sixth to eighth worlds (SceneStrip.tsx has the engine).
 *
 * Gan to grade 2:
 * - The snowman (6): כפתורי is built part by part. The end: snow falls, he waves.
 * - The rainbow (7): ענני paints the rainbow a little further. The end: the sun.
 * - The cake (8): a candle lights for every right answer. The end: confetti.
 *
 * Grades 3 to 6:
 * - The tower (6): a crane adds a floor for every exercise, its windows lit for
 *   a right answer. The end: the beacon on top and the searchlights.
 * - The stars (7): a line joins the next two stars of a constellation. The end:
 *   the constellation shines.
 * - The dragon egg (8): a glowing crack for every right answer. The end: the
 *   egg hatches and דרקי comes out.
 *
 * Built step by step like the robot: ten parts whatever the round's length.
 */

export interface Size {
  w: number;
  h: number;
}

export const PARTS = 10;

/** Parts built after `lit` right answers in a round of `total`: all ten when every answer was right. */
export function built(lit: number, total: number): number {
  return total <= 0 ? 0 : Math.min(PARTS, Math.round((lit * PARTS) / total));
}

const cls = (...names: (string | false)[]) => names.filter(Boolean).join(' ');

/* ---------- The snowman ---------- */

export function Snowman({
  size,
  parts,
  flashing,
  reacting,
}: {
  size: Size;
  parts: number;
  flashing: number | null;
  reacting: number;
}) {
  const { w, h } = size;
  const ground = h - 10;
  const u = Math.min((h - 14) / 120, 1.1);
  const cx = w * 0.5;
  const r1 = 22 * u;
  const r2 = 16 * u;
  const r3 = 12 * u;
  const y1 = ground - r1;
  const y2 = y1 - r1 - r2 + 4 * u;
  const y3 = y2 - r2 - r3 + 3 * u;
  const part = (i: number, extra = '') =>
    cls(
      'snow__part',
      i < parts && 'snow__part--on',
      flashing === i && i < parts && 'snow__part--pop',
      extra,
    );
  return (
    <svg className="scene-strip__art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => (
        <circle
          key={i}
          className="snow__flake"
          cx={(((i * 37) % 100) / 100) * w}
          cy={((i * 23) % 80) * (h / 100)}
          r={1 + (i % 3) * 0.6}
          style={{ animationDelay: `${(i % 6) * 0.3}s` }}
        />
      ))}
      <path
        className="snow__ground"
        d={`M0 ${ground}Q${w * 0.5} ${ground - 8} ${w} ${ground}V${h}H0z`}
      />
      <g key={reacting} className={reacting > 0 ? 'snow__man snow__man--sad' : 'snow__man'}>
        <circle className={part(0, 'snow__ball')} cx={cx} cy={y1} r={r1} />
        <circle className={part(1, 'snow__ball')} cx={cx} cy={y2} r={r2} />
        <circle className={part(2, 'snow__ball')} cx={cx} cy={y3} r={r3} />
        <g className={part(3)}>
          <circle cx={cx - r3 * 0.38} cy={y3 - r3 * 0.2} r={1.6 * u} fill="#2b2320" />
          <circle cx={cx + r3 * 0.38} cy={y3 - r3 * 0.2} r={1.6 * u} fill="#2b2320" />
        </g>
        <path
          className={part(4)}
          d={`M${cx} ${y3}l${-9 * u} ${2 * u}l${9 * u} ${2 * u}z`}
          fill="#ff9a3c"
        />
        <path
          className={part(5)}
          d={`M${cx - r3 * 0.4} ${y3 + r3 * 0.45}q${r3 * 0.4} ${r3 * 0.3} ${r3 * 0.8} 0`}
          stroke="#2b2320"
          strokeWidth={1.5 * u}
          fill="none"
          strokeLinecap="round"
        />
        <path
          className={part(6)}
          d={`M${cx - r2 * 0.9} ${y2 - r2 * 0.75}h${r2 * 1.8}v${4 * u}h${-r2 * 1.8}zM${cx + r2 * 0.4} ${y2 - r2 * 0.6}v${12 * u}h${4 * u}v${-12 * u}z`}
          fill="#e24b4b"
        />
        <path
          className={part(7)}
          d={`M${cx - r3 * 0.9} ${y3 - r3 * 0.75}h${r3 * 1.8}v${3 * u}h${-r3 * 1.8}zM${cx - r3 * 0.6} ${y3 - r3 * 0.75}v${-11 * u}h${r3 * 1.2}v${11 * u}z`}
          fill="#2b2f5c"
        />
        <path
          className={part(8, 'snow__arm')}
          d={`M${cx - r2 * 0.9} ${y2}l${-14 * u} ${-8 * u}m${4 * u} ${2 * u}l${-2 * u} ${-5 * u}`}
          stroke="#8a5a32"
          strokeWidth={2 * u}
          fill="none"
          strokeLinecap="round"
        />
        <path
          className={part(9, 'snow__arm snow__arm--wave')}
          d={`M${cx + r2 * 0.9} ${y2}l${14 * u} ${-8 * u}m${-4 * u} ${2 * u}l${2 * u} ${-5 * u}`}
          stroke="#8a5a32"
          strokeWidth={2 * u}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/** כפתורי: the snowman. */
export function KaftoriArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="72" r="22" fill="#fff" stroke="#9fb6d6" strokeWidth="3" />
      <circle cx="50" cy="38" r="16" fill="#fff" stroke="#9fb6d6" strokeWidth="3" />
      <rect x="34" y="18" width="32" height="5" fill="#2b2f5c" />
      <rect x="39" y="4" width="22" height="16" fill="#2b2f5c" />
      <circle cx="44" cy="36" r="2.5" fill="#2b2320" />
      <circle cx="56" cy="36" r="2.5" fill="#2b2320" />
      <path d="M50 40l-10 3l10 3z" fill="#ff9a3c" />
      <rect x="34" y="52" width="32" height="6" rx="3" fill="#e24b4b" />
      <circle cx="50" cy="68" r="2.5" fill="#2b2320" />
      <circle cx="50" cy="78" r="2.5" fill="#2b2320" />
    </svg>
  );
}

/* ---------- The rainbow ---------- */

const RAINBOW = ['#e24b4b', '#ff9a3c', '#ffd45c', '#7cc47f', '#5bb8f0', '#5b63d6', '#9b7bea'];

export function Rainbow({
  size,
  fraction,
  reacting,
}: {
  size: Size;
  /** How much of the arc is painted, 0 to 1. */
  fraction: number;
  reacting: number;
}) {
  const { w, h } = size;
  const cx = w * 0.45;
  const base = h - 6;
  const outer = Math.min(w * 0.36, h * 0.85);
  const band = Math.max(3, outer * 0.07);
  const cloud = Math.min(56, h * 0.42);
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <g className="rainbow__sun">
          <circle cx={w * 0.1} cy={h * 0.25} r={h * 0.12} fill="#ffd45c" />
        </g>
        {RAINBOW.map((color, i) => {
          const r = outer - i * band;
          // From her right (where the round starts) over the top to her left.
          const d = `M${cx + r} ${base}A${r} ${r} 0 0 0 ${cx - r} ${base}`;
          return (
            <g key={color}>
              <path d={d} className="rainbow__ghost" strokeWidth={band} />
              <path
                d={d}
                pathLength={1}
                className="rainbow__band"
                stroke={color}
                strokeWidth={band}
                style={{ strokeDashoffset: 1 - fraction } as CSSProperties}
              />
            </g>
          );
        })}
        <rect x="0" y={base} width={w} height={h - base} className="rainbow__grass" />
      </svg>
      <div
        key={reacting}
        className={cls('rainbow__cloud', reacting > 0 && 'village__buddy--tilt')}
        style={{ width: cloud, height: cloud }}
        aria-hidden="true"
      >
        <AnaniArt size="100%" />
      </div>
    </>
  );
}

/** ענני: a little cloud. */
export function AnaniArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path
        d="M24 72a16 16 0 0 1 2-32a22 22 0 0 1 40-6a18 18 0 0 1 12 38z"
        fill="#fff"
        stroke="#9fb6d6"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="42" cy="54" r="4" fill="#2b2320" />
      <circle cx="60" cy="54" r="4" fill="#2b2320" />
      <path
        d="M44 63q7 6 14 0"
        stroke="#2b2320"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="34" cy="62" r="4" fill="#f4a3a8" />
      <circle cx="68" cy="62" r="4" fill="#f4a3a8" />
      <path
        d="M38 80l-3 8M52 80l-3 8M66 80l-3 8"
        stroke="#5bb8f0"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- The cake ---------- */

export interface CakeLayout {
  candles: { x: number; y: number; s: number }[];
  cake: { x: number; y: number; w: number; h: number };
  buddy: number;
}

export function cakeLayout({ w, h }: Size, total: number): CakeLayout {
  const buddy = Math.min(52, h * 0.4);
  const cw = Math.min(w * 0.62, w - buddy - 40);
  const ch = h * 0.34;
  const cake = { x: w * 0.42 - cw / 2, y: h - 8 - ch, w: cw, h: ch };
  const n = Math.max(total, 1);
  const s = Math.max(3, Math.min(6, cw / n / 2.4));
  const candles = Array.from({ length: n }, (_, i) => ({
    x: cake.x + cake.w - (cake.w * (i + 0.5)) / n,
    y: cake.y,
    s,
  }));
  return { candles, cake, buddy };
}

export function Cake({
  size,
  layout,
  marks,
  shown,
  popping,
  reacting,
}: {
  size: Size;
  layout: CakeLayout;
  marks: readonly boolean[];
  shown: number;
  popping: number | null;
  reacting: number;
}) {
  const { w, h } = size;
  const { cake, candles } = layout;
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            className="cake__garland"
            d={`M${(i / 8) * w} 4q${w / 16} 14 ${w / 8} 0`}
            stroke={RAINBOW[i % RAINBOW.length]}
          />
        ))}
        <rect
          x={cake.x - 6}
          y={h - 8}
          width={cake.w + 12}
          height="4"
          rx="2"
          className="cake__plate"
        />
        <rect x={cake.x} y={cake.y} width={cake.w} height={cake.h} rx="6" className="cake__body" />
        <path
          className="cake__icing"
          d={`M${cake.x} ${cake.y + 6}${Array.from({ length: 8 }, (_, k) => `q${cake.w / 16} 10 ${cake.w / 8} 0`).join('')}V${cake.y}H${cake.x}z`}
        />
        {candles.map((c, i) => {
          const on = i < shown && marks[i] === true;
          return (
            <g key={i}>
              <rect
                x={c.x - c.s / 2}
                y={c.y - c.s * 3.2}
                width={c.s}
                height={c.s * 3.2}
                rx="1"
                fill={RAINBOW[i % RAINBOW.length]}
              />
              <path
                className={cls(
                  'cake__flame',
                  on && 'cake__flame--on',
                  popping === i && on && 'cake__flame--pop',
                )}
                d={`M${c.x} ${c.y - c.s * 3.2 - c.s * 2.2}q${c.s * 0.9} ${c.s * 1.3} 0 ${c.s * 2}q${-c.s * 0.9} ${-c.s * 0.7} 0 ${-c.s * 2}z`}
              />
            </g>
          );
        })}
      </svg>
      <div
        key={reacting}
        className={cls('village__buddy', reacting > 0 && 'village__buddy--tilt')}
        style={{ width: layout.buddy, height: layout.buddy, top: 'auto', bottom: 6 }}
        aria-hidden="true"
      >
        <ShokiArt size="100%" />
      </div>
    </>
  );
}

/** שוקי: a cupcake with a cherry. */
export function ShokiArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path
        d="M24 56h52l-8 34H32z"
        fill="#f2789f"
        stroke="#c4466f"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M20 58q0-26 30-26t30 26q-8 6-15 0q-7 6-15 0q-8 6-15 0q-7 6-15 0z"
        fill="#fff3e0"
        stroke="#d9b48a"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="26" r="7" fill="#e24b4b" />
      <circle cx="41" cy="70" r="3.5" fill="#2b2320" />
      <circle cx="59" cy="70" r="3.5" fill="#2b2320" />
      <path
        d="M44 78q6 5 12 0"
        stroke="#2b2320"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- The tower ---------- */

export interface TowerLayout {
  base: number;
  floorH: number;
  tx: number;
  tw: number;
  crane: { x: number; top: number };
}

export function towerLayout({ w, h }: Size, total: number): TowerLayout {
  const base = h - 6;
  const n = Math.max(total, 1);
  const floorH = Math.max(4, (h - 30) / n);
  const tw = Math.min(64, w * 0.16);
  return { base, floorH, tx: w * 0.45 - tw / 2, tw, crane: { x: w * 0.45 + tw / 2 + 30, top: 10 } };
}

export function Tower({
  size,
  layout,
  marks,
  shown,
  reacting,
}: {
  size: Size;
  layout: TowerLayout;
  marks: readonly boolean[];
  shown: number;
  reacting: number;
}) {
  const { w, h } = size;
  const { base, floorH, tx, tw, crane } = layout;
  const topY = base - shown * floorH;
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <circle key={i} className="sky-star" cx={(i * 41) % w} cy={4 + ((i * 17) % 40)} r="1.2" />
        ))}
        {/* The skyline behind. */}
        {Array.from({ length: 9 }, (_, i) => {
          const bw = w / 9;
          const bh = h * (0.18 + ((i * 7) % 4) * 0.07);
          return (
            <rect
              key={i}
              className="tower__city"
              x={i * bw}
              y={base - bh}
              width={bw - 3}
              height={bh}
            />
          );
        })}
        <path
          className="tower__light tower__light--a"
          d={`M${tx + tw / 2} ${topY}L${tx - 60} 0L${tx - 20} 0z`}
        />
        <path
          className="tower__light tower__light--b"
          d={`M${tx + tw / 2} ${topY}L${tx + tw + 30} 0L${tx + tw + 70} 0z`}
        />
        {Array.from({ length: shown }, (_, i) => {
          const y = base - (i + 1) * floorH;
          const lit = marks[i] === true;
          return (
            <g key={i} className="tower__floor">
              <rect x={tx} y={y} width={tw} height={floorH - 1} className="tower__wall" />
              {Array.from({ length: 4 }, (_, k) => (
                <rect
                  key={k}
                  x={tx + 4 + k * ((tw - 8) / 4)}
                  y={y + floorH * 0.25}
                  width={(tw - 8) / 4 - 3}
                  height={Math.max(1.5, floorH * 0.45)}
                  className={lit ? 'tower__window tower__window--on' : 'tower__window'}
                />
              ))}
            </g>
          );
        })}
        <rect x={tx + tw / 2 - 1} y={topY - 10} width="2" height="10" className="tower__spire" />
        <circle cx={tx + tw / 2} cy={topY - 11} r="2.5" className="tower__beacon" />
        {/* The crane. */}
        <g className="tower__crane">
          <rect x={crane.x - 2} y={crane.top} width="4" height={base - crane.top} />
          <rect x={tx + tw / 2 - 6} y={crane.top} width={crane.x - tx - tw / 2 + 26} height="3" />
          <line
            x1={tx + tw / 2}
            y1={crane.top + 3}
            x2={tx + tw / 2}
            y2={Math.max(crane.top + 6, topY - 14)}
            className="tower__cable"
          />
        </g>
        <rect x="0" y={base} width={w} height={h - base} className="tower__ground" />
      </svg>
      <span key={reacting} className={cls('tower__count', reacting > 0 && 'tower__count--warn')}>
        {`קומה ${shown}`}
      </span>
    </>
  );
}

/** מנופי: the crane, with a face in its cab. */
export function MenofiArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <rect x="44" y="14" width="10" height="80" fill="#ffb547" stroke="#20232f" strokeWidth="3" />
      <rect x="10" y="14" width="80" height="8" fill="#ffb547" stroke="#20232f" strokeWidth="3" />
      <line x1="16" y1="22" x2="16" y2="44" stroke="#20232f" strokeWidth="2.5" />
      <rect x="10" y="44" width="12" height="8" fill="#5b63d6" />
      <rect
        x="54"
        y="26"
        width="30"
        height="24"
        rx="5"
        fill="#ffd45c"
        stroke="#20232f"
        strokeWidth="3"
      />
      <rect x="58" y="30" width="22" height="10" rx="4" fill="#0f1736" />
      <circle cx="64" cy="35" r="2.5" fill="#34e0d0" />
      <circle cx="74" cy="35" r="2.5" fill="#34e0d0" />
    </svg>
  );
}

/* ---------- The stars ---------- */

/** The constellation: eleven stars, ten lines (a kite with a tail). */
const SKY = [
  [0.86, 0.72],
  [0.78, 0.5],
  [0.7, 0.62],
  [0.62, 0.42],
  [0.52, 0.56],
  [0.46, 0.3],
  [0.36, 0.2],
  [0.26, 0.34],
  [0.32, 0.52],
  [0.42, 0.62],
  [0.46, 0.3],
] as const;

export function Stars({
  size,
  parts,
  flashing,
  reacting,
}: {
  size: Size;
  parts: number;
  flashing: number | null;
  reacting: number;
}) {
  const { w, h } = size;
  const pt = (i: number) => {
    const p = SKY[i] ?? SKY[0];
    return { x: p[0] * w, y: p[1] * h };
  };
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {Array.from({ length: 30 }, (_, i) => (
          <circle
            key={i}
            className="sky-star"
            cx={(i * 37) % w}
            cy={3 + ((i * 29) % (h - 6))}
            r="0.9"
          />
        ))}
        {Array.from({ length: PARTS }, (_, i) => {
          const a = pt(i);
          const b = pt(i + 1);
          const on = i < parts;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              pathLength={1}
              className={cls(
                'stars__line',
                on && 'stars__line--on',
                flashing === i && on && 'stars__line--new',
              )}
            />
          );
        })}
        {SKY.slice(0, PARTS + 1).map((_, i) => {
          const p = pt(i);
          const on = i <= parts && parts > 0;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={on ? 3.2 : 2}
              className={cls('stars__star', on && 'stars__star--on')}
            />
          );
        })}
      </svg>
      <span key={reacting} className={cls('stars__count', reacting > 0 && 'stars__count--warn')}>
        {`${parts}/${PARTS}`}
      </span>
    </>
  );
}

/** נובה: a little star in a space helmet. */
export function NovaArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="#cfe7ff"
        opacity="0.5"
        stroke="#9aa6d4"
        strokeWidth="3"
      />
      <path
        d="M50 18l9 20 22 2-17 14 5 22-19-11-19 11 5-22-17-14 22-2z"
        fill="#ffd45c"
        stroke="#e0a21a"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="43" cy="50" r="3.5" fill="#2b2320" />
      <circle cx="57" cy="50" r="3.5" fill="#2b2320" />
      <path
        d="M45 59q5 4 10 0"
        stroke="#2b2320"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- The dragon egg ---------- */

export function Egg({
  size,
  parts,
  flashing,
  reacting,
}: {
  size: Size;
  parts: number;
  flashing: number | null;
  reacting: number;
}) {
  const { w, h } = size;
  const cx = w * 0.5;
  const base = h - 10;
  const ry = Math.min(h * 0.38, 44);
  const rx = ry * 0.78;
  const cy = base - ry;
  // Ten cracks around the egg, each a short zigzag.
  const cracks = Array.from({ length: PARTS }, (_, i) => {
    const a = -Math.PI / 2 + (i / PARTS) * Math.PI * 2;
    const x = cx + Math.cos(a) * rx * 0.55;
    const y = cy + Math.sin(a) * ry * 0.55;
    const dx = Math.cos(a) * rx * 0.3;
    const dy = Math.sin(a) * ry * 0.3;
    return `M${x} ${y}l${dx * 0.4 + dy * 0.2} ${dy * 0.4 - dx * 0.2}l${dx * 0.3 - dy * 0.25} ${dy * 0.3 + dx * 0.25}l${dx * 0.3} ${dy * 0.3}`;
  });
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => {
          const x = (i / 6) * w + 10;
          const s = 10 + (i % 3) * 6;
          return (
            <path
              key={i}
              className={cls(
                'egg__crystal',
                i < Math.ceil((parts * 6) / PARTS) && 'egg__crystal--on',
              )}
              d={`M${x} ${base}l${s * 0.4} ${-s * 1.6}l${s * 0.4} ${s * 1.6}z`}
            />
          );
        })}
        <rect x="0" y={base} width={w} height={h - base} className="egg__ground" />
        <circle cx={cx} cy={cy} r={ry * 1.2} className="egg__aura" />
        <g key={reacting} className={cls('egg__shell', reacting > 0 && 'egg__shell--sad')}>
          <g className="egg__half egg__half--left">
            <path
              d={`M${cx} ${cy - ry}A${rx} ${ry} 0 0 0 ${cx} ${cy + ry}z`}
              className="egg__body"
            />
          </g>
          <g className="egg__half egg__half--right">
            <path
              d={`M${cx} ${cy - ry}A${rx} ${ry} 0 0 1 ${cx} ${cy + ry}z`}
              className="egg__body"
            />
          </g>
          {[0.25, 0.5, 0.75].map((t) => (
            <ellipse
              key={t}
              cx={cx}
              cy={cy - ry + t * 2 * ry}
              rx={rx * Math.sin(Math.PI * t) * 0.9}
              ry="2"
              className="egg__spot"
            />
          ))}
          {cracks.map((d, i) => (
            <path
              key={i}
              d={d}
              className={cls(
                'egg__crack',
                i < parts && 'egg__crack--on',
                flashing === i && i < parts && 'egg__crack--new',
              )}
            />
          ))}
        </g>
        <g
          className="egg__baby"
          transform={`translate(${cx - ry * 0.7} ${cy - ry * 0.6}) scale(${(ry * 1.4) / 100})`}
        >
          <DrakiShapes />
        </g>
      </svg>
      <span className="egg__count">{`${parts}/${PARTS}`}</span>
    </>
  );
}

function DrakiShapes() {
  return (
    <>
      <path
        d="M22 40l-14-10 4 18zM78 40l14-10-4 18z"
        fill="#3f9a4a"
        stroke="#20232f"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="50" cy="60" rx="30" ry="28" fill="#7cc47f" stroke="#20232f" strokeWidth="3" />
      <path
        d="M36 30l6-14 6 14M52 30l6-14 6 14"
        fill="#ffb547"
        stroke="#20232f"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <ellipse cx="50" cy="70" rx="16" ry="12" fill="#c8ecb8" />
      <circle cx="40" cy="54" r="5" fill="#fff" />
      <circle cx="60" cy="54" r="5" fill="#fff" />
      <circle cx="41" cy="55" r="2.6" fill="#2b2320" />
      <circle cx="61" cy="55" r="2.6" fill="#2b2320" />
      <path
        d="M44 70q6 4 12 0"
        stroke="#20232f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

/** דרקי: the baby dragon. */
export function DrakiArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <DrakiShapes />
    </svg>
  );
}
