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
  it('plays the pre-generated clip when the grade index lists it', async () => {
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
    const s = new Speaker(() => Promise.resolve({ ids: id }), fakeSpeech([]));
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
    const s = new Speaker(() => Promise.resolve({ ids: '' }), speech);
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

describe('Speaker, assembled sentences', () => {
  /** Audio elements in the order they were started (all are created up front, to preload). */
  function fakeAudio() {
    const created: { src: string; end: () => void }[] = [];
    vi.stubGlobal(
      'Audio',
      class {
        playbackRate = 1;
        preload = '';
        onended: (() => void) | null = null;
        constructor(public src: string) {}
        play = () => {
          created.push({ src: this.src, end: () => this.onended?.() });
          return Promise.resolve();
        };
        pause = vi.fn();
      },
    );
    return created;
  }

  it('plays the clips one after another when the whole sentence is not recorded', async () => {
    const parts = ['כמה זה', 'ארבעת אלפים', 'ועוד', 'שבע'];
    const ids = await Promise.all(parts.map((p) => clipId(p)));
    const clips = Object.fromEntries(ids.map((id, i) => [id, parts[i]]));
    const created = fakeAudio();
    const s = new Speaker(
      () => Promise.resolve({ ids: Object.keys(clips).join('') }),
      fakeSpeech([]),
    );
    const text = 'כמה זה ארבעת אלפים ועוד שבע?';
    await expect(s.speak(text, { parts })).resolves.toBe('clip');
    expect(created.map((c) => c.src)).toEqual([`/audio/${ids[0]}.mp3`]);
    created[0]?.end();
    created[1]?.end();
    created[2]?.end();
    expect(created.map((c) => c.src)).toEqual(ids.map((id) => `/audio/${id}.mp3`));
    expect(s.speaking).toBe(text);
    created[3]?.end();
    expect(s.speaking).toBeNull();
  });

  it('stopping in the middle ends the sequence', async () => {
    const parts = ['א', 'ב', 'ג'];
    const ids = await Promise.all(parts.map((p) => clipId(p)));
    const clips = Object.fromEntries(ids.map((id, i) => [id, parts[i]]));
    const created = fakeAudio();
    const s = new Speaker(
      () => Promise.resolve({ ids: Object.keys(clips).join('') }),
      fakeSpeech([]),
    );
    await s.speak('א ב ג', { parts });
    s.stop();
    created[0]?.end();
    expect(created).toHaveLength(1);
    expect(s.speaking).toBeNull();
  });

  it('uses the device voice when one of the clips is missing', async () => {
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
    const id = await clipId('כמה זה');
    const speech = fakeSpeech([{ lang: 'he-IL' }]);
    const s = new Speaker(() => Promise.resolve({ ids: id }), speech);
    await expect(s.speak('כמה זה שבע?', { parts: ['כמה זה', 'שבע'] })).resolves.toBe('device');
  });

  it('reads the index of the chosen grade, once, and tries again after a failure', async () => {
    const asked: string[] = [];
    let fail = true;
    const s = new Speaker((name) => {
      asked.push(name);
      if (fail) return Promise.reject(new Error('offline'));
      return Promise.resolve({ ids: 'a'.repeat(16) + 'b'.repeat(16) });
    }, fakeSpeech([]));
    expect(await s.clipsFor()).toEqual(new Set());
    s.setGrade(2);
    fail = false;
    expect(await s.clipsFor()).toEqual(new Set(['a'.repeat(16), 'b'.repeat(16)]));
    await s.clipsFor();
    s.setGrade(null);
    await s.clipsFor();
    // shared failed (asked again later), g2 fetched once.
    expect(asked).toEqual(['shared', 'g2', 'shared']);
  });
});
