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
 * One station's house. Done: its window lit and smoke from the chimney. The
 * one she is at: lit too. Closed: grey, with a "?" on its wall. The sign in
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
  const [wl, wr, roof] = locked ? LOCKED : (COLORS[index % COLORS.length] ?? COLORS[0]!);
  const lit = state === 'done' || state === 'current';
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

/** The final challenge: a castle with two towers and the cup's gold flag. */
export function Castle({ open }: { open: boolean }) {
  const wall = open ? '#e3dcf2' : '#e2dde8';
  const wallR = open ? '#cbc1e3' : '#cdc6d6';
  const roof = open ? '#5b62d6' : '#9a97bf';
  return (
    <svg className="castle" viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="104" rx="50" ry="14" className="house__shadow" />
      <polygon points="18,84 60,102 60,62 18,44" fill={wall} />
      <polygon points="60,102 102,84 102,44 60,62" fill={wallR} />
      <polygon points="66,98 78,93 78,74 72,70 66,76" fill="#6a4a8a" />
      <rect x="10" y="38" width="20" height="50" fill={wall} />
      <rect x="90" y="38" width="20" height="50" fill={wallR} />
      <polygon points="7,40 20,14 33,40" fill={roof} />
      <polygon points="87,40 100,14 113,40" fill={roof} />
      <polygon points="15,24 20,14 25,24 20,22" className="house__snow" />
      <polygon points="95,24 100,14 105,24 100,22" className="house__snow" />
      <rect x="58.5" y="6" width="3" height="58" fill="#8a6a52" />
      <path className="castle__flag" d="M61.5 6h30l-7 9 7 9h-30z" fill="#e8a33d" />
      <path
        d="M71 10h10v3a5 5 0 0 1-10 0zM74 18h4v2h2v1.5h-8V20h2z"
        fill="#fff6d8"
        opacity="0.95"
      />
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
