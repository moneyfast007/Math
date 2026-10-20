import { QUICK_PROMPT, type VoiceSpec } from './lib';
import { vocalizeForTts, vocalizeTeens } from './pronunciation';

/**
 * The one voice of the bank, and what the manifest records about each clip.
 * Shared by generate.ts (records clips) and reconcile.ts (records clips found
 * in the bucket after a run was cut off before it could save its manifest).
 *
 * Gemini 3.1 Flash TTS, "Leda", at a quick conversational pace (QUICK_PROMPT):
 * chosen in listening rounds 6–8 (Oct 19, 2026) over WaveNet A, Chirp 3 HD,
 * Gemini 2.5 Pro and the 3.8 models, for whole sentences, lone numbers and
 * the fragments sentences are assembled from.
 */
export const VOICE: VoiceSpec = { engine: 'gemini-3.1-flash', voice: 'Leda', prompt: QUICK_PROMPT };
/** Part of the manifest's voice key: a new pace must regenerate the clips too. */
const PACE = 'quick';

export function voiceKey(v: VoiceSpec): string {
  return v.engine.startsWith('gemini')
    ? `${v.engine}/${v.voice}/${PACE}`
    : `${v.engine}/${v.voice}`;
}

/**
 * What the engine is sent for a phrase. Gemini: only the feminine teens get
 * their nikud (round 9, Oct 20, 2026: it reads "שלוש עשרה" as asara without
 * it; everything else it reads well plain). Chirp: the fuller targeted nikud.
 * The clip keeps the plain text's id; the manifest records the text sent when
 * it differs, so a better pronunciation rule regenerates only the clips it changes.
 */
export function textFor(phrase: string, spec: VoiceSpec = VOICE): string {
  return spec.engine === 'chirp3-hd' ? vocalizeForTts(phrase) : vocalizeTeens(phrase);
}

export interface ClipRecord {
  text: string;
  voice: string;
  /** The text the engine was sent, when not the plain text (nikud hints). */
  sent?: string;
  /** Size in bytes (for the offline download the parents see); set again when trimmed. */
  bytes?: number;
  trimmed?: boolean;
}

export interface Manifest {
  version: 2;
  /** clipId → text and voice, for auditing and for detecting routing changes. */
  clips: Record<string, ClipRecord>;
}

/** A clip as recorded is still right: same voice, and the same text was sent. */
export function isCurrent(record: ClipRecord | undefined, spec: VoiceSpec): boolean {
  if (!record || record.voice !== voiceKey(spec)) return false;
  return (record.sent ?? record.text) === textFor(record.text, spec);
}

/** The manifest entry for a clip just recorded (or found) in this voice. */
export function recordOf(text: string, spec: VoiceSpec, bytes: number): ClipRecord {
  const sent = textFor(text, spec);
  return { text, voice: voiceKey(spec), ...(sent !== text ? { sent } : {}), bytes };
}
