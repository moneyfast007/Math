import { useEffect, useState } from 'react';

/**
 * The stations finished since the map was last seen: their houses are built in
 * front of her (workers, two seconds) the first time the map shows them done.
 * Remembered on this device, per child and world; the very first look records
 * what is there without building anything.
 */

const PREFIX = 'plusi:built:';
const BUILD_MS = 2400;

function read(key: string): number[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((n): n is number => typeof n === 'number') : null;
  } catch {
    return [];
  }
}

function write(key: string, levels: readonly number[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(levels));
  } catch {
    // Without storage nothing is built in front of her; the houses are there all the same.
  }
}

export function useJustBuilt(
  profileId: string,
  topicId: string,
  done: readonly number[],
): ReadonlySet<number> {
  const key = `${PREFIX}${profileId}:${topicId}`;
  const [building, setBuilding] = useState<ReadonlySet<number>>(() => {
    const seen = read(key);
    if (seen === null) return new Set();
    return new Set(done.filter((l) => !seen.includes(l)));
  });
  const doneKey = done.join(',');
  useEffect(() => {
    write(key, done);
    if (building.size === 0) return;
    const id = window.setTimeout(() => setBuilding(new Set()), BUILD_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, doneKey]);
  return building;
}
