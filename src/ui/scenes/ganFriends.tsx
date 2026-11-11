/**
 * The friends of gan hova's worlds 9 to 16, one for each (companions.tsx):
 * a cube, an owl, a ladybird, a book, a slice of pizza, a piggy bank, an alarm
 * clock and a crayon. Drawn like the others: a 100×100 face, round white eyes,
 * pink cheeks, a warm outline.
 */

type Art = { size: number | string };

const INK = '#2b2320';

/** Two eyes and a smile, at a centre and a spread. */
function Face({ cx, cy, d = 10, r = 5.5 }: { cx: number; cy: number; d?: number; r?: number }) {
  return (
    <g>
      <circle cx={cx - d} cy={cy} r={r} fill="#fff" />
      <circle cx={cx + d} cy={cy} r={r} fill="#fff" />
      <circle cx={cx - d + 1} cy={cy + 1} r={r * 0.55} fill={INK} />
      <circle cx={cx + d + 1} cy={cy + 1} r={r * 0.55} fill={INK} />
      <path
        d={`M${cx - 6} ${cy + 11}q6 5 12 0`}
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={cx - d - 7} cy={cy + 9} r="3.5" fill="#f4a3a8" />
      <circle cx={cx + d + 7} cy={cy + 9} r="3.5" fill="#f4a3a8" />
    </g>
  );
}

/** קובו: a wooden cube, its top and side showing. */
export function CuboArt({ size }: Art) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path
        d="M22 30 40 16h44L66 30z"
        fill="#ffd27a"
        stroke="#c07a2a"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M66 30 84 16v52L66 84z"
        fill="#e9a54a"
        stroke="#c07a2a"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect
        x="22"
        y="30"
        width="44"
        height="54"
        rx="3"
        fill="#ffbf5c"
        stroke="#c07a2a"
        strokeWidth="3"
      />
      <Face cx={44} cy={52} d={9} r={5} />
    </svg>
  );
}

/** הוטי: a little owl with big round eyes. */
export function HootiArt({ size }: Art) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path d="M24 22 32 36M76 22 68 36" stroke="#7a5236" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="50" cy="58" rx="32" ry="34" fill="#a8724c" stroke="#7a5236" strokeWidth="3" />
      <ellipse cx="50" cy="70" rx="18" ry="18" fill="#e9c9a0" />
      <circle cx="37" cy="48" r="11" fill="#fff" stroke="#7a5236" strokeWidth="2.5" />
      <circle cx="63" cy="48" r="11" fill="#fff" stroke="#7a5236" strokeWidth="2.5" />
      <circle cx="38" cy="49" r="5" fill={INK} />
      <circle cx="64" cy="49" r="5" fill={INK} />
      <path
        d="M46 58h8l-4 7z"
        fill="#f2a541"
        stroke="#c07a2a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="62" r="3.5" fill="#f4a3a8" />
      <circle cx="74" cy="62" r="3.5" fill="#f4a3a8" />
      <path d="M40 92h6M54 92h6" stroke="#f2a541" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** דוטי: a ladybird with seven dots, like a die. */
export function DottiArt({ size }: Art) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path d="M40 18 34 8M60 18 66 8" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <circle cx="34" cy="8" r="3.5" fill={INK} />
      <circle cx="66" cy="8" r="3.5" fill={INK} />
      <ellipse cx="50" cy="60" rx="36" ry="32" fill="#e5484d" stroke="#a8282d" strokeWidth="3" />
      <path d="M50 30v62" stroke="#a8282d" strokeWidth="2.5" />
      <ellipse cx="50" cy="30" rx="22" ry="16" fill="#3a2f2c" />
      <circle cx="26" cy="58" r="5" fill="#3a2f2c" />
      <circle cx="74" cy="58" r="5" fill="#3a2f2c" />
      <circle cx="32" cy="78" r="5" fill="#3a2f2c" />
      <circle cx="68" cy="78" r="5" fill="#3a2f2c" />
      <circle cx="42" cy="28" r="5" fill="#fff" />
      <circle cx="58" cy="28" r="5" fill="#fff" />
      <circle cx="43" cy="29" r="2.7" fill={INK} />
      <circle cx="59" cy="29" r="2.7" fill={INK} />
      <path d="M45 37q5 4 10 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** בוקי: a storybook, open a little, with a bookmark. */
export function BookiArt({ size }: Art) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <rect
        x="18"
        y="14"
        width="64"
        height="76"
        rx="8"
        fill="#5b8def"
        stroke="#2f5fb8"
        strokeWidth="3"
      />
      <rect
        x="24"
        y="14"
        width="52"
        height="70"
        rx="5"
        fill="#fffaf0"
        stroke="#2f5fb8"
        strokeWidth="2"
      />
      <path d="M64 14v22l6-5 6 5V14" fill="#e5484d" />
      <path d="M32 26h22M32 32h16" stroke="#c9c2b4" strokeWidth="3" strokeLinecap="round" />
      <Face cx={50} cy={54} d={10} r={5.5} />
    </svg>
  );
}

/** פיצי: a slice of pizza, cheese and two olives. */
export function PitziArt({ size }: Art) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path
        d="M50 94 14 20q36-14 72 0z"
        fill="#ffd45c"
        stroke="#d99a1e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M14 20q36-14 72 0l-4 9q-32-12-64 0z"
        fill="#e3a052"
        stroke="#b9772f"
        strokeWidth="2.5"
      />
      <circle cx="30" cy="34" r="5" fill="#e5484d" />
      <circle cx="68" cy="36" r="5" fill="#e5484d" />
      <circle cx="56" cy="74" r="4" fill="#4a3b36" />
      <Face cx={50} cy={46} d={9} r={5} />
    </svg>
  );
}

/** קופי: a pink piggy bank with a coin going in. */
export function KupiArt({ size }: Art) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="12" r="8" fill="#ffd45c" stroke="#d99a1e" strokeWidth="2.5" />
      <rect x="42" y="22" width="16" height="4" rx="2" fill="#b0566a" />
      <path
        d="M22 36 26 22l10 10M78 36 74 22 64 32"
        fill="#f7a6b8"
        stroke="#c9667c"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse cx="50" cy="58" rx="36" ry="30" fill="#f7a6b8" stroke="#c9667c" strokeWidth="3" />
      <ellipse cx="50" cy="66" rx="12" ry="8" fill="#f28da5" stroke="#c9667c" strokeWidth="2" />
      <circle cx="46" cy="66" r="2" fill="#b0566a" />
      <circle cx="54" cy="66" r="2" fill="#b0566a" />
      <circle cx="38" cy="50" r="5" fill="#fff" />
      <circle cx="62" cy="50" r="5" fill="#fff" />
      <circle cx="39" cy="51" r="2.7" fill={INK} />
      <circle cx="63" cy="51" r="2.7" fill={INK} />
      <path d="M32 86v6M68 86v6" stroke="#c9667c" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

/** טיק: an alarm clock with two bells, its hands at ten past ten. */
export function TikArt({ size }: Art) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="24" cy="20" r="11" fill="#ffd45c" stroke="#d99a1e" strokeWidth="3" />
      <circle cx="76" cy="20" r="11" fill="#ffd45c" stroke="#d99a1e" strokeWidth="3" />
      <path d="M30 88 24 96M70 88l6 8" stroke="#d99a1e" strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="56" r="36" fill="#7fc8a9" stroke="#3d8f6c" strokeWidth="3" />
      <circle cx="50" cy="56" r="28" fill="#fffaf0" />
      <path d="M50 56 40 44M50 56l12-10" stroke="#3d8f6c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="56" r="3" fill="#3d8f6c" />
      <circle cx="38" cy="64" r="4.5" fill="#fff" stroke="#c9c2b4" strokeWidth="1" />
      <circle cx="62" cy="64" r="4.5" fill="#fff" stroke="#c9c2b4" strokeWidth="1" />
      <circle cx="39" cy="65" r="2.5" fill={INK} />
      <circle cx="63" cy="65" r="2.5" fill={INK} />
      <path d="M45 74q5 4 10 0" stroke={INK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** שרבוט: a purple crayon, drawing a wavy line. */
export function ShirbutArt({ size }: Art) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <path
        d="M8 92q10-10 20 0t20 0"
        stroke="#8f6be8"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M50 4 62 22H38z"
        fill="#5d3fb8"
        stroke="#43298f"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect
        x="34"
        y="22"
        width="32"
        height="64"
        rx="5"
        fill="#8f6be8"
        stroke="#43298f"
        strokeWidth="3"
      />
      <rect x="34" y="70" width="32" height="10" fill="#fffaf0" opacity="0.85" />
      <Face cx={50} cy={42} d={8} r={5} />
    </svg>
  );
}
