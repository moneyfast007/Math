import { clipId } from './hash';

/**
 * Reads text aloud, only when the child taps a speaker button.
 *
 * Order of preference:
 *   1. A pre-generated clip from our own server: /audio/<hash>.mp3, listed in
 *      the child's grade index (/audio/index/g<grade>.json, a few tens of
 *      kilobytes). Works offline once cached by the service worker.
 *   2. The sentence assembled from smaller clips (`parts`: template pieces and
 *      number words), when the whole sentence is not recorded.
 *   3. The device's own Hebrew voice (Web Speech), when clips are missing.
 *   4. Nothing: the caller shows a friendly message. Never an error.
 *
 * One speaker for the whole app: starting a new text stops the previous one.
 */

export type SpeakResult = 'clip' | 'device' | 'unavailable';
export type SpeakerState = { speaking: string | null };

type Listener = (state: SpeakerState) => void;

const SLOW_RATE = 0.8;

/** The clips a child can hear: shared.json, or g<grade>.json (see scripts/tts/index.ts). */
export interface ClipIndex {
  /** 16-hex clip ids, concatenated. */
  ids?: string;
  /** Total size of those clips, for the offline download. */
  bytes?: number;
}

export type IndexName = 'shared' | `g${number}`;

/** Splits the concatenated ids into a set. */
export function parseIndex(index: ClipIndex): Set<string> {
  const ids = index.ids ?? '';
  const out = new Set<string>();
  for (let i = 0; i + 16 <= ids.length; i += 16) out.add(ids.slice(i, i + 16));
  return out;
}

export class Speaker {
  private audio: HTMLAudioElement | null = null;
  /** Bumped by every speak/stop; a running sequence stops when it no longer matches. */
  private generation = 0;
  private indexes = new Map<IndexName, Promise<Set<string>>>();
  private indexName: IndexName = 'shared';
  private listeners = new Set<Listener>();
  private state: SpeakerState = { speaking: null };

  constructor(
    private readonly fetchIndex: (name: IndexName) => Promise<ClipIndex> = defaultFetchIndex,
    private readonly speech: SpeechSynthesis | undefined = globalThis.speechSynthesis,
  ) {}

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  get speaking(): string | null {
    return this.state.speaking;
  }

  private set(speaking: string | null) {
    this.state = { speaking };
    for (const l of this.listeners) l(this.state);
  }

  /** Which clips to look for: the chosen child's grade, or only the shared ones. */
  setGrade(grade: number | null): void {
    this.indexName = grade === null ? 'shared' : `g${grade}`;
  }

  /** The ids of the clips in an index (fetched once, a few tens of kilobytes). */
  clipsFor(name: IndexName = this.indexName): Promise<Set<string>> {
    let index = this.indexes.get(name);
    if (!index) {
      index = this.fetchIndex(name)
        .then(parseIndex)
        .catch(() => {
          this.indexes.delete(name); // try again next time (offline at first use)
          return new Set<string>();
        });
      this.indexes.set(name, index);
    }
    return index;
  }

  private clips(): Promise<Set<string>> {
    return this.clipsFor();
  }

  stop(): void {
    this.generation++;
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    this.speech?.cancel();
    this.set(null);
  }

  async speak(
    text: string,
    { slow = false, parts }: { slow?: boolean; parts?: readonly string[] } = {},
  ): Promise<SpeakResult> {
    this.stop();
    const generation = this.generation;
    this.set(text);
    const clips = await this.clips();
    const id = await clipId(text);
    if (generation !== this.generation) return 'clip';
    if (clips.has(id)) {
      try {
        await this.playClip(`/audio/${id}.mp3`, slow, text);
        return 'clip';
      } catch {
        // Missing from the cache while offline, or blocked: try the other routes.
      }
    }
    if (parts && parts.length > 0) {
      const ids = await Promise.all(parts.map((p) => clipId(p)));
      if (generation === this.generation && ids.every((i) => clips.has(i))) {
        try {
          await this.playClip(`/audio/${ids[0] ?? ''}.mp3`, slow, text, () =>
            this.playRest(ids.slice(1), slow, text, generation),
          );
          return 'clip';
        } catch {
          // Same as above.
        }
      }
    }
    if (generation !== this.generation) return 'clip';
    if (this.speakWithDevice(text, slow)) return 'device';
    this.set(null);
    return 'unavailable';
  }

  /** Plays the remaining clips of a sequence one after another, unless stopped meanwhile. */
  private playRest(ids: string[], slow: boolean, text: string, generation: number): void {
    const next = ids[0];
    if (next === undefined || generation !== this.generation) {
      if (this.state.speaking === text && generation === this.generation) this.set(null);
      return;
    }
    this.playClip(`/audio/${next}.mp3`, slow, text, () =>
      this.playRest(ids.slice(1), slow, text, generation),
    ).catch(() => {
      if (this.state.speaking === text) this.set(null);
    });
  }

  private playClip(src: string, slow: boolean, text: string, then?: () => void): Promise<void> {
    const audio = new Audio(src);
    audio.playbackRate = slow ? SLOW_RATE : 1;
    // Keep the voice's pitch when slowed (Safari supports the standard property).
    (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    this.audio = audio;
    audio.onended = () => {
      if (then) then();
      else if (this.state.speaking === text) this.set(null);
    };
    return audio.play();
  }

  private speakWithDevice(text: string, slow: boolean): boolean {
    const synth = this.speech;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return false;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('he'));
    if (!voice) return false;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = slow ? SLOW_RATE : 1;
    u.onend = () => {
      if (this.state.speaking === text) this.set(null);
    };
    synth.speak(u);
    return true;
  }
}

export async function defaultFetchIndex(name: IndexName): Promise<ClipIndex> {
  const res = await fetch(`/audio/index/${name}.json`);
  if (!res.ok) throw new Error(`audio index ${name}: ${res.status}`);
  return (await res.json()) as ClipIndex;
}

export const speaker = new Speaker();
