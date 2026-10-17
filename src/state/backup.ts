import type { AppData } from './schema';
import { BACKUP_APP_ID, parseBackup, type BackupEnvelope, type ParseResult } from './validate';

/**
 * Backup and restore. The backup is a JSON file the parent keeps (Files app,
 * email to self, AirDrop). It contains names, grades and practice statistics,
 * nothing else, and it never leaves the device unless the parent sends it.
 */

export function serializeBackup(data: AppData, now: Date): string {
  const envelope: BackupEnvelope = {
    app: BACKUP_APP_ID,
    kind: 'backup',
    schemaVersion: data.schemaVersion,
    exportedAt: now.toISOString(),
    data,
  };
  return JSON.stringify(envelope, null, 2);
}

/** heshbon-backup-2026-10-17.json, in local time. */
export function backupFileName(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${BACKUP_APP_ID}-backup-${y}-${m}-${d}.json`;
}

export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

export function parseBackupText(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'הקובץ אינו JSON תקין' };
  }
  return parseBackup(raw);
}

export async function readBackupFile(file: File): Promise<ParseResult> {
  if (file.size > MAX_BACKUP_BYTES) return { ok: false, error: 'הקובץ גדול מדי' };
  return parseBackupText(await file.text());
}

export type DeliveryResult = 'shared' | 'downloaded' | 'cancelled';

/**
 * Hands the file to the parent. On touch devices that support sharing files
 * (iPad, iPhone) this opens the share sheet, which offers "Save to Files";
 * elsewhere it downloads.
 */
export async function deliverFile(text: string, fileName: string): Promise<DeliveryResult> {
  const file = new File([text], fileName, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  const touch = navigator.maxTouchPoints > 0;
  if (touch && typeof nav.canShare === 'function' && nav.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Any other share failure: fall through to a plain download.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Give the browser a moment to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  return 'downloaded';
}
