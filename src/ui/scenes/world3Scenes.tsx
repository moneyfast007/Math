/**
 * The scenes of the third world (SceneStrip.tsx has the engine):
 *
 * - The pond (gan to grade 2): בועי, a fish, jumps to a lily pad and a lotus
 *   blooms on it. The end: the whole pond in bloom, fireflies.
 * - The robot (grades 3 to 6): בולט is built part by part on the workbench,
 *   from the feet up. The end: his eyes light, he hovers, waves, says hi.
 */

export interface Size {
  w: number;
  h: number;
}

/* ---------- The pond ---------- */

export interface PondLayout {
  surface: number;
  fish: number;
  from: { x: number; y: number };
  pads: { x: number; y: number; s: number }[];
}

export function pondLayout({ w, h }: Size, total: number): PondLayout {
  const surface = h * 0.34;
  const fish = Math.round(Math.min(48, h * 0.36));
  const x0 = w - fish - 18;
  const x1 = 16;
  const spacing = (x0 - x1) / Math.max(total, 1);
  const s = Math.max(5, Math.min(11, spacing * 0.42));
  const pads = Array.from({ length: total }, (_, i) => ({
    x: x0 + (x1 - x0) * ((i + 0.5) / total),
    y: surface + (h - surface) * (0.22 + ((i * 7) % 3) * 0.12),
    s,
  }));
  return { surface, fish, from: { x: w - fish / 2 - 10, y: surface + fish * 0.7 }, pads };
}

export function Pond({
  size,
  layout,
  marks,
  shown,
  popping,
}: {
  size: Size;
  layout: PondLayout;
  marks: readonly boolean[];
  shown: number;
  popping: number | null;
}) {
  const { w, h } = size;
  const sf = layout.surface;
  return (
    <svg className="scene-strip__art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <rect x="0" y="0" width={w} height={sf} className="pond__sky" />
      <rect x="0" y={sf} width={w} height={h - sf} className="pond__water" />
      <path
        d={`M0 ${sf}Q${w * 0.2} ${sf - 6} ${w * 0.4} ${sf}T${w * 0.8} ${sf}T${w} ${sf}`}
        className="pond__line"
      />
      {Array.from({ length: 7 }, (_, i) => (
        <ellipse
          key={`r${i}`}
          className="pond__ripple"
          cx={((i * 53) % 100) * (w / 100)}
          cy={sf + (h - sf) * (0.35 + ((i * 17) % 50) / 100)}
          rx="12"
          ry="2.5"
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <circle
          key={`f${i}`}
          className="pond__firefly"
          cx={(((i * 41) % 100) / 100) * w}
          cy={6 + ((i * 13) % Math.max(sf - 10, 1))}
          r="1.8"
        />
      ))}
      {layout.pads.map((p, i) => {
        const on = i < shown && marks[i] === true;
        const s = p.s;
        return (
          <g key={i}>
            <path
              className="pond__pad"
              d={`M${p.x - s} ${p.y}a${s} ${s * 0.45} 0 1 0 ${s * 2} 0a${s} ${s * 0.45} 0 1 0 ${-s * 2} 0zM${p.x} ${p.y}l${s * 0.6} ${-s * 0.28}`}
            />
            <g
              className={[
                'pond__lotus',
                on ? 'pond__lotus--on' : '',
                popping === i && on ? 'pond__lotus--pop' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <path
                d={`M${p.x} ${p.y - 2}q${-s * 0.8} ${-s * 0.35} ${-s * 0.55} ${-s * 1.25}q${s * 0.35} ${s * 0.35} ${s * 0.55} ${s * 0.7}q${s * 0.2} ${-s * 0.35} ${s * 0.55} ${-s * 0.7}q${s * 0.25} ${s * 0.9} ${-s * 0.55} ${s * 1.25}z`}
                fill="#f79cc2"
                stroke="#d9618f"
                strokeWidth="1"
              />
              <path
                d={`M${p.x} ${p.y - 3}q${-s * 0.28} ${-s * 0.7} 0 ${-s * 1.35}q${s * 0.28} ${s * 0.65} 0 ${s * 1.35}z`}
                fill="#ffd1e3"
                stroke="#d9618f"
                strokeWidth="1"
              />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/** בועי: a round orange fish. */
export function BubiArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path
        d="M76 50l20-16v32z"
        fill="#ff9a3c"
        stroke="#d96b1a"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="46" cy="50" rx="36" ry="28" fill="#ffb547" stroke="#d96b1a" strokeWidth="3" />
      <path d="M40 24q10-12 22 0" fill="#ff9a3c" stroke="#d96b1a" strokeWidth="3" />
      <path
        d="M54 50q8 6 0 14"
        stroke="#d96b1a"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="30" cy="44" r="7" fill="#fff" />
      <circle cx="28.5" cy="45" r="3.6" fill="#2b2320" />
      <path
        d="M14 58q6 5 12 1"
        stroke="#2b2320"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="24" cy="60" r="3.5" fill="#f4a3a8" />
    </svg>
  );
}

/* ---------- The robot ---------- */

/** The ten parts, from the feet up: x, y (from the floor), width, height, radius. */
const PARTS: readonly { box: [number, number, number, number, number]; alt?: true; arm?: true }[] =
  [
    { box: [-24, 22, 16, 22, 4], alt: true },
    { box: [8, 22, 16, 22, 4], alt: true },
    { box: [-28, 56, 56, 34, 9] },
    { box: [-44, 54, 14, 30, 6], alt: true },
    { box: [30, 54, 14, 30, 6], alt: true, arm: true },
    { box: [-8, 64, 16, 8, 3], alt: true },
    { box: [-24, 96, 48, 32, 10] },
    { box: [-18, 88, 36, 15, 7], alt: true },
    { box: [-2, 110, 4, 14, 2], alt: true },
    { box: [-10, 46, 20, 6, 3], alt: true },
  ];
export const ROBOT_PARTS = PARTS.length;

export interface RobotLayout {
  cx: number;
  base: number;
  u: number;
  parts: { x: number; y: number; w: number; h: number; r: number; alt: boolean; arm: boolean }[];
}

export function robotLayout({ w, h }: Size): RobotLayout {
  const cx = w * 0.5;
  const base = h - 10;
  const u = Math.min((h - 16) / 126, 1.1);
  const parts = PARTS.map(({ box: [x, y, pw, ph, r], alt, arm }) => ({
    x: cx + x * u,
    y: base - y * u,
    w: pw * u,
    h: ph * u,
    r: r * u,
    alt: alt === true,
    arm: arm === true,
  }));
  return { cx, base, u, parts };
}

/** Parts built after `lit` right answers in a round of `total`: all ten when every answer was right. */
export function partsBuilt(lit: number, total: number): number {
  return total <= 0 ? 0 : Math.min(ROBOT_PARTS, Math.round((lit * ROBOT_PARTS) / total));
}

export function Robot({
  size,
  layout,
  built,
  flashing,
}: {
  size: Size;
  layout: RobotLayout;
  /** Parts built so far. */
  built: number;
  /** The part just built (it flashes). */
  flashing: number | null;
}) {
  const { cx, base, u, parts } = layout;
  const body = parts[2];
  const visor = parts[7];
  return (
    <>
      <svg className="scene-strip__art" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
        <g className="robot__all">
          {parts.map((p, i) => (
            <rect
              key={i}
              className={[
                'robot__part',
                i < built ? 'robot__part--on' : '',
                p.alt ? 'robot__part--alt' : '',
                p.arm ? 'robot__arm' : '',
                flashing === i && i < built ? 'robot__part--flash' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              rx={p.r}
            />
          ))}
          {/* The eyes only once the visor is built (they light up at the end). */}
          {visor && built > 7 ? (
            <>
              <circle
                className="robot__eye"
                cx={visor.x + visor.w * 0.3}
                cy={visor.y + visor.h / 2}
                r={3 * u}
              />
              <circle
                className="robot__eye"
                cx={visor.x + visor.w * 0.7}
                cy={visor.y + visor.h / 2}
                r={3 * u}
              />
            </>
          ) : null}
          {body ? (
            <circle className="robot__chest" cx={cx} cy={body.y + body.h * 0.45} r={5 * u} />
          ) : null}
          <path
            className="robot__jet"
            d={`M${cx - 18 * u} ${base}q${4 * u} ${12 * u} ${8 * u} 0zM${cx + 10 * u} ${base}q${4 * u} ${12 * u} ${8 * u} 0z`}
          />
        </g>
        <rect x="0" y={base} width={size.w} height="3" className="robot__floor" />
      </svg>
      <span className="robot__say" style={{ right: `calc(50% + ${34 * u}px)` }}>
        היי!
      </span>
    </>
  );
}

/** בולט: the robot, as a friend in the album. */
export function BoltArt({ size }: { size: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <rect x="47" y="4" width="6" height="12" rx="3" fill="#8ea3d8" />
      <circle cx="50" cy="5" r="4.5" fill="#ff9a3c" />
      <rect
        x="22"
        y="16"
        width="56"
        height="40"
        rx="12"
        fill="#dfe7fb"
        stroke="#33437f"
        strokeWidth="3"
      />
      <rect x="30" y="26" width="40" height="18" rx="8" fill="#0f1736" />
      <circle cx="41" cy="35" r="5" fill="#34e0d0" />
      <circle cx="59" cy="35" r="5" fill="#34e0d0" />
      <rect
        x="28"
        y="60"
        width="44"
        height="30"
        rx="8"
        fill="#b9c6ea"
        stroke="#33437f"
        strokeWidth="3"
      />
      <circle cx="50" cy="74" r="6" fill="#ff9a3c" />
    </svg>
  );
}
