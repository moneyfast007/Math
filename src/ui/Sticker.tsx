import { stickerLabel, type StickerId } from './stickers';

/** The drawing of one sticker (see stickers.ts for which world gets which). */

export function Sticker({ id, size = 110 }: { id: StickerId; size?: number | string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={stickerLabel(id)}
      className="sticker"
    >
      <Art id={id} />
    </svg>
  );
}

function Art({ id }: { id: StickerId }) {
  switch (id) {
    case 'balloon':
      return (
        <>
          <ellipse cx="50" cy="40" rx="26" ry="32" fill="#e8793a" />
          <ellipse cx="40" cy="28" rx="7" ry="11" fill="#ffffff" opacity="0.4" />
          <path d="M46 72l4 6 4-6z" fill="#c45f24" />
          <path
            d="M50 78q-8 10 2 18"
            fill="none"
            stroke="#7a6a60"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      );
    case 'boat':
      return (
        <>
          <path d="M14 62h72l-10 16H24z" fill="#5b63d6" />
          <path d="M50 18v44" stroke="#7a6a60" strokeWidth="3" strokeLinecap="round" />
          <path d="M52 20l26 38H52z" fill="#2f8f83" />
          <path d="M48 30L30 58h18z" fill="#d8efec" />
          <path
            d="M8 84q10 -6 20 0t20 0 20 0 20 0"
            fill="none"
            stroke="#2f8f83"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      );
    case 'kite':
      return (
        <>
          <path d="M50 8L80 42 50 70 20 42z" fill="#e2a33b" />
          <path d="M50 8v62M20 42h60" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
          <path
            d="M50 70q-10 12 4 22"
            fill="none"
            stroke="#7a6a60"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M54 82l6-4M56 90l6-3" stroke="#e8793a" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case 'star':
      return (
        <>
          <path d="M50 10l12 25 27 3-20 18 6 27-25-14-25 14 6-27L11 38l27-3z" fill="#e2a33b" />
          <path d="M50 24l7 15 16 2-12 11 4 16-15-9z" fill="#ffffff" opacity="0.25" />
        </>
      );
    case 'flower':
      return (
        <>
          <circle cx="50" cy="32" r="12" fill="#e8793a" />
          <circle cx="68" cy="45" r="12" fill="#e8793a" />
          <circle cx="61" cy="66" r="12" fill="#e8793a" />
          <circle cx="39" cy="66" r="12" fill="#e8793a" />
          <circle cx="32" cy="45" r="12" fill="#e8793a" />
          <circle cx="50" cy="50" r="11" fill="#fbeccf" />
          <path d="M50 78v16" stroke="#4f9d5d" strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case 'rocket':
      return (
        <>
          <path d="M50 8c14 12 18 34 14 56H36c-4-22 0-44 14-56z" fill="#5b63d6" />
          <circle cx="50" cy="40" r="8" fill="#d8efec" />
          <path d="M36 50L22 70l14-4zM64 50l14 20-14-4z" fill="#434ab3" />
          <path d="M42 64h16l-8 26z" fill="#e8793a" />
          <path d="M46 64h8l-4 14z" fill="#fbeccf" />
        </>
      );
    case 'train':
      return (
        <>
          <path d="M8 88h84" stroke="#7a6a60" strokeWidth="3" strokeLinecap="round" />
          <circle cx="24" cy="18" r="5" fill="#d8efec" />
          <circle cx="32" cy="10" r="6" fill="#d8efec" />
          <rect x="22" y="26" width="12" height="18" rx="2" fill="#434ab3" />
          <rect x="18" y="22" width="20" height="7" rx="3" fill="#434ab3" />
          <rect x="14" y="42" width="44" height="28" rx="7" fill="#e8793a" />
          <rect x="20" y="46" width="24" height="6" rx="3" fill="#ffffff" opacity="0.4" />
          <rect x="54" y="26" width="30" height="44" rx="3" fill="#5b63d6" />
          <rect x="50" y="20" width="38" height="8" rx="3" fill="#434ab3" />
          <rect x="60" y="33" width="18" height="15" rx="3" fill="#d8efec" />
          <path d="M14 62L6 76h12z" fill="#c45f24" />
          <circle cx="28" cy="76" r="8" fill="#7a6a60" />
          <circle cx="28" cy="76" r="3" fill="#fbeccf" />
          <circle cx="46" cy="76" r="8" fill="#7a6a60" />
          <circle cx="46" cy="76" r="3" fill="#fbeccf" />
          <circle cx="70" cy="74" r="10" fill="#7a6a60" />
          <circle cx="70" cy="74" r="4" fill="#fbeccf" />
        </>
      );
    case 'rainbow':
      return (
        <>
          <path d="M12 70a38 38 0 0 1 76 0" fill="none" stroke="#e8793a" strokeWidth="8" />
          <path d="M20 70a30 30 0 0 1 60 0" fill="none" stroke="#e2a33b" strokeWidth="8" />
          <path d="M28 70a22 22 0 0 1 44 0" fill="none" stroke="#4f9d5d" strokeWidth="8" />
          <path d="M36 70a14 14 0 0 1 28 0" fill="none" stroke="#5b63d6" strokeWidth="8" />
          <circle cx="12" cy="74" r="8" fill="#d8efec" />
          <circle cx="22" cy="70" r="10" fill="#d8efec" />
          <circle cx="32" cy="76" r="7" fill="#d8efec" />
          <rect x="6" y="74" width="30" height="9" rx="4.5" fill="#d8efec" />
          <circle cx="88" cy="74" r="8" fill="#d8efec" />
          <circle cx="78" cy="70" r="10" fill="#d8efec" />
          <circle cx="68" cy="76" r="7" fill="#d8efec" />
          <rect x="64" y="74" width="30" height="9" rx="4.5" fill="#d8efec" />
        </>
      );
  }
}
