import { emptyAppData, type AppData, type Profile } from './schema';

/** Fixtures shared by unit tests. Not imported by app code. */
export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'p1',
    name: 'נועה',
    avatar: 'fox',
    grade: 2,
    gender: 'f',
    createdAt: 1_700_000_000_000,
    settings: { allowLevelChange: true },
    ...overrides,
  };
}

export function makeData(overrides: Partial<AppData> = {}): AppData {
  return { ...emptyAppData(1_700_000_000_000), ...overrides };
}
