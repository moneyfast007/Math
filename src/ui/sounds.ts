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

function play(notes: Note[], volume: number): void {
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
  play(
    [
      { freq: 1046.5, at: 0, length: 0.14, type: 'sine' },
      { freq: 1568, at: 0.11, length: 0.32, type: 'sine' },
    ],
    0.16,
  );
}

/** A wrong answer: a soft, low double boop, friendly and short. */
export function playAlmost(): void {
  play(
    [
      { freq: 330, at: 0, length: 0.1, type: 'sine', gain: 0.8 },
      { freq: 294, at: 0.14, length: 0.16, type: 'sine', gain: 0.8 },
    ],
    0.1,
  );
}

/** The practice scene moving one step: ניצוצית's spark (a quick rising zap), or a fuel cell filling. */
export function playSceneStep(kind: 'village' | 'rocket', step: number): void {
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
  play([{ freq: 660, at: 0, length: 0.12, type: 'square', gain: 0.4 }], 0.08);
}

export function playLaunch(): void {
  play(
    [
      { freq: 90, at: 0, length: 1.4, type: 'sawtooth', gain: 0.6 },
      { freq: 60, at: 0.1, length: 1.5, type: 'sawtooth', gain: 0.5 },
      { freq: 523, at: 1.2, length: 0.3, type: 'triangle', gain: 0.5 },
      { freq: 784, at: 1.32, length: 0.5, type: 'triangle', gain: 0.5 },
    ],
    0.09,
  );
}
