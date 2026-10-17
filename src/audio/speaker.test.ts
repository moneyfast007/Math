import { afterEach, describe, expect, it, vi } from 'vitest';
import { clipId } from './hash';
import { Speaker } from './speaker';

afterEach(() => vi.unstubAllGlobals());

function fakeSpeech(voices: { lang: string }[]) {
  const speakMock = vi.fn();
  const synth = {
    getVoices: () => voices,
    speak: speakMock,
    cancel: vi.fn(),
  } as unknown as SpeechSynthesis;
  return Object.assign(synth, { speakMock });
}

describe('Speaker', () => {
  it('plays the pre-generated clip when the manifest lists it', async () => {
    const text = 'כמה זה שלוש ועוד חמש?';
    const id = await clipId(text);
    const play = vi.fn(() => Promise.resolve());
    const created: string[] = [];
    vi.stubGlobal(
      'Audio',
      class {
        playbackRate = 1;
        onended: (() => void) | null = null;
        constructor(src: string) {
          created.push(src);
        }
        play = play;
        pause = vi.fn();
      },
    );
    const s = new Speaker(() => Promise.resolve({ clips: { [id]: text } }), fakeSpeech([]));
    await expect(s.speak(text)).resolves.toBe('clip');
    expect(created).toEqual([`/audio/${id}.mp3`]);
    expect(s.speaking).toBe(text);
  });

  it('falls back to a Hebrew device voice when the clip is missing', async () => {
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: unknown;
        lang = '';
        rate = 1;
        onend: (() => void) | null = null;
        constructor(public text: string) {}
      },
    );
    const speech = fakeSpeech([{ lang: 'en-US' }, { lang: 'he-IL' }]);
    const s = new Speaker(() => Promise.resolve({ clips: {} }), speech);
    await expect(s.speak('שלום', { slow: true })).resolves.toBe('device');
    expect(speech.speakMock).toHaveBeenCalledOnce();
  });

  it('reports unavailable without throwing when nothing can speak', async () => {
    const s = new Speaker(
      () => Promise.reject(new Error('offline')),
      fakeSpeech([{ lang: 'en-US' }]),
    );
    await expect(s.speak('שלום')).resolves.toBe('unavailable');
    expect(s.speaking).toBeNull();
  });

  it('notifies subscribers and stops', async () => {
    const s = new Speaker(() => Promise.resolve({}), fakeSpeech([]));
    const seen: (string | null)[] = [];
    s.subscribe((st) => seen.push(st.speaking));
    await s.speak('שלום');
    s.stop();
    expect(seen[0]).toBeNull();
    expect(seen).toContain('שלום');
    expect(seen.at(-1)).toBeNull();
  });
});
