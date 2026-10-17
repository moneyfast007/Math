import { describe, expect, it } from 'vitest';
import { MAX_PROFILES, RECENT_WINDOW } from './schema';
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
            },
          },
        },
      },
      parent: { pin: { salt: 'abc', hash: 'def' } },
    });
    const result = parseAppData(clone(data));
    expect(result).toEqual({ ok: true, data });
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
    [
      'duplicate ids',
      makeData({ profiles: [makeProfile(), makeProfile({ name: 'אחרת' })] }),
    ],
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
              t: { level: 1, attempts: 2, correct: 3, lastPracticedAt: 0, recent: [], mistakes: {} },
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
      progress: { ghost: { topics: {} }, p1: { topics: {} } },
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
            },
          },
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
