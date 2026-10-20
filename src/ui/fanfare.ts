/**
 * A short victory tune, made in the browser (Web Audio): no file, no network.
 * Four rising notes and a held chord, quiet, about a second and a half.
 *
 * iOS starts audio only from a tap: if the context is still suspended, the
 * tune waits for the next touch anywhere instead (and is dropped after a while).
 */

type Ctx = AudioContext;

function context(): Ctx | null {
  const w = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

function play(ctx: Ctx) {
  const now = ctx.currentTime + 0.05;
  const master = ctx.createGain();
  master.gain.value = 0.18;
  master.connect(ctx.destination);
  const note = (freq: number, at: number, length: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + at);
    gain.gain.linearRampToValueAtTime(1, now + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + at + length);
    osc.connect(gain).connect(master);
    osc.start(now + at);
    osc.stop(now + at + length + 0.05);
  };
  // C5 E5 G5, then a C major chord an octave up.
  note(523.25, 0, 0.18);
  note(659.25, 0.13, 0.18);
  note(783.99, 0.26, 0.18);
  for (const f of [1046.5, 1318.5, 1568]) note(f, 0.4, 1.1);
  window.setTimeout(() => void ctx.close(), 2000);
}

/** Plays the tune now, or at the next touch if the browser holds audio back. */
export function playFanfare(): () => void {
  const ctx = context();
  if (!ctx) return () => {};
  if (ctx.state === 'running') {
    play(ctx);
    return () => {};
  }
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    void ctx.resume().then(() => play(ctx));
    cleanup();
  };
  const cleanup = () => {
    document.removeEventListener('pointerdown', go);
    window.clearTimeout(drop);
  };
  // Some browsers allow it right away after the tap that finished the round.
  void ctx.resume().then(() => {
    if (ctx.state === 'running' && !done) {
      done = true;
      cleanup();
      play(ctx);
    }
  });
  document.addEventListener('pointerdown', go, { once: true });
  const drop = window.setTimeout(() => {
    cleanup();
    if (!done) void ctx.close();
  }, 8000);
  return () => {
    cleanup();
    if (!done) void ctx.close();
  };
}
