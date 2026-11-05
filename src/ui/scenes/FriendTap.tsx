import { useState } from 'react';
import { CompanionArt, type CompanionId } from './companions';
import './friendTap.css';

/**
 * A friend she has collected, to tap: each one moves in its own way (the spark
 * flashes, the fish swims off and back, the engine puffs steam, the dragon
 * breathes fire), once per tap. Without motion (the system's setting) it only
 * gives a little nod.
 */
const MOVES: Record<CompanionId, { move: string; fx: string }> = {
  spark: { move: 'zap', fx: 'sparks' },
  tipi: { move: 'bounce', fx: 'splash' },
  bubi: { move: 'swim', fx: 'bubbles' },
  dubi: { move: 'float', fx: 'hearts' },
  toto: { move: 'chug', fx: 'steam' },
  kaftori: { move: 'wobble', fx: 'snow' },
  anani: { move: 'puff', fx: 'rain' },
  shoki: { move: 'jelly', fx: 'sprinkles' },
  cosmo: { move: 'blast', fx: 'flame' },
  turbo: { move: 'zoom', fx: 'lines' },
  bolt: { move: 'spin', fx: 'beep' },
  echo: { move: 'dive', fx: 'bubbles' },
  tzuki: { move: 'jump', fx: 'dust' },
  menofi: { move: 'swing', fx: 'sparkles' },
  nova: { move: 'twinkle', fx: 'sparkles' },
  draki: { move: 'roar', fx: 'fire' },
};

export function FriendTap({ id, name }: { id: CompanionId; name: string }) {
  const [taps, setTaps] = useState(0);
  const { move, fx } = MOVES[id];
  return (
    <button
      type="button"
      className={taps > 0 ? `friend__tap friend__tap--${move}` : 'friend__tap'}
      aria-label={name}
      onClick={() => setTaps((n) => n + 1)}
    >
      {/* A new key each tap: the move starts again even in the middle of the last one. */}
      <span key={taps} className="friend__body">
        <CompanionArt id={id} size="100%" />
      </span>
      {taps > 0 ? (
        <span key={`fx${taps}`} className={`friend__fx friend__fx--${fx}`} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      ) : null}
    </button>
  );
}
