/**
 * Content address for an audio clip: the first 16 hex characters of the SHA-256
 * of the spoken text (UTF-8, NFC-normalized, trimmed).
 *
 * The build script (scripts/tts) uses the same function, in Node, to name the
 * files it generates, so the app can find a clip without any lookup table:
 *   /audio/<clipId(spokenText)>.mp3
 * The voice is a property of the whole audio set (recorded in manifest.json),
 * not of the file name, so switching voices means regenerating everything.
 */
export const CLIP_ID_LENGTH = 16;

export function normalizeSpokenText(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Browser (Web Crypto) implementation. The Node script has its own. */
export async function clipId(spokenText: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeSpokenText(spokenText));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest).slice(0, CLIP_ID_LENGTH);
}
