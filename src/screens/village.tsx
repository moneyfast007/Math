import type { StationState } from '@/engine/journey';
import type { Point } from './journeyLayout';

/**
 * The journey map as a village, drawn at an angle (isometric): every station
 * is a little house with a sign, the final challenge is a castle with the
 * cup's flag, and the path between them is a dirt road. Each world gets its
 * own village (green, autumn, snow, sand), in turn.
 */

export type VillageTheme = 'green' | 'autumn' | 'snow' | 'sand';
const THEMES: readonly VillageTheme[] = ['green', 'autumn', 'snow', 'sand'];

export function villageTheme(worldIndex: number): VillageTheme {
  return THEMES[(Math.max(1, worldIndex) - 1) % THEMES.length] ?? 'green';
}

/** Walls (left, right) and roof of the open houses, in turn. */
const COLORS: readonly (readonly [string, string, string])[] = [
  ['#f2a65a', '#e0884a', '#c4553f'],
  ['#f7d06b', '#e6b94f', '#4f7fc9'],
  ['#9ad0c2', '#7fbcae', '#c4553f'],
  ['#f5b3c4', '#e897ab', '#6a5bc9'],
];
const LOCKED = ['#e9e3db', '#d9d2c8', '#b9b1a7'] as const;

/**
 * One station's house. Done: built, its window lit and smoke from the chimney.
 * The one she is at: lit too. Open but not finished (skipped on the way, or a
 * warm-up): under renovation, with scaffolding, a barrier and a cone. Closed: grey,
 * with a "?" on its wall. The sign in
 * front carries the station's number (not for the youngest, who go by the
 * pictures); where Plusi stands, it grows and glows.
 */
export function House({
  state,
  index,
  number,
  here = false,
}: {
  state: StationState;
  index: number;
  number: number | null;
  /** Plusi stands here: the sign grows and glows. */
  here?: boolean;
}) {
  const locked = state === 'locked';
  const sketch = state === 'skipped' || state === 'warmup';
  const colors = COLORS[index % COLORS.length] ?? COLORS[0]!;
  const [wl, wr, roof] = locked ? LOCKED : colors;
  const lit = state === 'done' || state === 'current';
  if (sketch) {
    // Under renovation: the house itself, its window dark, scaffolding with planks on
    // its front, a striped barrier at the door and a traffic cone.
    return (
      <svg className="house house--works" viewBox="0 0 100 100" aria-hidden="true">
        <ellipse cx="54" cy="86" rx="34" ry="11" className="house__shadow" />
        <polygon points="26,70 54,84 54,54 26,40" fill={colors[0]} />
        <polygon points="54,84 82,70 82,40 54,54" fill={colors[1]} />
        <polygon points="63,79.5 72,75 72,57 63,61.5" fill="#7a4a2a" />
        <polygon
          points="34,62 45,67.5 45,56.5 34,51"
          fill="#9fb3c4"
          stroke="rgb(0 0 0 / 15%)"
          strokeWidth="1"
        />
        <polygon points="21,42 54,58 54,8" fill={colors[2]} />
        <polygon points="54,58 87,42 54,8" fill={colors[2]} opacity="0.82" />
        <polygon points="40,22 54,8 68,22 54,28" className="house__snow" />
        {/* "!" over the roof: something waits here, come back to it. */}
        <g className="house__alert">
          <circle cx="54" cy="-8" r="10" fill="#ffd23f" stroke="#d9a400" strokeWidth="2" />
          <rect x="52.2" y="-14.5" width="3.6" height="8.5" rx="1.8" fill="#3a2f2a" />
          <circle cx="54" cy="-2.6" r="2" fill="#3a2f2a" />
        </g>
        {/* Scaffolding: poles, and planks across them at two heights. */}
        <g stroke="#8a5a2e" strokeWidth="2" strokeLinecap="round">
          <line x1="57" y1="90" x2="57" y2="46" />
          <line x1="70" y1="84" x2="70" y2="40" />
          <line x1="83" y1="77" x2="83" y2="34" />
        </g>
        <polygon
          points="55,70 85,55 85,58.5 55,73.5"
          fill="#d9a35f"
          stroke="#a8743f"
          strokeWidth="1"
        />
        <polygon
          points="55,53 85,38 85,41.5 55,56.5"
          fill="#d9a35f"
          stroke="#a8743f"
          strokeWidth="1"
        />
        <line x1="57" y1="73" x2="70" y2="49.5" stroke="#8a5a2e" strokeWidth="1.4" />
        <line x1="70" y1="67" x2="83" y2="43" stroke="#8a5a2e" strokeWidth="1.4" />
        {/* The barrier, striped, on two little feet. */}
        <g>
          <line x1="40" y1="96" x2="40" y2="88" stroke="#6b6b6b" strokeWidth="1.6" />
          <line x1="58" y1="99" x2="58" y2="91" stroke="#6b6b6b" strokeWidth="1.6" />
          <polygon
            points="37,86 61,94 61,99 37,91"
            fill="#ffd23f"
            stroke="#7a6a20"
            strokeWidth="0.8"
          />
          <polygon points="41,87.3 45,88.7 45,93.7 41,92.3" fill="#2b2320" />
          <polygon points="49,90 53,91.3 53,96.3 49,95" fill="#2b2320" />
          <polygon points="57,92.7 61,94 61,99 57,97.7" fill="#2b2320" />
        </g>
        {/* A traffic cone by the sign. */}
        <g>
          <polygon points="31,99 39,99 35,84" fill="#ff7a2f" />
          <polygon points="32.6,93 37.4,93 36.6,90 33.4,90" fill="#fff" />
          <rect x="29.5" y="98.5" width="11" height="2.5" rx="1" fill="#e2601a" />
        </g>
        <rect x="15" y="82" width="3" height="14" fill="#7a5534" />
        <g className={here ? 'house__sign house__sign--here' : 'house__sign'}>
          <rect
            x="4"
            y="70"
            width="25"
            height="16"
            rx="4"
            fill="#f6dfb3"
            stroke="#c9a46a"
            strokeWidth="2"
          />
          {number !== null ? (
            <text
              x="16.5"
              y="82.5"
              textAnchor="middle"
              fontSize="12"
              fontWeight="800"
              fill="#5b4330"
              fontFamily="ui-rounded, system-ui, sans-serif"
            >
              {number}
            </text>
          ) : null}
        </g>
      </svg>
    );
  }
  return (
    <svg className="house" viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="54" cy="86" rx="34" ry="11" className="house__shadow" />
      <polygon points="26,70 54,84 54,54 26,40" fill={wl} />
      <polygon points="54,84 82,70 82,40 54,54" fill={wr} />
      <polygon points="63,79.5 72,75 72,57 63,61.5" fill={locked ? '#c8bfb4' : '#7a4a2a'} />
      <polygon
        points="34,62 45,67.5 45,56.5 34,51"
        fill={lit ? '#ffe28a' : locked ? '#d6cfc5' : '#cfe7ff'}
        stroke="rgb(0 0 0 / 15%)"
        strokeWidth="1"
      />
      {locked ? (
        <path
          d="M37.6 55.6q2.4-2.6 4.6-0.4q1.6 1.8-1.2 3.4q-1 0.6-1 2"
          fill="none"
          stroke="#a39a8f"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ) : null}
      <polygon points="21,42 54,58 54,8" fill={roof} />
      <polygon points="54,58 87,42 54,8" fill={roof} opacity="0.82" />
      <polygon points="40,22 54,8 68,22 54,28" className="house__snow" />
      {lit ? (
        <>
          <rect x="68" y="18" width="6" height="12" fill="#8a6a52" />
          <circle className="house__smoke" cx="71" cy="14" r="4.5" />
          <circle className="house__smoke house__smoke--2" cx="71" cy="14" r="4.5" />
        </>
      ) : null}
      {/* The sign on its post, in front of the house. */}
      <rect x="15" y="82" width="3" height="14" fill="#7a5534" />
      <g className={here ? 'house__sign house__sign--here' : 'house__sign'}>
        <rect
          x="4"
          y="70"
          width="25"
          height="16"
          rx="4"
          fill={locked ? '#ddd4c8' : '#f6dfb3'}
          stroke={locked ? '#c2b7a9' : '#c9a46a'}
          strokeWidth="2"
        />
        {number !== null ? (
          <text
            x="16.5"
            y="82.5"
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            fill={locked ? '#9a8f84' : '#5b4330'}
            fontFamily="ui-rounded, system-ui, sans-serif"
          >
            {number}
          </text>
        ) : null}
      </g>
    </svg>
  );
}

/** A point a share of the way from a to b. */
function along(a: readonly [number, number], b: readonly [number, number], t: number) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as const;
}

/** Battlements along a wall's top edge, from a to b: small blocks standing on it. */
function merlons(a: readonly [number, number], b: readonly [number, number], fill: string) {
  return Array.from({ length: 5 }, (_, k) => {
    const p = along(a, b, 0.04 + k * 0.2);
    const q = along(a, b, 0.14 + k * 0.2);
    return (
      <polygon
        key={k}
        points={`${p[0]},${p[1]} ${q[0]},${q[1]} ${q[0]},${q[1] - 7} ${p[0]},${p[1] - 7}`}
        fill={fill}
      />
    );
  });
}

/**
 * The final challenge: a castle. A keep with battlements, a gate, a round tower
 * at each side and a taller one behind with the cup's gold flag. Greyer while
 * closed.
 */
export function Castle({ open }: { open: boolean }) {
  const wall = open ? '#e6dff5' : '#e3dfe9';
  const wallR = open ? '#cbc1e3' : '#cfc9d8';
  const top = open ? '#f3effb' : '#efedf2';
  const roof = open ? '#5b62d6' : '#9d9ac2';
  const roofR = open ? '#4a50b8' : '#8784ad';
  const L = [22, 46] as const;
  const F = [60, 64] as const;
  const R = [98, 46] as const;
  return (
    <svg className="castle" viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="106" rx="54" ry="14" className="house__shadow" />
      {/* The tower behind, with the flag. */}
      <rect x="51" y="14" width="18" height="22" fill={wallR} />
      <polygon points="48,16 60,0 72,16" fill={roofR} />
      <rect x="59" y="-16" width="2.4" height="18" fill="#8a6a52" />
      <path className="castle__flag" d="M61.4 -16h20l-4.5 6 4.5 6h-20z" fill="#e8a33d" />
      <path
        d="M67.6 -13.4h7v2.2a3.5 3.5 0 0 1-7 0zM69.8 -7.6h2.6v1.4h1.4v1.1h-5.4v-1.1h1.4z"
        fill="#fff6d8"
      />
      {/* The keep: two walls, its flat top, battlements on the front edges. */}
      <polygon points="22,86 60,104 60,64 22,46" fill={wall} />
      <polygon points="60,104 98,86 98,46 60,64" fill={wallR} />
      <polygon points="22,46 60,64 98,46 60,28" fill={top} />
      {merlons(L, F, wall)}
      {merlons(F, R, wallR)}
      {/* The gate, arched, with its bars; two arrow slits on the other wall. */}
      <path d="M72 98.4 L86 91.8 V77 Q79 70 72 78.6 Z" fill="#5a3f78" />
      <path
        d="M75.5 96.7 V75.4 M79 95.1 V73.6 M82.5 93.4 V73.8"
        stroke="#8d74ad"
        strokeWidth="1.2"
      />
      <rect x="34" y="62" width="3" height="9" rx="1.5" fill="#8f86a8" />
      <rect x="46" y="68" width="3" height="9" rx="1.5" fill="#8f86a8" />
      {/* Round towers at both sides. */}
      <rect x="11" y="40" width="22" height="50" fill={wall} />
      <ellipse cx="22" cy="90" rx="11" ry="4" fill={wall} />
      <polygon points="8,41 22,10 36,41" fill={roof} />
      <ellipse cx="22" cy="41" rx="14" ry="4.5" fill={roofR} />
      <rect x="87" y="40" width="22" height="50" fill={wallR} />
      <ellipse cx="98" cy="90" rx="11" ry="4" fill={wallR} />
      <polygon points="84,41 98,10 112,41" fill={roof} />
      <ellipse cx="98" cy="41" rx="14" ry="4.5" fill={roofR} />
      <polygon points="16,22 22,10 28,22 22,20" className="house__snow" />
      <polygon points="92,22 98,10 104,22 98,20" className="house__snow" />
      <rect x="20.5" y="56" width="3" height="9" rx="1.5" fill="#8f86a8" />
      <rect x="96.5" y="56" width="3" height="9" rx="1.5" fill="#8f86a8" />
    </svg>
  );
}

/** A tree (a snowy one in the snow village, through the stylesheet). */
export function Tree() {
  return (
    <svg className="tree" viewBox="0 0 40 50" aria-hidden="true">
      <ellipse cx="20" cy="46" rx="11" ry="4" className="house__shadow" />
      <rect x="18" y="34" width="4" height="12" className="tree__trunk" />
      <polygon points="7,38 20,4 20,42" className="tree__leaf" />
      <polygon points="20,42 20,4 33,38" className="tree__leaf tree__leaf--dark" />
      <polygon points="15,16 20,4 25,16 20,13" className="house__snow" />
    </svg>
  );
}

/**
 * Where trees can stand: places on a loose grid away from every station and
 * from the road between them, a few, always the same for the same map.
 */
export function treeSpots(points: readonly Point[], height: number, max = 9): Point[] {
  const near = (p: Point, q: Point, r: number) => Math.hypot(p.x - q.x, p.y - q.y) < r;
  const nearSegment = (p: Point, a: Point, b: Point, r: number) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
    return near(p, { x: a.x + t * dx, y: a.y + t * dy }, r);
  };
  const out: Point[] = [];
  for (let y = 12; y < height - 4 && out.length < max; y += 9) {
    for (let x = 6; x < 96 && out.length < max; x += 11) {
      const p = { x: x + ((y * 7) % 5), y };
      if (points.some((q) => near(p, q, 15))) continue;
      if (points.some((q, i) => i > 0 && nearSegment(p, points[i - 1]!, q, 8))) continue;
      if (out.some((q) => near(p, q, 14))) continue;
      out.push(p);
    }
  }
  return out;
}

/** One builder: a yellow hard hat, an orange vest, a hammer in hand. */
function Builder({
  x,
  y,
  flip = false,
  delay,
}: {
  x: number;
  y: number;
  flip?: boolean;
  delay: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <g className="crew__builder" style={{ animationDelay: `${delay}s` }}>
        <line
          x1="-2"
          y1="0"
          x2="-3"
          y2="-7"
          stroke="#3a4a6a"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <line
          x1="2"
          y1="0"
          x2="3"
          y2="-7"
          stroke="#3a4a6a"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <rect x="-4.5" y="-16" width="9" height="10" rx="2.5" fill="#ff8a2a" />
        <circle cx="0" cy="-20" r="4" fill="#f0c9a0" />
        <path d="M-5 -21a5 5 0 0 1 10 0z" fill="#ffd23f" />
        <rect x="-5.8" y="-21.6" width="11.6" height="1.6" rx="0.8" fill="#e6b400" />
        <g className="crew__hammer" style={{ animationDelay: `${delay}s` }}>
          <line
            x1="4"
            y1="-13"
            x2="10"
            y2="-17"
            stroke="#8a5a2e"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <rect x="8.5" y="-20" width="4" height="3" rx="0.6" fill="#7a7a7a" />
        </g>
      </g>
    </g>
  );
}

/**
 * The crew that builds a house the moment its station is finished: builders
 * run in and hammer, dust flies, the scaffolding comes down and the house
 * stands, in two seconds (village.css times it). Drawn over the house.
 */
export function BuildCrew() {
  return (
    <svg className="crew" viewBox="0 0 100 100" aria-hidden="true">
      <g className="crew__scaffold" stroke="#8a5a2e" strokeWidth="2" strokeLinecap="round">
        <line x1="22" y1="80" x2="22" y2="34" />
        <line x1="54" y1="94" x2="54" y2="44" />
        <line x1="86" y1="80" x2="86" y2="34" />
        <line x1="22" y1="62" x2="54" y2="77" />
        <line x1="54" y1="77" x2="86" y2="62" />
        <line x1="22" y1="46" x2="54" y2="61" />
        <line x1="54" y1="61" x2="86" y2="46" />
      </g>
      {[
        [18, 70],
        [50, 40],
        [84, 66],
        [36, 92],
        [74, 90],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          className="crew__dust"
          cx={cx}
          cy={cy}
          r="7"
          style={{ animationDelay: `${0.25 + i * 0.22}s` }}
        />
      ))}
      <g className="crew__team crew__team--a">
        <Builder x={14} y={94} delay={0} />
        <Builder x={34} y={100} delay={0.15} />
      </g>
      <g className="crew__team crew__team--b">
        <Builder x={92} y={88} flip delay={0.1} />
        <Builder x={74} y={98} flip delay={0.25} />
      </g>
    </svg>
  );
}
