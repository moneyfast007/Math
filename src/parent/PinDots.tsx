import { PIN_LENGTH } from '@/state/pin';

/** Four places for the code's digits: filled as they are typed, so every tap shows. */
export function PinDots({ count }: { count: number }) {
  return (
    <span className="pin-dots" aria-hidden="true">
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <span key={i} className={i < count ? 'pin-dot pin-dot--on' : 'pin-dot'} />
      ))}
    </span>
  );
}
