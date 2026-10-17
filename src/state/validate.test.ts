import { describe, expect, it } from 'vitest';
import { emptyProgress, MAX_PROFILES, RECENT_WINDOW, SCHEMA_VERSION } from './schema';
import { makeData, makeProfile } from './testData';
import { parseAppData, parseBackup } from './validate';

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

describe('parseAppData', () => {
  it('accepts an empty document', () => {
    const result = parseAppData(makeData());
    expect(result.ok).toBe(true);
  });

  it('accepts a full document and round-trips through JSON', () => {
    const data = makeData({
      profiles: [makeProfile(), makeProfile({ id: 'p2', name: 'איתי', gender: 'm', grade: 0 })],
      progress: {
        p1: {
          topics: {
            'add-sub-20': {
              level: 3,
              attempts: 10,
              correct: 7,
              lastPracticedAt: 1_700_000_100_000,
              recent: [true, false, true],
              mistakes: { wrongOperation: 2, offByOne: 1 },
              completedLevels: [1, 2],
              reviewPassed: false,
            },
          },
          streak: { count: 3, lastDay: '2026-10-15' },
        },
      },
      parent: { pin: { salt: 'abc', hash: 'def' } },
    });
    const result = parseAppData(clone(data));
    expect(result).toEqual({ ok: true, data });
  });

  it('migrates a version 1 document (no stations, no streak) to the current schema', () => {
    const v1 = {
      schemaVersion: 1,
      profiles: [makeProfile()],
      progress: {
        p1: {
          topics: {
            'add-sub-20': {
              level: 8,
              attempts: 4,
              correct: 4,
              lastPracticedAt: 5,
              recent: [true, true, true, true],
              mistakes: {},
            },
          },
        },
      },
      parent: { pin: null },
      meta: { createdAt: 1, lastBackupAt: null },
    };
    const result = parseAppData(v1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result.data.progress['p1']?.streak).toEqual({ count: 0, lastDay: null });
    expect(result.data.progress['p1']?.topics['add-sub-20']).toMatchObject({
      level: 8,
      completedLevels: [],
      reviewPassed: false,
    });
  });

  it('rejects malformed stations and streaks', () => {
    const base: Record<string, unknown> = {
      level: 1,
      attempts: 0,
      correct: 0,
      lastPracticedAt: 0,
      recent: [],
      mistakes: {},
      completedLevels: [],
      reviewPassed: false,
    };
    const withTopic = (extra: Record<string, unknown>, streak?: unknown) =>
      parseAppData(
        makeData({
          profiles: [makeProfile()],
          progress: {
            p1: {
              topics: { t: { ...base, ...extra } },
              ...(streak === undefined ? {} : { streak }),
            } as never,
          },
        }),
      );
    expect(withTopic({ completedLevels: [0] }).ok).toBe(false);
    expect(withTopic({ completedLevels: 'x' }).ok).toBe(false);
    expect(withTopic({ reviewPassed: 1 }).ok).toBe(false);
    expect(withTopic({}, { count: 1, lastDay: 'yesterday' }).ok).toBe(false);
    expect(withTopic({}, { count: -1, lastDay: null }).ok).toBe(false);
    // Duplicates are tolerated and collapsed.
    const dup = withTopic({ completedLevels: [3, 1, 3] });
    expect(dup.ok && dup.data.progress['p1']?.topics['t']?.completedLevels).toEqual([1, 3]);
  });

  it('trims names', () => {
    const result = parseAppData(makeData({ profiles: [makeProfile({ name: '  נועה  ' })] }));
    expect(result.ok && result.data.profiles[0]?.name).toBe('נועה');
  });

  it.each([
    ['not an object', 'hello'],
    ['wrong schema version', { ...makeData(), schemaVersion: 99 }],
    ['profiles missing', { ...makeData(), profiles: undefined }],
    ['empty name', makeData({ profiles: [makeProfile({ name: '   ' })] })],
    ['name too long', makeData({ profiles: [makeProfile({ name: 'א'.repeat(21) })] })],
    ['unknown avatar', makeData({ profiles: [{ ...makeProfile(), avatar: 'dragon' as 'fox' }] })],
    ['grade out of range', makeData({ profiles: [{ ...makeProfile(), grade: 7 as 6 }] })],
    ['bad gender', makeData({ profiles: [{ ...makeProfile(), gender: 'x' as 'f' }] })],
    ['duplicate ids', makeData({ profiles: [makeProfile(), makeProfile({ name: 'אחרת' })] })],
    [
      'too many profiles',
      makeData({
        profiles: Array.from({ length: MAX_PROFILES + 1 }, (_, i) => makeProfile({ id: `p${i}` })),
      }),
    ],
    [
      'correct > attempts',
      makeData({
        profiles: [makeProfile()],
        progress: {
          p1: {
            topics: {
              t: {
                level: 1,
                attempts: 2,
                correct: 3,
                lastPracticedAt: 0,
                recent: [],
                mistakes: {},
              },
            },
          },
        },
      }),
    ],
  ])('rejects: %s', (_label, value) => {
    const result = parseAppData(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });

  it('drops progress for profiles that do not exist', () => {
    const data = makeData({
      profiles: [makeProfile()],
      progress: { ghost: emptyProgress(), p1: emptyProgress() },
    });
    const result = parseAppData(data);
    expect(result.ok && Object.keys(result.data.progress)).toEqual(['p1']);
  });

  it('keeps only the most recent results window', () => {
    const data = makeData({
      profiles: [makeProfile()],
      progress: {
        p1: {
          topics: {
            t: {
              level: 1,
              attempts: 30,
              correct: 30,
              lastPracticedAt: 0,
              recent: Array.from({ length: 30 }, () => true),
              mistakes: {},
              completedLevels: [],
              reviewPassed: false,
            },
          },
          streak: { count: 0, lastDay: null },
        },
      },
    });
    const result = parseAppData(data);
    expect(result.ok && result.data.progress['p1']?.topics['t']?.recent.length).toBe(RECENT_WINDOW);
  });
});

describe('parseBackup', () => {
  it('requires the backup envelope', () => {
    expect(parseBackup(makeData()).ok).toBe(false);
    expect(parseBackup({ app: 'other', kind: 'backup', data: makeData() }).ok).toBe(false);
    expect(parseBackup({ app: 'heshbon', kind: 'backup', data: makeData() }).ok).toBe(true);
  });
});
