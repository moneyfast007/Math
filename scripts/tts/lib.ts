import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { GoogleAuth } from 'google-auth-library';
import { CLIP_ID_LENGTH, normalizeSpokenText } from '../../src/audio/hash';

/**
 * Shared helpers for the TTS build scripts.
 *
 * Authentication: Application Default Credentials, i.e. whatever
 * `gcloud auth application-default login` set up on this machine. No key file,
 * nothing in the repo. The project comes from GOOGLE_CLOUD_PROJECT (or the
 * gcloud default). Nothing here is ever imported by the browser bundle.
 */

export type Engine = 'gemini-flash' | 'gemini-pro' | 'gemini-3.1-flash' | 'chirp3-hd' | 'wavenet';

export interface VoiceSpec {
  engine: Engine;
  /** Gemini/Chirp voice name, e.g. "Leda" (both families share names). */
  voice: string;
  /** Gemini only: the style prompt sent with every request. */
  prompt?: string;
  /** Multiplier for speaking rate; Gemini ignores it, Chirp 3 HD does not support it in he-IL. */
  speakingRate?: number;
}

export const LANGUAGE = 'he-IL';
export const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

export const DEFAULT_PROMPT =
  'You are a warm, patient Hebrew-speaking teacher reading to a young child. ' +
  'Speak clearly and a little slowly, pronounce every number and every word precisely, ' +
  'with gentle, encouraging intonation. Do not add any words.';

export function clipIdNode(spokenText: string): string {
  return createHash('sha256')
    .update(normalizeSpokenText(spokenText), 'utf8')
    .digest('hex')
    .slice(0, CLIP_ID_LENGTH);
}

let cachedToken: { value: string; expires: number } | undefined;
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const client = await auth.getClient();
  const res = await client.getAccessToken();
  if (!res.token)
    throw new Error('Could not obtain an access token. Run: gcloud auth application-default login');
  cachedToken = { value: res.token, expires: Date.now() + 50 * 60_000 };
  return res.token;
}

async function projectId(): Promise<string> {
  const fromEnv = process.env['GOOGLE_CLOUD_PROJECT'];
  if (fromEnv) return fromEnv;
  const id = await auth.getProjectId();
  if (!id) throw new Error('Set GOOGLE_CLOUD_PROJECT or configure a default gcloud project.');
  return id;
}

interface SynthesizeBody {
  input: { text: string; prompt?: string };
  voice: { languageCode: string; name: string; modelName?: string };
  audioConfig: { audioEncoding: 'MP3'; speakingRate?: number; sampleRateHertz?: number };
}

function buildBody(text: string, spec: VoiceSpec): SynthesizeBody {
  switch (spec.engine) {
    case 'gemini-flash':
    case 'gemini-pro':
    case 'gemini-3.1-flash': {
      const body: SynthesizeBody = {
        input: { text, prompt: spec.prompt ?? DEFAULT_PROMPT },
        voice: {
          languageCode: LANGUAGE,
          name: spec.voice,
          modelName:
            spec.engine === 'gemini-flash'
              ? 'gemini-2.5-flash-tts'
              : spec.engine === 'gemini-pro'
                ? 'gemini-2.5-pro-tts'
                : 'gemini-3.1-flash-tts-preview',
        },
        audioConfig: { audioEncoding: 'MP3' },
      };
      return body;
    }
    case 'chirp3-hd': {
      const body: SynthesizeBody = {
        input: { text },
        voice: { languageCode: LANGUAGE, name: `${LANGUAGE}-Chirp3-HD-${spec.voice}` },
        audioConfig: { audioEncoding: 'MP3' },
      };
      return body;
    }
    case 'wavenet': {
      // Classic voices: spec.voice is the full name, e.g. he-IL-Wavenet-A or he-IL-Standard-B.
      const body: SynthesizeBody = {
        input: { text },
        voice: { languageCode: LANGUAGE, name: spec.voice },
        audioConfig: { audioEncoding: 'MP3' },
      };
      return body;
    }
  }
}

/** Calls the API once and returns MP3 bytes. Retries transient failures. */
export async function synthesize(text: string, spec: VoiceSpec): Promise<Buffer> {
  const body = buildBody(text, spec);
  const project = await projectId();
  let lastError: unknown;
  for (let attempt = 1; attempt <= 8; attempt++) {
    const token = await accessToken();
    const res = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-goog-user-project': project,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = (await res.json()) as { audioContent?: string };
      if (!json.audioContent) throw new Error(`Empty audioContent for: ${text}`);
      return Buffer.from(json.audioContent, 'base64');
    }
    const detail = await res.text();
    lastError = new Error(`TTS ${res.status} for "${text}": ${detail.slice(0, 300)}`);
    // 429 / 5xx: back off and retry. 4xx otherwise: give up immediately.
    if (res.status !== 429 && res.status < 500) throw lastError;
    // A per-minute quota (429) needs a real pause; other transient errors a short one.
    const waitMs = res.status === 429 ? 20_000 : 500 * 2 ** Math.min(attempt, 5);
    await new Promise((r) => setTimeout(r, waitMs));
  }
  throw lastError;
}

/** Runs `fn` over `items` with bounded concurrency, preserving order of results. */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i] as T, i);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

/** Approximate cost in USD for a batch of texts, from the public price list (Oct 2026). */
export function estimateCost(texts: readonly string[], engine: Engine): string {
  const chars = texts.reduce((n, t) => n + t.length, 0);
  // Hebrew reads at roughly 12 characters/second; audio tokens are 25 per second.
  const seconds = chars / 12;
  switch (engine) {
    case 'gemini-flash':
      return `${(seconds * 25 * (10 / 1_000_000)).toFixed(2)} USD (Gemini 2.5 Flash, ~${Math.round(seconds / 60)} min audio)`;
    case 'gemini-pro':
      return `${(seconds * 25 * (20 / 1_000_000)).toFixed(2)} USD (Gemini 2.5 Pro, ~${Math.round(seconds / 60)} min audio)`;
    case 'gemini-3.1-flash':
      return `~${(seconds * 25 * (10 / 1_000_000)).toFixed(2)} USD (Gemini 3.1 Flash TTS preview, ~${Math.round(seconds / 60)} min audio)`;
    case 'wavenet':
      return `0.00 USD (WaveNet/Standard, ${chars} chars within the 4M free tier)`;
    case 'chirp3-hd':
      return chars <= 1_000_000
        ? `0.00 USD (Chirp 3 HD, ${chars} chars within the 1M free tier)`
        : `${((chars - 1_000_000) * (30 / 1_000_000)).toFixed(2)} USD (Chirp 3 HD)`;
  }
}
