/**
 * The colour of Plusi that goes with one child everywhere on her side of the app
 * (journey, practice, album, all worlds). The usual colour (the age band's) and two
 * more are open from the start; the others open one by one with the star medals.
 * Logo, entry screen and parents' area keep the app's own colour.
 */
export const PLUSI_COLORS = [
  { id: 'usual', color: null, medals: 0 },
  { id: 'pink', color: '#d9548f', medals: 0 },
  { id: 'blue', color: '#2e7fd1', medals: 0 },
  { id: 'green', color: '#3f9a4a', medals: 1 },
  { id: 'purple', color: '#7a52c7', medals: 2 },
  { id: 'red', color: '#d6453d', medals: 3 },
  { id: 'gold', color: '#e0a21a', medals: 4 },
  { id: 'navy', color: '#2c3e7a', medals: 5 },
] as const;

export type PlusiColorId = (typeof PLUSI_COLORS)[number]['id'];

export function isPlusiColor(value: unknown): value is PlusiColorId {
  return PLUSI_COLORS.some((c) => c.id === value);
}

/** The CSS colour of a choice ('usual': the age band's accent). */
export function plusiCss(id: PlusiColorId | undefined): string {
  return PLUSI_COLORS.find((c) => c.id === id)?.color ?? 'var(--color-accent)';
}

/** Applies the child's colour to the document (every Plusi on her screens takes it). */
export function applyPlusiColor(id: PlusiColorId | undefined): void {
  const root = document.documentElement.style;
  if (id === undefined || id === 'usual') root.removeProperty('--plusi-color');
  else root.setProperty('--plusi-color', plusiCss(id));
}
