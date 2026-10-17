/**
 * Geometry of the journey map, kept apart from the screen so it can be unit-tested
 * and so the screen file exports only components.
 */

export interface Point {
  x: number;
  y: number;
}

/** Positions on a 100-wide map: a snake from bottom to top, right to left first (RTL). */
export function layoutStations(count: number, perRow: number): { points: Point[]; height: number } {
  const rows = Math.ceil(count / perRow);
  // Rows are closer than columns: the map must fit above the big button on a tablet.
  const rowGap = (100 / perRow) * 0.62;
  const height = rows * rowGap + rowGap * 0.4;
  const xs = Array.from({ length: perRow }, (_, i) => 100 - (100 / (perRow * 2)) * (2 * i + 1));
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const x = row % 2 === 0 ? xs[col] : xs[perRow - 1 - col];
    // Every other column sits a little higher, so the path meanders instead of boxing.
    const y = height - rowGap * 0.7 - row * rowGap - (col % 2 === 1 ? rowGap * 0.22 : 0);
    points.push({ x: x ?? 50, y });
  }
  return { points, height };
}

/** The path through the points: straight hops, rounded by the stroke's line join. */
export function pathThrough(points: readonly Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
}
