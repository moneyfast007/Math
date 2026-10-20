import type { ReactNode } from 'react';
import type { AvatarId } from '@/profiles/avatars';

/**
 * The children's avatars, drawn like Plusi: flat shapes, round eyes with a
 * white ring and a dark pupil, pink cheeks, one small smile. Drawn inline so
 * they look the same on every device (system emoji differ per phone) and stay
 * sharp at any size. Each sits in a 120×120 box on a soft round background.
 *
 * Ids are the profiles' stored avatar ids (profiles/avatars.ts); an id with no
 * drawing yet falls back to its emoji in Avatar.tsx.
 */

const FACE = '#3a2f2a';
const CHEEK = '#ffb8a3';

/** The shared face: eyes at (lx, rx, y), cheeks a little lower and wider, a smile under. */
function Eyes({
  lx = 46,
  rx = 74,
  y = 62,
  r = 6.5,
  cheeks = true,
  smileY = 76,
}: {
  lx?: number;
  rx?: number;
  y?: number;
  r?: number;
  cheeks?: boolean;
  smileY?: number;
}) {
  const mid = (lx + rx) / 2;
  return (
    <>
      <circle cx={lx} cy={y} r={r} fill="#ffffff" />
      <circle cx={rx} cy={y} r={r} fill="#ffffff" />
      <circle cx={lx + 1.5} cy={y + 1} r={r * 0.5} fill={FACE} />
      <circle cx={rx + 1.5} cy={y + 1} r={r * 0.5} fill={FACE} />
      {cheeks ? (
        <>
          <circle cx={lx - 8} cy={y + 12} r="4" fill={CHEEK} opacity="0.9" />
          <circle cx={rx + 8} cy={y + 12} r="4" fill={CHEEK} opacity="0.9" />
        </>
      ) : null}
      <path
        d={`M${mid - 8} ${smileY}q8 7 16 0`}
        stroke={FACE}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

const ART: Partial<Record<AvatarId, { bg: string; draw: () => ReactNode }>> = {
  fox: {
    bg: '#ffe1cf',
    draw: () => (
      <>
        {/* ears */}
        <path d="M30 60 Q24 30 30 22 Q46 30 56 44 Z" fill="#f0863c" />
        <path d="M90 60 Q96 30 90 22 Q74 30 64 44 Z" fill="#f0863c" />
        <path d="M34 54 Q31 36 33 31 Q43 37 50 46 Z" fill="#ffd6c4" />
        <path d="M86 54 Q89 36 87 31 Q77 37 70 46 Z" fill="#ffd6c4" />
        {/* head: round on top, a soft point at the chin */}
        <path d="M22 62 Q60 28 98 62 Q98 88 78 102 Q60 112 42 102 Q22 88 22 62 Z" fill="#f0863c" />
        {/* white cheeks and muzzle */}
        <path d="M34 76 Q60 62 86 76 Q82 98 60 106 Q38 98 34 76 Z" fill="#fff6ee" />
        {/* nose */}
        <ellipse cx="60" cy="88" rx="4.5" ry="3.5" fill={FACE} />
        <Eyes lx={47} rx={73} y={68} smileY={94} cheeks={false} />
        <circle cx="38" cy="82" r="4" fill={CHEEK} opacity="0.9" />
        <circle cx="82" cy="82" r="4" fill={CHEEK} opacity="0.9" />
      </>
    ),
  },
  lion: {
    bg: '#fff0c2',
    draw: () => (
      <>
        {/* mane */}
        <circle cx="60" cy="64" r="44" fill="#d98a2b" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <circle
            key={a}
            cx={60 + 40 * Math.cos((a * Math.PI) / 180)}
            cy={64 + 40 * Math.sin((a * Math.PI) / 180)}
            r="12"
            fill="#d98a2b"
          />
        ))}
        {/* ears */}
        <circle cx="33" cy="40" r="9" fill="#f4b955" />
        <circle cx="87" cy="40" r="9" fill="#f4b955" />
        {/* head */}
        <circle cx="60" cy="66" r="31" fill="#f4b955" />
        {/* muzzle */}
        <ellipse cx="60" cy="80" rx="15" ry="11" fill="#fff1d2" />
        <ellipse cx="60" cy="76" rx="4.5" ry="3.3" fill={FACE} />
        <Eyes lx={48} rx={72} y={61} smileY={84} cheeks={false} />
        <circle cx="38" cy="74" r="4" fill={CHEEK} opacity="0.9" />
        <circle cx="82" cy="74" r="4" fill={CHEEK} opacity="0.9" />
      </>
    ),
  },
  panda: {
    bg: '#e3efe9',
    draw: () => (
      <>
        {/* ears */}
        <circle cx="32" cy="36" r="13" fill={FACE} />
        <circle cx="88" cy="36" r="13" fill={FACE} />
        {/* head */}
        <ellipse cx="60" cy="66" rx="40" ry="36" fill="#fffdf8" />
        {/* eye patches */}
        <ellipse cx="45" cy="63" rx="12" ry="14" fill={FACE} transform="rotate(-18 45 63)" />
        <ellipse cx="75" cy="63" rx="12" ry="14" fill={FACE} transform="rotate(18 75 63)" />
        <circle cx="46" cy="63" r="5.5" fill="#ffffff" />
        <circle cx="74" cy="63" r="5.5" fill="#ffffff" />
        <circle cx="47" cy="64" r="2.8" fill={FACE} />
        <circle cx="75" cy="64" r="2.8" fill={FACE} />
        {/* nose and smile */}
        <ellipse cx="60" cy="80" rx="4.5" ry="3.3" fill={FACE} />
        <path
          d="M52 88q8 7 16 0"
          stroke={FACE}
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="32" cy="80" r="4" fill={CHEEK} opacity="0.9" />
        <circle cx="88" cy="80" r="4" fill={CHEEK} opacity="0.9" />
      </>
    ),
  },
  koala: {
    bg: '#e4e6ef',
    draw: () => (
      <>
        {/* big round ears */}
        <circle cx="26" cy="54" r="19" fill="#9aa0ad" />
        <circle cx="94" cy="54" r="19" fill="#9aa0ad" />
        <circle cx="26" cy="54" r="11" fill="#ffd0d8" />
        <circle cx="94" cy="54" r="11" fill="#ffd0d8" />
        {/* head */}
        <circle cx="60" cy="66" r="35" fill="#b7bcc8" />
        {/* big nose */}
        <ellipse cx="60" cy="82" rx="10" ry="12" fill={FACE} />
        <ellipse cx="57" cy="77" rx="3" ry="2" fill="#ffffff" opacity="0.35" />
        <Eyes lx={45} rx={75} y={62} r={5.5} cheeks={false} smileY={100} />
        <circle cx="36" cy="76" r="4" fill={CHEEK} opacity="0.9" />
        <circle cx="84" cy="76" r="4" fill={CHEEK} opacity="0.9" />
      </>
    ),
  },
  tiger: {
    bg: '#ffe8c2',
    draw: () => (
      <>
        {/* ears */}
        <circle cx="32" cy="40" r="12" fill="#f3a53b" />
        <circle cx="88" cy="40" r="12" fill="#f3a53b" />
        <circle cx="32" cy="40" r="6" fill="#ffd9b0" />
        <circle cx="88" cy="40" r="6" fill="#ffd9b0" />
        {/* head */}
        <circle cx="60" cy="66" r="36" fill="#f3a53b" />
        {/* stripes */}
        <path
          d="M42 36 l6 12 M60 32 v12 M78 36 l-6 12"
          stroke={FACE}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M27 66 l10 2 M93 66 l-10 2 M28 78 l9 -2 M92 78 l-9 -2"
          stroke={FACE}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* muzzle */}
        <ellipse cx="60" cy="82" rx="16" ry="12" fill="#fff1d6" />
        <ellipse cx="60" cy="77" rx="4.5" ry="3.3" fill={FACE} />
        <Eyes lx={47} rx={73} y={62} cheeks={false} smileY={86} />
        <circle cx="36" cy="80" r="4" fill={CHEEK} opacity="0.9" />
        <circle cx="84" cy="80" r="4" fill={CHEEK} opacity="0.9" />
      </>
    ),
  },
  frog: {
    bg: '#dff3d8',
    draw: () => (
      <>
        {/* eyes on top */}
        <circle cx="40" cy="42" r="15" fill="#6cc04a" />
        <circle cx="80" cy="42" r="15" fill="#6cc04a" />
        {/* head */}
        <path d="M18 62 q42 -22 84 0 q0 34 -42 42 q-42 -8 -42 -42z" fill="#6cc04a" />
        <circle cx="40" cy="44" r="8" fill="#ffffff" />
        <circle cx="80" cy="44" r="8" fill="#ffffff" />
        <circle cx="41.5" cy="45" r="4" fill={FACE} />
        <circle cx="81.5" cy="45" r="4" fill={FACE} />
        {/* wide smile */}
        <path
          d="M40 76 q20 16 40 0"
          stroke={FACE}
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="30" cy="72" r="4.5" fill={CHEEK} opacity="0.9" />
        <circle cx="90" cy="72" r="4.5" fill={CHEEK} opacity="0.9" />
        <circle cx="54" cy="64" r="2" fill={FACE} />
        <circle cx="66" cy="64" r="2" fill={FACE} />
      </>
    ),
  },
  monkey: {
    bg: '#f3e2cf',
    draw: () => (
      <>
        {/* ears */}
        <circle cx="26" cy="64" r="13" fill="#9c6a3f" />
        <circle cx="94" cy="64" r="13" fill="#9c6a3f" />
        <circle cx="26" cy="64" r="7" fill="#f0cfae" />
        <circle cx="94" cy="64" r="7" fill="#f0cfae" />
        {/* head */}
        <circle cx="60" cy="64" r="35" fill="#9c6a3f" />
        {/* face patch */}
        <path d="M34 60 q6 -22 26 -22 q20 0 26 22 q0 34 -26 36 q-26 -2 -26 -36z" fill="#f0cfae" />
        {/* tuft */}
        <path
          d="M60 28 q-4 -8 2 -12 M60 28 q4 -8 -2 -12"
          stroke="#9c6a3f"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse cx="60" cy="80" rx="5" ry="3.2" fill={FACE} />
        <Eyes lx={48} rx={72} y={60} cheeks={false} smileY={90} />
        <circle cx="40" cy="78" r="4" fill={CHEEK} opacity="0.9" />
        <circle cx="80" cy="78" r="4" fill={CHEEK} opacity="0.9" />
      </>
    ),
  },
  unicorn: {
    bg: '#f1e4ff',
    draw: () => (
      <>
        {/* horn */}
        <path d="M60 10 L50 46 L70 46 Z" fill="#f7c948" />
        <path d="M54 32 h12 M52 40 h16" stroke="#e8a33d" strokeWidth="3" strokeLinecap="round" />
        {/* ears */}
        <path d="M34 50 L30 26 L48 42 Z" fill="#ffffff" />
        <path d="M86 50 L90 26 L72 42 Z" fill="#ffffff" />
        {/* mane */}
        <circle cx="34" cy="60" r="12" fill="#c9a6ff" />
        <circle cx="28" cy="80" r="11" fill="#9fd3ff" />
        <circle cx="32" cy="98" r="10" fill="#ffb3d9" />
        {/* head */}
        <circle cx="62" cy="68" r="33" fill="#ffffff" />
        <ellipse cx="66" cy="86" rx="15" ry="11" fill="#ffe3ef" />
        <circle cx="61" cy="86" r="2.5" fill={FACE} />
        <circle cx="71" cy="86" r="2.5" fill={FACE} />
        <Eyes lx={50} rx={76} y={64} cheeks={false} smileY={96} />
        <circle cx="42" cy="78" r="4" fill={CHEEK} opacity="0.9" />
        <circle cx="86" cy="78" r="4" fill={CHEEK} opacity="0.9" />
      </>
    ),
  },
  octopus: {
    bg: '#e0eefb',
    draw: () => (
      <>
        {/* tentacles */}
        {[22, 36, 50, 64, 78, 92].map((x, i) => (
          <path
            key={x}
            d={`M${x} 84 q${i % 2 ? 6 : -6} 14 ${i % 2 ? -4 : 4} 26`}
            stroke="#7c6cd9"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {/* head */}
        <ellipse cx="60" cy="60" rx="38" ry="36" fill="#8f7fe6" />
        <circle cx="48" cy="40" r="5" fill="#ffffff" opacity="0.35" />
        <Eyes lx={46} rx={74} y={60} r={7} smileY={80} />
      </>
    ),
  },
  turtle: {
    bg: '#dcefe0',
    draw: () => (
      <>
        {/* shell */}
        <path d="M24 86 q36 -58 72 0z" fill="#3f9a63" />
        <path
          d="M46 80 l14 -22 l14 22z M34 86 l12 -6 M86 86 l-12 -6"
          stroke="#2d7b4b"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="18" y="84" width="84" height="12" rx="6" fill="#2d7b4b" />
        {/* head */}
        <circle cx="60" cy="52" r="24" fill="#8fd18f" />
        <Eyes lx={50} rx={70} y={50} r={5.5} smileY={64} />
        {/* feet */}
        <circle cx="28" cy="100" r="7" fill="#8fd18f" />
        <circle cx="92" cy="100" r="7" fill="#8fd18f" />
      </>
    ),
  },
  rabbit: {
    bg: '#fde6ee',
    draw: () => (
      <>
        {/* ears */}
        <ellipse cx="44" cy="30" rx="10" ry="24" fill="#f3f0f5" />
        <ellipse cx="76" cy="30" rx="10" ry="24" fill="#f3f0f5" />
        <ellipse cx="44" cy="32" rx="5" ry="17" fill="#ffc9d6" />
        <ellipse cx="76" cy="32" rx="5" ry="17" fill="#ffc9d6" />
        {/* head */}
        <circle cx="60" cy="70" r="32" fill="#f3f0f5" />
        <ellipse cx="60" cy="82" rx="4" ry="3" fill="#ff9fb4" />
        <path
          d="M60 85 v4 M52 90 q8 7 16 0"
          stroke={FACE}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <Eyes lx={48} rx={72} y={66} cheeks={false} smileY={200} />
        <circle cx="38" cy="80" r="4" fill={CHEEK} opacity="0.9" />
        <circle cx="82" cy="80" r="4" fill={CHEEK} opacity="0.9" />
      </>
    ),
  },
  cat: {
    bg: '#eee6f7',
    draw: () => (
      <>
        {/* ears */}
        <path d="M28 58 L26 24 L52 42 Z" fill="#8c8aa3" />
        <path d="M92 58 L94 24 L68 42 Z" fill="#8c8aa3" />
        <path d="M33 52 L32 33 L47 44 Z" fill="#ffc9d6" />
        <path d="M87 52 L88 33 L73 44 Z" fill="#ffc9d6" />
        {/* head */}
        <circle cx="60" cy="68" r="34" fill="#8c8aa3" />
        {/* nose and whiskers */}
        <path d="M56 80 L64 80 L60 85 Z" fill="#ff9fb4" />
        <path
          d="M60 85 v3 M52 89 q8 7 16 0"
          stroke={FACE}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M22 80 l16 2 M22 90 l16 -2 M98 80 l-16 2 M98 90 l-16 -2"
          stroke={FACE}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <Eyes lx={47} rx={73} y={65} cheeks={false} smileY={200} />
        <circle cx="38" cy="78" r="4" fill={CHEEK} opacity="0.9" />
        <circle cx="82" cy="78" r="4" fill={CHEEK} opacity="0.9" />
      </>
    ),
  },
};

export function hasAvatarArt(id: AvatarId): boolean {
  return id in ART;
}

/** The drawing for an avatar, or null when it still uses its emoji. */
export function AvatarArt({ id, className }: { id: AvatarId; className?: string }) {
  const art = ART[id];
  if (!art) return null;
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="58" fill={art.bg} />
      {art.draw()}
    </svg>
  );
}
