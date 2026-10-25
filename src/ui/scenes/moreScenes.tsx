/**
 * The scenes of the second world (SceneStrip.tsx has the engine and the first two):
 *
 * - The garden (gan to grade 2): טיפי, a water drop, waters a seed and a flower
 *   grows. The end: the sun comes out and the flowers sway.
 * - The race (grades 3 to 6): טורבו's car moves on to the next marker. The end:
 *   it crosses the finish line under the chequered flag and drives off.
 *
 * Both run from start (her right, where Hebrew starts) to end (her left).
 */

export interface Size {
  w: number;
  h: number;
}

const FLOWER_COLORS = ['#f2789f', '#ffb547', '#9b7bea', '#ff7a59', '#5bb8f0', '#f05b8b'];

/* ---------- The garden ---------- */

export interface GardenLayout {
  buddy: number;
  spout: { x: number; y: number };
  ground: number;
  spots: { x: number; y: number; s: number }[];
}

export function gardenLayout({ w, h }: Size, total: number): GardenLayout {
  const buddy = Math.round(Math.min(60, h * 0.44));
  const ground = h * 0.78;
  const x0 = w - buddy - 14;
  const x1 = 14;
  const spacing = (x0 - x1) / Math.max(total, 1);
  const s = Math.max(6, Math.min(14, spacing * 0.42));
  const spots = Array.from({ length: total }, (_, i) => ({
    x: x0 + (x1 - x0) * ((i + 0.5) / total),
    y: ground,
    s,
  }));
  return { buddy, spout: { x: w - buddy * 0.8, y: buddy * 0.62 }, ground, spots };
}

export function Garden({
  size,
  layout,
  marks,
  shown,
  popping,
}: {
  size: Size;
  layout: GardenLayout;
  marks: readonly boolean[];
  shown: number;
  popping: number | null;
}) {
  const stemH = (size.h - (size.h - layout.ground)) * 0.42;
  return (
    <svg className="scene-strip__art" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
      <g className="garden__sun">
        <circle cx={size.w * 0.12} cy={size.h * 0.24} r={size.h * 0.13} fill="#ffd45c" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const r0 = size.h * 0.17;
          const r1 = size.h * 0.24;
          const cx = size.w * 0.12;
          const cy = size.h * 0.24;
          return (
            <line
              key={i}
              x1={cx + Math.cos(a) * r0}
              y1={cy + Math.sin(a) * r0}
              x2={cx + Math.cos(a) * r1}
              y2={cy + Math.sin(a) * r1}
              stroke="#ffd45c"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <path
        d={`M0 ${layout.ground}Q${size.w * 0.25} ${layout.ground - 6} ${size.w * 0.5} ${layout.ground}T${size.w} ${layout.ground}V${size.h}H0z`}
        className="garden__ground"
      />
      {layout.spots.map((p, i) => {
        const grown = i < shown && marks[i] === true;
        const color = FLOWER_COLORS[i % FLOWER_COLORS.length] ?? '#f2789f';
        const top = p.y - stemH;
        return (
          <g
            key={i}
            className={[
              'garden__flower',
              grown ? 'garden__flower--grown' : '',
              i < shown && marks[i] === false ? 'garden__flower--missed' : '',
              popping === i && grown ? 'garden__flower--pop' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          >
            {/* The seedling, always there; the stem and the bloom when watered. */}
            <path
              d={`M${p.x} ${p.y}q${-p.s * 0.6} ${-p.s * 0.5} ${-p.s * 0.9} ${-p.s * 0.2}M${p.x} ${p.y}q${p.s * 0.6} ${-p.s * 0.5} ${p.s * 0.9} ${-p.s * 0.2}`}
              className="garden__leaf"
            />
            <g className="garden__bloom">
              <line x1={p.x} y1={p.y} x2={p.x} y2={top} className="garden__stem" />
              {Array.from({ length: 5 }, (_, k) => {
                const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
                return (
                  <circle
                    key={k}
                    cx={p.x + Math.cos(a) * p.s * 0.55}
                    cy={top + Math.sin(a) * p.s * 0.55}
                    r={p.s * 0.45}
                    fill={color}
                  />
                );
              })}
              <circle cx={p.x} cy={top} r={p.s * 0.35} fill="#ffd45c" />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/** טיפי: a water drop with a leaf on top. */
export function TipiArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path d="M58 10q14-6 22 2q-10 10-22 4z" fill="#5bbf6a" />
      <path
        d="M50 12C38 34 22 50 22 66a28 28 0 0 0 56 0c0-16-16-32-28-54z"
        fill="#7cc9f5"
        stroke="#2f86c4"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="38" cy="58" rx="6" ry="9" fill="#dff3ff" opacity="0.85" />
      <circle cx="41" cy="68" r="5.5" fill="#fff" />
      <circle cx="59" cy="68" r="5.5" fill="#fff" />
      <circle cx="42" cy="69" r="3" fill="#2b2320" />
      <circle cx="60" cy="69" r="3" fill="#2b2320" />
      <path
        d="M44 80q6 5 12 0"
        stroke="#2b2320"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="32" cy="76" r="3.5" fill="#f4a3a8" />
      <circle cx="68" cy="76" r="3.5" fill="#f4a3a8" />
    </svg>
  );
}

/* ---------- The race ---------- */

export interface RaceLayout {
  road: number;
  laneH: number;
  start: number;
  finish: number;
  car: number;
  markers: number[];
}

export function raceLayout({ w, h }: Size, total: number): RaceLayout {
  const road = h * 0.5;
  const laneH = h * 0.42;
  const car = Math.max(34, Math.min(70, h * 0.62));
  const start = w - car * 0.6 - 10;
  const finish = 26;
  const markers = Array.from(
    { length: total },
    (_, i) => start - ((start - finish) * (i + 1)) / total,
  );
  return { road, laneH, start, finish, car, markers };
}

export function Race({
  size,
  layout,
  marks,
  shown,
}: {
  size: Size;
  layout: RaceLayout;
  marks: readonly boolean[];
  shown: number;
}) {
  const steps = layout.markers.length;
  // The car moves on with every finished exercise; a shown answer still moves it (more slowly
  // would only confuse), but its marker stays grey.
  const at =
    shown === 0 ? layout.start : (layout.markers[Math.min(shown, steps) - 1] ?? layout.start);
  const flagH = layout.laneH;
  const cell = flagH / 4;
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
        {/* Stands with tiny lights, then the road with its dashed middle line. */}
        {Array.from({ length: 14 }, (_, i) => (
          <circle
            key={i}
            className="race__light"
            cx={((i + 0.5) / 14) * size.w}
            cy={size.h * 0.12}
            r="1.6"
          />
        ))}
        <rect x="0" y={layout.road} width={size.w} height={layout.laneH} className="race__road" />
        <line
          x1="0"
          x2={size.w}
          y1={layout.road + layout.laneH / 2}
          y2={layout.road + layout.laneH / 2}
          className="race__dash"
        />
        {layout.markers.map((x, i) => (
          <rect
            key={i}
            x={x - 2}
            y={layout.road - 6}
            width="4"
            height="6"
            rx="1"
            className={
              i < shown && marks[i] === true
                ? 'race__marker race__marker--passed'
                : i < shown
                  ? 'race__marker race__marker--missed'
                  : 'race__marker'
            }
          />
        ))}
        <g className="race__finish">
          {Array.from({ length: 8 }, (_, k) => (
            <rect
              key={k}
              x={layout.finish - cell + (k % 2) * cell}
              y={layout.road + Math.floor(k / 2) * cell}
              width={cell}
              height={cell}
              fill={(k + Math.floor(k / 2)) % 2 === 0 ? '#ffffff' : '#20232f'}
            />
          ))}
        </g>
      </svg>
      <div
        className="race__car"
        style={{
          width: layout.car,
          height: layout.car * 0.5,
          top: layout.road + layout.laneH * 0.5 - layout.car * 0.38,
          transform: `translateX(${at - layout.car / 2}px)`,
        }}
      >
        <CarArt />
      </div>
    </>
  );
}

/** The race car, facing left (the way the race goes). */
function CarArt() {
  return (
    <svg viewBox="0 0 120 60" width="100%" height="100%" aria-hidden="true">
      <path d="M10 40q2-14 22-16l18-10h30l16 10q18 2 20 16v6H10z" fill="#e24b4b" />
      <path d="M52 16h24l12 10H44z" fill="#cfe7ff" stroke="#9aa6d4" strokeWidth="1.5" />
      <circle cx="62" cy="22" r="6" fill="#ff9a3c" />
      <rect x="57" y="20" width="10" height="3" rx="1.5" fill="#20232f" />
      <rect x="18" y="36" width="90" height="3" fill="#ffffff" opacity="0.8" />
      <circle cx="32" cy="48" r="9" fill="#20232f" />
      <circle cx="32" cy="48" r="4" fill="#9aa6d4" />
      <circle cx="94" cy="48" r="9" fill="#20232f" />
      <circle cx="94" cy="48" r="4" fill="#9aa6d4" />
    </svg>
  );
}

/** טורבו: the driver, a racing helmet with a visor. */
export function TurboArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path
        d="M18 62a32 32 0 0 1 64-6v14H30q-12 0-12-8z"
        fill="#ff9a3c"
        stroke="#20232f"
        strokeWidth="3"
      />
      <path d="M50 26v40" stroke="#20232f" strokeWidth="6" />
      <path d="M40 44h40v14H44q-6 0-6-6z" fill="#20232f" />
      <rect x="46" y="48" width="12" height="5" rx="2.5" fill="#34e0d0" />
      <rect x="62" y="48" width="12" height="5" rx="2.5" fill="#34e0d0" />
      <rect x="30" y="72" width="44" height="12" rx="5" fill="#e24b4b" />
    </svg>
  );
}
