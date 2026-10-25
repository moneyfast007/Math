/**
 * The small sounds of practice, made in the browser (Web Audio): a bright
 * "ding" for a right answer, a soft double "boop" for a wrong one. No file,
 * no network. Off when the parent turned the child's sounds off.
 *
 * Every sound follows a tap (the answer's confirm key), so the browser lets
 * it play at once; a context that is still suspended is simply dropped.
 */

let enabled = true;

/** Set from the child's profile when practice starts. */
export function setSoundsEnabled(on: boolean): void {
  enabled = on;
}

export function soundsEnabled(): boolean {
  return enabled;
}

type Note = { freq: number; at: number; length: number; type?: OscillatorType; gain?: number };

function playNotes(notes: Note[], volume: number): void {
  if (!enabled) return;
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return;
  let ctx: AudioContext;
  try {
    ctx = new Ctor();
  } catch {
    return;
  }
  const go = () => {
    const now = ctx.currentTime + 0.02;
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? 'triangle';
      osc.frequency.value = n.freq;
      gain.gain.setValueAtTime(0, now + n.at);
      gain.gain.linearRampToValueAtTime(n.gain ?? 1, now + n.at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.at + n.length);
      osc.connect(gain).connect(master);
      osc.start(now + n.at);
      osc.stop(now + n.at + n.length + 0.05);
    }
    const end = Math.max(...notes.map((n) => n.at + n.length)) + 0.3;
    window.setTimeout(() => void ctx.close(), end * 1000);
  };
  if (ctx.state === 'running') go();
  else void ctx.resume().then(go, () => void ctx.close());
}

/** A right answer: two bright notes going up. */
export function playCorrect(): void {
  playNotes(
    [
      { freq: 1046.5, at: 0, length: 0.14, type: 'sine' },
      { freq: 1568, at: 0.11, length: 0.32, type: 'sine' },
    ],
    0.16,
  );
}

/** A wrong answer: a soft, low double boop, friendly and short. */
export function playAlmost(): void {
  playNotes(
    [
      { freq: 330, at: 0, length: 0.1, type: 'sine', gain: 0.8 },
      { freq: 294, at: 0.14, length: 0.16, type: 'sine', gain: 0.8 },
    ],
    0.1,
  );
}

/**
 * A right answer, in the voice of the world's scene: ניצוצית's spark, a fuel cell
 * filling, a drop of water, a train's hoot... each of the 16 scenes has its own.
 */
export function playSceneStep(
  kind:
    | 'village'
    | 'rocket'
    | 'garden'
    | 'race'
    | 'pond'
    | 'robot'
    | 'balloons'
    | 'sub'
    | 'train'
    | 'mountain'
    | 'snowman'
    | 'tower'
    | 'rainbow'
    | 'stars'
    | 'cake'
    | 'egg',
  step: number,
): void {
  // It is the sound of a right answer now (no ding besides it), so a little louder.
  const play = (notes: Note[], volume: number) => playNotes(notes, volume * 1.5);
  if (kind === 'snowman') {
    // Patting the snow, then a sparkle.
    play(
      [
        { freq: 210, at: 0, length: 0.06, type: 'triangle', gain: 0.7 },
        { freq: 180, at: 0.09, length: 0.06, type: 'triangle', gain: 0.7 },
        { freq: 1568, at: 0.2, length: 0.14, type: 'sine', gain: 0.6 },
        { freq: 2093, at: 0.28, length: 0.22, type: 'sine', gain: 0.5 },
      ],
      0.1,
    );
    return;
  }
  if (kind === 'rainbow') {
    // A colour sweeping in: a quick run up the scale.
    play(
      [523, 659, 784, 988, 1175, 1568].map((freq, i) => ({
        freq,
        at: i * 0.045,
        length: i === 5 ? 0.25 : 0.08,
        type: 'sine' as const,
        gain: 0.6,
      })),
      0.1,
    );
    return;
  }
  if (kind === 'cake') {
    // A candle lit: a soft strike, then a twinkle.
    play(
      [
        { freq: 160, at: 0, length: 0.05, type: 'sawtooth', gain: 0.3 },
        { freq: 1319, at: 0.1, length: 0.12, type: 'triangle', gain: 0.6 },
        { freq: 1760, at: 0.2, length: 0.25, type: 'triangle', gain: 0.6 },
      ],
      0.1,
    );
    return;
  }
  if (kind === 'tower') {
    // A block set down, clicked in, and the crane's bell.
    play(
      [
        { freq: 196, at: 0, length: 0.08, type: 'square', gain: 0.35 },
        { freq: 880, at: 0.1, length: 0.05, type: 'square', gain: 0.3 },
        { freq: 1319, at: 0.22, length: 0.3, type: 'sine', gain: 0.6 },
      ],
      0.09,
    );
    return;
  }
  if (kind === 'egg') {
    // A crack in the shell, and a little peep-peep.
    play(
      [
        { freq: 1200, at: 0, length: 0.03, type: 'square', gain: 0.4 },
        { freq: 900, at: 0.05, length: 0.03, type: 'square', gain: 0.4 },
        { freq: 1976, at: 0.2, length: 0.07, type: 'sine', gain: 0.7 },
        { freq: 2349, at: 0.32, length: 0.1, type: 'sine', gain: 0.7 },
      ],
      0.1,
    );
    return;
  }
  if (kind === 'stars') {
    // A star lit: three twinkles, high and ringing.
    play(
      [
        { freq: 1760, at: 0, length: 0.25, type: 'sine', gain: 0.6 },
        { freq: 2349, at: 0.08, length: 0.25, type: 'sine', gain: 0.5 },
        { freq: 2637, at: 0.16, length: 0.35, type: 'sine', gain: 0.5 },
      ],
      0.09,
    );
    return;
  }
  if (kind === 'garden') {
    // A drop of water: two soft falling bloops.
    play(
      [
        { freq: 880, at: 0, length: 0.09, type: 'sine', gain: 0.8 },
        { freq: 620, at: 0.07, length: 0.12, type: 'sine', gain: 0.6 },
      ],
      0.1,
    );
    return;
  }
  if (kind === 'train') {
    // Choo-choo: two short hoots, then the wagon clicks on.
    play(
      [
        { freq: 523, at: 0, length: 0.1, type: 'square', gain: 0.4 },
        { freq: 392, at: 0.12, length: 0.12, type: 'square', gain: 0.4 },
        { freq: 1046, at: 0.5, length: 0.1, type: 'triangle', gain: 0.6 },
      ],
      0.07,
    );
    return;
  }
  if (kind === 'mountain') {
    // A step up (or, at the summit, a firework's pop).
    play(
      step >= 99
        ? [
            { freq: 200, at: 0, length: 0.1, type: 'sawtooth', gain: 0.4 },
            { freq: 1568, at: 0.08, length: 0.25, type: 'triangle', gain: 0.5 },
          ]
        : [
            { freq: 392, at: 0, length: 0.1, type: 'triangle', gain: 0.6 },
            { freq: 523, at: 0.12, length: 0.12, type: 'triangle', gain: 0.6 },
          ],
      0.08,
    );
    return;
  }
  if (kind === 'balloons') {
    // Blowing up a balloon, then a little squeak as it ties.
    play(
      [
        { freq: 300, at: 0, length: 0.12, type: 'sine', gain: 0.5 },
        { freq: 450, at: 0.1, length: 0.12, type: 'sine', gain: 0.5 },
        { freq: 680, at: 0.2, length: 0.12, type: 'sine', gain: 0.5 },
        { freq: 1175, at: 0.36, length: 0.12, type: 'triangle', gain: 0.6 },
      ],
      0.09,
    );
    return;
  }
  if (kind === 'sub') {
    // The sonar: one clear ping and its echo.
    play(
      [
        { freq: 880, at: 0, length: 0.25, type: 'sine', gain: 0.8 },
        { freq: 880, at: 0.3, length: 0.2, type: 'sine', gain: 0.3 },
      ],
      0.08,
    );
    return;
  }
  if (kind === 'pond') {
    // A splash: up and down.
    play(
      [
        { freq: 420, at: 0, length: 0.1, type: 'sine', gain: 0.7 },
        { freq: 840, at: 0.08, length: 0.12, type: 'sine', gain: 0.6 },
        { freq: 1046, at: 0.5, length: 0.2, type: 'sine', gain: 0.5 },
      ],
      0.1,
    );
    return;
  }
  if (kind === 'robot') {
    // The scanner, then a click as the part locks in.
    play(
      [
        { freq: 600, at: 0, length: 0.08, type: 'square', gain: 0.3 },
        { freq: 900, at: 0.08, length: 0.08, type: 'square', gain: 0.3 },
        { freq: 1500, at: 0.3, length: 0.08, type: 'sine', gain: 0.6 },
      ],
      0.07,
    );
    return;
  }
  if (kind === 'race') {
    // The engine revving up.
    play(
      [110, 140, 180, 230].map((freq, i) => ({
        freq,
        at: i * 0.05,
        length: 0.09,
        type: 'sawtooth' as const,
        gain: 0.35,
      })),
      0.08,
    );
    return;
  }
  if (kind === 'village') {
    play(
      [300, 450, 680, 1020, 1530].map((freq, i) => ({
        freq,
        at: i * 0.035,
        length: 0.06,
        type: 'triangle' as const,
        gain: 0.7,
      })),
      0.08,
    );
    return;
  }
  const base = 220 + Math.min(step, 17) * 30;
  play(
    [
      { freq: base, at: 0, length: 0.08, type: 'sawtooth', gain: 0.35 },
      { freq: base * 1.5, at: 0.06, length: 0.1, type: 'sawtooth', gain: 0.35 },
    ],
    0.08,
  );
}

/** The rocket's countdown beep, and its low rumble on lift-off. */
export function playCountdown(): void {
  playNotes([{ freq: 660, at: 0, length: 0.12, type: 'square', gain: 0.4 }], 0.08);
}

export function playLaunch(): void {
  playNotes(
    [
      { freq: 90, at: 0, length: 1.4, type: 'sawtooth', gain: 0.6 },
      { freq: 60, at: 0.1, length: 1.5, type: 'sawtooth', gain: 0.5 },
      { freq: 523, at: 1.2, length: 0.3, type: 'triangle', gain: 0.5 },
      { freq: 784, at: 1.32, length: 0.5, type: 'triangle', gain: 0.5 },
    ],
    0.09,
  );
}
