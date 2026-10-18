import type { ReactNode } from 'react';
import type { Polygon, Visual } from '@/engine/types';

/**
 * Geometry pictures (phase 6, grades 3–5): angles, pairs of lines, polygons
 * with their marks, a ruler, and a box. Plain SVG, left to right like the
 * arithmetic; numbers in labels are fine (pictures are not read aloud).
 */

type P = [number, number];

const rad = (deg: number) => (deg * Math.PI) / 180;
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const scale = (a: P, k: number): P => [a[0] * k, a[1] * k];
const len = (a: P) => Math.hypot(a[0], a[1]) || 1;
const unit = (a: P): P => scale(a, 1 / len(a));
const fmt = (n: number) => n.toFixed(1);

export function AngleView({ v }: { v: Extract<Visual, { type: 'angle' }> }) {
  const turn = v.turn ?? 0;
  const o: P = [40, 95];
  const r = 90;
  const a1 = rad(-turn);
  const a2 = rad(-(turn + v.deg));
  const p1: P = [o[0] + r * Math.cos(a1), o[1] + r * Math.sin(a1)];
  const p2: P = [o[0] + r * Math.cos(a2), o[1] + r * Math.sin(a2)];
  const ar = 22;
  const q1: P = [o[0] + ar * Math.cos(a1), o[1] + ar * Math.sin(a1)];
  const q2: P = [o[0] + ar * Math.cos(a2), o[1] + ar * Math.sin(a2)];
  const right = v.deg === 90;
  // The picture is framed around the angle, whichever way it is turned.
  const xs = [o[0], p1[0], p2[0]];
  const ys = [o[1], p1[1], p2[1]];
  const minX = Math.min(...xs) - 12;
  const minY = Math.min(...ys) - 12;
  const box = `${fmt(minX)} ${fmt(minY)} ${fmt(Math.max(...xs) - minX + 12)} ${fmt(Math.max(...ys) - minY + 12)}`;
  const corner = add(add(o, scale(unit(sub(p1, o)), 16)), scale(unit(sub(p2, o)), 16));
  return (
    <div className="geo" dir="ltr" data-visual="angle" aria-hidden="true">
      <svg viewBox={box} className="geo__svg">
        <line x1={o[0]} y1={o[1]} x2={fmt(p1[0])} y2={fmt(p1[1])} className="geo__ray" />
        <line x1={o[0]} y1={o[1]} x2={fmt(p2[0])} y2={fmt(p2[1])} className="geo__ray" />
        {right ? (
          <path
            d={`M${fmt(add(o, scale(unit(sub(p1, o)), 16))[0])} ${fmt(add(o, scale(unit(sub(p1, o)), 16))[1])} L${fmt(corner[0])} ${fmt(corner[1])} L${fmt(add(o, scale(unit(sub(p2, o)), 16))[0])} ${fmt(add(o, scale(unit(sub(p2, o)), 16))[1])}`}
            className="geo__mark"
          />
        ) : (
          <path
            d={`M${fmt(q1[0])} ${fmt(q1[1])} A${ar} ${ar} 0 ${v.deg > 180 ? 1 : 0} 0 ${fmt(q2[0])} ${fmt(q2[1])}`}
            className="geo__mark"
          />
        )}
        <circle cx={o[0]} cy={o[1]} r="3.5" className="geo__dot" />
      </svg>
    </div>
  );
}

export function LinesView({ v }: { v: Extract<Visual, { type: 'lines' }> }) {
  const turn = v.turn ?? 0;
  const line = (cx: number, cy: number, deg: number) => {
    const d: P = [Math.cos(rad(deg)) * 60, Math.sin(rad(deg)) * 60];
    return (
      <line
        x1={fmt(cx - d[0])}
        y1={fmt(cy - d[1])}
        x2={fmt(cx + d[0])}
        y2={fmt(cy + d[1])}
        className="geo__line"
      />
    );
  };
  const c = 70;
  return (
    <div className="geo" dir="ltr" data-visual="lines" aria-hidden="true">
      <svg viewBox="0 0 140 140" className="geo__svg">
        <g transform={`rotate(${turn} ${c} ${c})`}>
          {v.kind === 'parallel' ? (
            <>
              {line(c, c - 22, 0)}
              {line(c, c + 22, 0)}
            </>
          ) : v.kind === 'perpendicular' ? (
            <>
              {line(c, c, 0)}
              {line(c, c, 90)}
            </>
          ) : (
            <>
              {line(c, c, 0)}
              {line(c, c, 55)}
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

function centroid(points: P[]): P {
  const s = points.reduce((acc, p) => add(acc, p), [0, 0] as P);
  return scale(s, 1 / points.length);
}

export function PolygonView({ v }: { v: Polygon }) {
  const pts = v.points;
  const c = centroid(pts);
  const n = pts.length;
  const side = (i: number): [P, P] => [pts[i] as P, pts[(i + 1) % n] as P];
  return (
    <div className="geo" dir="ltr" data-visual="polygon" aria-hidden="true">
      <svg viewBox="-22 -18 144 136" className="geo__svg">
        <polygon points={pts.map((p) => p.join(',')).join(' ')} className="geo__shape" />
        {v.diagonals
          ? pts.flatMap((a, i) =>
              pts.map((b, j) =>
                j > i + 1 && !(i === 0 && j === n - 1) ? (
                  <line
                    key={`${i}-${j}`}
                    x1={a[0]}
                    y1={a[1]}
                    x2={b[0]}
                    y2={b[1]}
                    className="geo__diag"
                  />
                ) : null,
              ),
            )
          : null}
        {v.height ? (
          <>
            <line
              x1={v.height.from[0]}
              y1={v.height.from[1]}
              x2={v.height.to[0]}
              y2={v.height.to[1]}
              className="geo__height"
            />
            {v.height.label ? (
              <text
                x={fmt((v.height.from[0] + v.height.to[0]) / 2 + 4)}
                y={fmt((v.height.from[1] + v.height.to[1]) / 2)}
                className="geo__label geo__label--height"
                textAnchor="start"
                dominantBaseline="central"
              >
                {v.height.label}
              </text>
            ) : null}
          </>
        ) : null}
        {(v.rightAngles ?? []).map((i) => {
          const p = pts[i] as P;
          const a = unit(sub(pts[(i + n - 1) % n] as P, p));
          const b = unit(sub(pts[(i + 1) % n] as P, p));
          const k = 8;
          const p1 = add(p, scale(a, k));
          const p2 = add(add(p, scale(a, k)), scale(b, k));
          const p3 = add(p, scale(b, k));
          return (
            <path
              key={`r${i}`}
              d={`M${fmt(p1[0])} ${fmt(p1[1])} L${fmt(p2[0])} ${fmt(p2[1])} L${fmt(p3[0])} ${fmt(p3[1])}`}
              className="geo__mark"
            />
          );
        })}
        {(v.ticks ?? []).map((count, i) => {
          if (!count) return null;
          const [a, b] = side(i);
          const mid = scale(add(a, b), 0.5);
          const dir = unit(sub(b, a));
          const nrm: P = [-dir[1], dir[0]];
          return Array.from({ length: count }, (_, k) => {
            const m = add(mid, scale(dir, (k - (count - 1) / 2) * 4));
            const t1 = add(m, scale(nrm, 4));
            const t2 = add(m, scale(nrm, -4));
            return (
              <line
                key={`t${i}-${k}`}
                x1={fmt(t1[0])}
                y1={fmt(t1[1])}
                x2={fmt(t2[0])}
                y2={fmt(t2[1])}
                className="geo__tick"
              />
            );
          });
        })}
        {(v.sideLabels ?? []).map((label, i) => {
          if (!label) return null;
          const [a, b] = side(i);
          const mid = scale(add(a, b), 0.5);
          const out = unit(sub(mid, c));
          const at = add(mid, scale(out, 11));
          return (
            <text
              key={`s${i}`}
              x={fmt(at[0])}
              y={fmt(at[1])}
              className="geo__label"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {label}
            </text>
          );
        })}
        {(v.angleLabels ?? []).map((label, i) => {
          if (!label) return null;
          const p = pts[i] as P;
          const at = add(p, scale(unit(sub(c, p)), 15));
          return (
            <text
              key={`a${i}`}
              x={fmt(at[0])}
              y={fmt(at[1])}
              className="geo__label geo__label--angle"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function RulerView({ v }: { v: Extract<Visual, { type: 'ruler' }> }) {
  const unitW = 22;
  const pad = 14;
  const w = v.length * unitW + pad * 2;
  const x = (cm: number) => pad + cm * unitW;
  return (
    <div className="geo geo--wide" dir="ltr" data-visual="ruler" aria-hidden="true">
      <svg viewBox={`0 0 ${w} 96`} className="geo__svg">
        <rect
          x={fmt(x(v.from))}
          y="10"
          width={fmt((v.to - v.from) * unitW)}
          height="22"
          rx="4"
          className="geo__object"
        />
        <path d={`M${fmt(x(v.to))} 10 l12 11 l-12 11 z`} className="geo__object-tip" />
        <rect
          x={pad - 6}
          y="40"
          width={w - pad * 2 + 12}
          height="46"
          rx="6"
          className="geo__ruler"
        />
        {Array.from({ length: v.length * 2 + 1 }, (_, i) => {
          const cm = i / 2;
          const whole = i % 2 === 0;
          return (
            <g key={i}>
              <line
                x1={fmt(x(cm))}
                y1="40"
                x2={fmt(x(cm))}
                y2={whole ? 56 : 49}
                className="geo__rtick"
              />
              {whole ? (
                <text x={fmt(x(cm))} y="72" textAnchor="middle" className="geo__rnum">
                  {cm}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function BoxView({ v }: { v: Extract<Visual, { type: 'box' }> }) {
  const k = 70 / Math.max(v.l, v.h, v.w * 0.6);
  const L = v.l * k;
  const H = v.h * k;
  const D: P = [v.w * k * 0.5, -v.w * k * 0.35];
  const o: P = [10, 20 + H - D[1]];
  const A = o;
  const B: P = [o[0] + L, o[1]];
  const C: P = [o[0] + L, o[1] - H];
  const E: P = [o[0], o[1] - H];
  const F = add(E, D);
  const G = add(C, D);
  const Bk = add(B, D);
  const poly = (ps: P[], cls: string) => (
    <polygon points={ps.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(' ')} className={cls} />
  );
  const grid: ReactNode[] = [];
  if (v.cubes) {
    for (let i = 1; i < v.l; i++) {
      const x = o[0] + i * k;
      grid.push(
        <line
          key={`fl${i}`}
          x1={fmt(x)}
          y1={fmt(A[1])}
          x2={fmt(x)}
          y2={fmt(E[1])}
          className="geo__grid"
        />,
      );
      grid.push(
        <line
          key={`tl${i}`}
          x1={fmt(x)}
          y1={fmt(E[1])}
          x2={fmt(x + D[0])}
          y2={fmt(E[1] + D[1])}
          className="geo__grid"
        />,
      );
    }
    for (let j = 1; j < v.h; j++) {
      const y = o[1] - j * k;
      grid.push(
        <line
          key={`fh${j}`}
          x1={fmt(A[0])}
          y1={fmt(y)}
          x2={fmt(B[0])}
          y2={fmt(y)}
          className="geo__grid"
        />,
      );
      grid.push(
        <line
          key={`sh${j}`}
          x1={fmt(B[0])}
          y1={fmt(y)}
          x2={fmt(B[0] + D[0])}
          y2={fmt(y + D[1])}
          className="geo__grid"
        />,
      );
    }
    for (let d = 1; d < v.w; d++) {
      const off = scale(D, d / v.w);
      grid.push(
        <line
          key={`td${d}`}
          x1={fmt(E[0] + off[0])}
          y1={fmt(E[1] + off[1])}
          x2={fmt(C[0] + off[0])}
          y2={fmt(C[1] + off[1])}
          className="geo__grid"
        />,
      );
      grid.push(
        <line
          key={`sd${d}`}
          x1={fmt(B[0] + off[0])}
          y1={fmt(B[1] + off[1])}
          x2={fmt(C[0] + off[0])}
          y2={fmt(C[1] + off[1])}
          className="geo__grid"
        />,
      );
    }
  }
  const u = v.unit ? ` ${v.unit}` : '';
  return (
    <div className="geo" dir="ltr" data-visual="box" aria-hidden="true">
      <svg viewBox="-6 -4 150 130" className="geo__svg">
        {poly([A, B, C, E], 'geo__face')}
        {poly([E, C, G, F], 'geo__face geo__face--top')}
        {poly([B, Bk, G, C], 'geo__face geo__face--side')}
        {grid}
        {v.cubes ? null : (
          <>
            <text
              x={fmt((A[0] + B[0]) / 2)}
              y={fmt(A[1] + 12)}
              textAnchor="middle"
              className="geo__label"
            >
              {v.l}
              {u}
            </text>
            <text
              x={fmt(A[0] - 4)}
              y={fmt((A[1] + E[1]) / 2)}
              textAnchor="end"
              dominantBaseline="central"
              className="geo__label"
            >
              {v.h}
              {u}
            </text>
            <text
              x={fmt((B[0] + Bk[0]) / 2 + 6)}
              y={fmt((B[1] + Bk[1]) / 2 + 6)}
              textAnchor="start"
              className="geo__label"
            >
              {v.w}
              {u}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
