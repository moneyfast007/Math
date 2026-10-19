import path from 'node:path';

/**
 * Where the audio bank lives while it is built. The clips themselves are not
 * kept in the repository or in the static build: they are uploaded to the R2
 * bucket that the Worker serves /audio/<id>.mp3 from (worker/index.ts). The
 * repository keeps only the manifest (what is recorded, in which voice, and
 * each clip's size) and the small per-grade indexes the app reads.
 */
export const ROOT = path.resolve(import.meta.dirname, '../..');
/** New and changed clips of this run, before they are trimmed and uploaded (not committed). */
export const CLIPS_DIR = path.join(ROOT, 'audio', 'clips');
/** Every clip in the bucket: clipId → text, voice, trimmed, bytes. */
export const MANIFEST = path.join(ROOT, 'audio', 'manifest.json');
/** The per-grade lists the app downloads. */
export const INDEX_DIR = path.join(ROOT, 'public', 'audio', 'index');
/** The R2 bucket and the key prefix the Worker reads. */
export const BUCKET = 'plusi-audio';
export const KEY_PREFIX = 'audio/';
