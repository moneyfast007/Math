/**
 * The scenes of the fourth world (SceneStrip.tsx has the engine):
 *
 * - The balloons (gan to grade 2): every right answer blows up a balloon for
 *   דובי's bunch. The end: there are enough, and he floats up.
 * - The submarine (grades 3 to 6): אקו dives ten metres deeper with every
 *   exercise, lighting a lamp for each right one. The end: the seabed, and the
 *   treasure chest opens.
 */

export interface Size {
  w: number;
  h: number;
}

const COLORS = [
  '#f2789f',
  '#ffb547',
  '#5bb8f0',
  '#9b7bea',
  '#7cc47f',
  '#ff7a59',
  '#f05b8b',
  '#ffd45c',
  '#4fb3a6',
  '#e24b4b',
];

/* ---------- The balloons ---------- */

export interface BalloonsLayout {
  bear: number;
  bearAt: { x: number; y: number };
  knot: { x: number; y: number };
  spots: { x: number; y: number; r: number }[];
  clouds: { x: number; y: number; r: number }[];
  ground: number;
}

export function balloonsLayout({ w, h }: Size, total: number): BalloonsLayout {
  const s = Math.min(h / 150, 1.1);
  const ground = h - 8;
  const bear = 44 * s;
  const bearAt = { x: w * 0.5 - bear / 2, y: ground - bear };
  const knot = { x: w * 0.5, y: ground - bear * 0.95 };
  const n = Math.max(total, 1);
  const r = Math.max(5, Math.min(9 * s, (w * 0.7) / (n * 1.4)));
  const spots = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * ((Math.PI * 1.4) / (n + 2));
    const reach = (i % 2 ? 40 : 52) * s;
    return {
      x: knot.x + Math.cos(a) * reach * 1.3,
      y: knot.y + Math.sin(a) * reach * 0.85 - 4 * s,
      r,
    };
  });
  const clouds = [
    { x: w * 0.15, y: h * 0.2, r: 24 },
    { x: w * 0.8, y: h * 0.3, r: 28 },
  ];
  return { bear, bearAt, knot, spots, clouds, ground };
}

export function Balloons({
  size,
  layout,
  marks,
  shown,
  popping,
  reacting,
}: {
  size: Size;
  layout: BalloonsLayout;
  marks: readonly boolean[];
  shown: number;
  popping: number | null;
  reacting: number;
}) {
  const { knot, spots, bear, bearAt } = layout;
  const on = (i: number) => i < shown && marks[i] === true;
  return (
    <svg className="scene-strip__art" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
      {layout.clouds.map((c, i) => (
        <g key={i} className="balloons__cloud">
          <ellipse cx={c.x} cy={c.y} rx={c.r} ry={c.r * 0.35} />
          <ellipse cx={c.x + c.r * 0.5} cy={c.y - c.r * 0.22} rx={c.r * 0.5} ry={c.r * 0.33} />
        </g>
      ))}
      <rect
        x="0"
        y={layout.ground}
        width={size.w}
        height={size.h - layout.ground}
        className="balloons__ground"
      />
      <g className="balloons__all">
        <g className="balloons__bunch">
          {spots.map((p, i) => (
            <line
              key={`s${i}`}
              className={on(i) ? 'balloons__string balloons__string--on' : 'balloons__string'}
              x1={knot.x}
              y1={knot.y}
              x2={p.x}
              y2={p.y + p.r}
            />
          ))}
          {spots.map((p, i) => {
            const color = COLORS[i % COLORS.length] ?? '#f2789f';
            return (
              <g
                key={`b${i}`}
                className={[
                  'balloons__balloon',
                  on(i) ? 'balloons__balloon--on' : '',
                  popping === i && on(i) ? 'balloons__balloon--pop' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <ellipse cx={p.x} cy={p.y} rx={p.r * 0.85} ry={p.r} fill={color} />
                <ellipse
                  cx={p.x - p.r * 0.3}
                  cy={p.y - p.r * 0.35}
                  rx={p.r * 0.2}
                  ry={p.r * 0.3}
                  fill="#fff"
                  opacity="0.55"
                />
                <path d={`M${p.x - 2} ${p.y + p.r}l2 3 2-3z`} fill={color} />
              </g>
            );
          })}
        </g>
        <g
          key={reacting}
          className={reacting > 0 ? 'balloons__bear balloons__bear--sad' : 'balloons__bear'}
          transform={`translate(${bearAt.x} ${bearAt.y}) scale(${bear / 100})`}
        >
          <DubiShapes />
        </g>
      </g>
    </svg>
  );
}

function DubiShapes() {
  return (
    <>
      <circle cx="28" cy="28" r="11" fill="#b9814f" />
      <circle cx="72" cy="28" r="11" fill="#b9814f" />
      <circle cx="28" cy="28" r="5" fill="#e8c39a" />
      <circle cx="72" cy="28" r="5" fill="#e8c39a" />
      <circle cx="50" cy="52" r="30" fill="#c99260" stroke="#8a5a32" strokeWidth="3" />
      <ellipse cx="50" cy="62" rx="14" ry="10" fill="#f0d3ad" />
      <circle cx="40" cy="46" r="4" fill="#2b2320" />
      <circle cx="60" cy="46" r="4" fill="#2b2320" />
      <ellipse cx="50" cy="57" rx="5" ry="3.5" fill="#2b2320" />
      <path
        d="M44 65q6 5 12 0"
        stroke="#2b2320"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="33" cy="58" r="4" fill="#f4a3a8" />
      <circle cx="67" cy="58" r="4" fill="#f4a3a8" />
    </>
  );
}

/** דובי: the little bear with the balloons. */
export function DubiArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <DubiShapes />
    </svg>
  );
}

/* ---------- The submarine ---------- */

export interface SubLayout {
  sub: number;
  path: { x: number; y: number }[];
  chest: { x: number; y: number };
  sand: number;
  bubbles: { x: number; y: number; r: number }[];
}

export function subLayout({ w, h }: Size, total: number): SubLayout {
  const sub = Math.max(24, Math.min(40, h * 0.27));
  const sand = h - 12;
  const n = Math.max(total, 1);
  const top = sub * 0.55 + 4;
  const bottom = sand - sub * 0.55;
  const path = Array.from({ length: n + 1 }, (_, i) => ({
    x: w * 0.8 - w * 0.5 * (i / n),
    y: top + (bottom - top) * (i / n),
  }));
  const bubbles = Array.from({ length: 12 }, (_, i) => ({
    x: ((i * 37) % 100) * (w / 100),
    y: 8 + ((i * 29) % Math.max(h - 24, 1)),
    r: 1.5 + (i % 3),
  }));
  return { sub, path, chest: { x: w * 0.12, y: sand - 4 }, sand, bubbles };
}

export function Sub({
  size,
  layout,
  marks,
  shown,
  reacting,
}: {
  size: Size;
  layout: SubLayout;
  marks: readonly boolean[];
  shown: number;
  reacting: number;
}) {
  const { w, h } = size;
  const { path, sub, chest, sand } = layout;
  const at = path[Math.min(shown, path.length - 1)] ?? path[0] ?? { x: 0, y: 0 };
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        {layout.bubbles.map((b, i) => (
          <circle key={i} className="sub__bubble" cx={b.x} cy={b.y} r={b.r} />
        ))}
        <path
          d={`M0 ${sand}Q${w * 0.3} ${sand - 9} ${w * 0.6} ${sand}T${w} ${sand - 2}V${h}H0z`}
          className="sub__sand"
        />
        <path
          d={`M${w * 0.62} ${sand}q-6 -24 4 -36M${w * 0.66} ${sand}q8 -18 -2 -29`}
          className="sub__weed"
        />
        {path.slice(1).map((p, i) => (
          <circle
            key={i}
            className={i < shown && marks[i] === true ? 'sub__lamp sub__lamp--on' : 'sub__lamp'}
            cx={p.x}
            cy={p.y}
            r="4"
          />
        ))}
        <circle className="sub__glow" cx={chest.x + 14} cy={chest.y - 8} r="24" />
        <rect
          x={chest.x}
          y={chest.y - 12}
          width="28"
          height="16"
          rx="3"
          fill="#8a5a32"
          stroke="#5c3a1e"
          strokeWidth="2"
        />
        <rect
          className="sub__lid"
          x={chest.x}
          y={chest.y - 19}
          width="28"
          height="8"
          rx="3"
          fill="#a46d3c"
          stroke="#5c3a1e"
          strokeWidth="2"
        />
        {Array.from({ length: 4 }, (_, k) => (
          <circle
            key={k}
            className="sub__coin"
            cx={chest.x + 6 + k * 5.5}
            cy={chest.y - 14}
            r="2.6"
            style={{ animationDelay: `${k * 0.3}s` }}
          />
        ))}
        <g
          className="sub__ship"
          style={{ transform: `translate(${at.x - sub / 2}px, ${at.y - sub / 2}px)` }}
        >
          <g transform={`scale(${sub / 100})`}>
            <EchoShapes />
          </g>
        </g>
      </svg>
      <span key={reacting} className={reacting > 0 ? 'sub__depth sub__depth--warn' : 'sub__depth'}>
        {`${shown * 10} מ׳`}
      </span>
    </>
  );
}

function EchoShapes() {
  return (
    <>
      <rect
        x="44"
        y="12"
        width="12"
        height="18"
        rx="4"
        fill="#ffb547"
        stroke="#20232f"
        strokeWidth="3"
      />
      <rect
        x="10"
        y="30"
        width="80"
        height="40"
        rx="20"
        fill="#ffd45c"
        stroke="#20232f"
        strokeWidth="3"
      />
      <circle cx="36" cy="50" r="10" fill="#0f1736" stroke="#20232f" strokeWidth="3" />
      <circle cx="36" cy="50" r="4" fill="#34e0d0" />
      <circle cx="62" cy="50" r="10" fill="#0f1736" stroke="#20232f" strokeWidth="3" />
      <circle cx="62" cy="50" r="4" fill="#34e0d0" />
      <path
        d="M86 44l10-8v28l-10-8z"
        fill="#ff9a3c"
        stroke="#20232f"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M24 74q26 10 52 0" stroke="#20232f" strokeWidth="3" fill="none" />
    </>
  );
}

/** אקו: the little exploring submarine. */
export function EchoArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <EchoShapes />
    </svg>
  );
}
