import { describe, expect, it } from 'vitest';
import { backupFileName, parseBackupText, serializeBackup } from './backup';
import { makeData, makeProfile } from './testData';

describe('backup', () => {
  it('round-trips', () => {
    const data = makeData({ profiles: [makeProfile()] });
    const text = serializeBackup(data, new Date('2026-10-17T10:00:00Z'));
    const parsed = parseBackupText(text);
    expect(parsed).toEqual({ ok: true, data });
    expect(JSON.parse(text)).toMatchObject({
      app: 'heshbon',
      kind: 'backup',
      exportedAt: '2026-10-17T10:00:00.000Z',
    });
  });

  it('names the file by local date', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('heshbon-backup-2026-01-05.json');
  });

  it('explains non-JSON input', () => {
    const r = parseBackupText('not json');
    expect(r.ok).toBe(false);
  });
});
