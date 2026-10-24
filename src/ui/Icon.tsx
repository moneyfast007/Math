/**
 * Small line icons for the parent area and the home screen. Always next to a
 * text that says the same, so they are hidden from assistive tech. They take
 * the surrounding text color.
 */
export type IconName =
  | 'lock'
  | 'children'
  | 'progress'
  | 'settings'
  | 'sync'
  | 'backup'
  | 'headphones'
  | 'device'
  | 'plus'
  | 'home'
  | 'info'
  | 'exit';

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className={className ? `icon ${className}` : 'icon'}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <Paths name={name} />
    </svg>
  );
}

function Paths({ name }: { name: IconName }) {
  switch (name) {
    case 'lock':
      return (
        <>
          <rect x="5" y="11" width="14" height="10" rx="2.5" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          <path d="M12 15v2" />
        </>
      );
    case 'exit':
      // A door with an arrow going out (out toward the start side, in RTL).
      return (
        <>
          <path d="M13 4h5a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 18 20h-5" />
          <path d="M10 8l-4 4 4 4" />
          <path d="M6 12h9" />
        </>
      );
    case 'children':
      return (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M16 14.1c2.8.4 5 2.8 5 5.9" />
        </>
      );
    case 'progress':
      return (
        <>
          <path d="M3 21h18" />
          <path d="M6 17v-5M12 17V6M18 17v-8" />
        </>
      );
    case 'settings':
      return (
        <>
          <path d="M4 7h9M19 7h1M4 17h3M13 17h7" />
          <circle cx="16" cy="7" r="2.5" />
          <circle cx="10" cy="17" r="2.5" />
        </>
      );
    case 'sync':
      return (
        <>
          <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" />
          <path d="M4 3v5h5" />
          <path d="M4 13a8 8 0 0 0 14.5 4.5L20 16" />
          <path d="M20 21v-5h-5" />
        </>
      );
    case 'backup':
      return (
        <>
          <path d="M12 3v11M8 10l4 4 4-4" />
          <path d="M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3" />
        </>
      );
    case 'headphones':
      return (
        <>
          <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
          <rect x="3" y="14" width="4.5" height="7" rx="1.5" />
          <rect x="16.5" y="14" width="4.5" height="7" rx="1.5" />
        </>
      );
    case 'device':
      return (
        <>
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
          <path d="M11 18h2" />
        </>
      );
    case 'plus':
      return <path d="M12 5v14M5 12h14" />;
    case 'home':
      return <path d="M4 11l8-7 8 7M6 9.5V20h12V9.5" />;
    case 'info':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.5v.5" />
        </>
      );
  }
}
