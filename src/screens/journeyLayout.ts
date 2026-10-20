/**
 * Geometry of the journey map, kept apart from the screen so it can be unit-tested
 * and so the screen file exports only components.
 */

export interface Point {
  x: number;
  y: number;
}

export interface StationLayout {
  points: Point[];
  /** Height of the map, in the units of its 100-wide box. */
  height: number;
  /** Distance between two rows, in the same units. */
  rowGap: number;
}

/** Rows sit closer than columns; a fit may stretch or squeeze them within this range. */
const ROW_NATURAL = 0.62;
const ROW_MIN = 0.45;
const ROW_MAX = 0.9;
/** Room under the first row, and above the last one (where Plusi stands beside a station). */
const ROOM_BOTTOM = 0.4;
const ROOM_TOP = 0.4;

/**
 * Positions on a 100-wide map: a snake from bottom to top, right to left first (RTL).
 *
 * `fitHeight` is the height the map may take (in the same units: the box's
 * height over its width, times 100). The rows then spread or close up to fill
 * it, within limits; without it they keep their natural spacing.
 */
export function layoutStations(count: number, perRow: number, fitHeight?: number): StationLayout {
  const rows = Math.max(1, Math.ceil(count / perRow));
  const colWidth = 100 / perRow;
  const spans = rows + ROOM_BOTTOM + ROOM_TOP;
  const rowGap =
    fitHeight === undefined
      ? colWidth * ROW_NATURAL
      : Math.min(colWidth * ROW_MAX, Math.max(colWidth * ROW_MIN, fitHeight / spans));
  const height = spans * rowGap;
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
  return { points, height, rowGap };
}

export interface FittedMap extends StationLayout {
  perRow: number;
  /** The map's width on the screen, px (its height is `width * height / 100`). */
  width: number;
  /** Room for one station, px: the smaller of the column width and the row gap. */
  cell: number;
}

/** The widest a map gets, px: beyond it the stations would only drift apart. */
const MAP_MAX_WIDTH = 680;

/**
 * The layout that fits the stations into a box of the screen (px), as large as
 * possible: how many stations per row, and how wide the map is. A phone's
 * short box gets more stations per row; a tall one keeps the usual snake.
 */
export function fitStations(
  count: number,
  box: { width: number; height: number },
  young: boolean,
): FittedMap {
  const preferred = young ? 4 : 3;
  const boxWidth = Math.min(box.width, MAP_MAX_WIDTH);
  const candidates = young ? [3, 4, 5] : [3, 4, 5, 6];
  let best: FittedMap | undefined;
  let bestScore = -1;
  for (const perRow of candidates) {
    if (perRow > Math.max(count, 3)) continue;
    const layout = layoutStations(count, perRow, (box.height / boxWidth) * 100);
    const width = Math.max(0, Math.min(boxWidth, (box.height * 100) / layout.height));
    const cell = Math.min(width / perRow, (layout.rowGap * width) / 100);
    // The usual snake wins a near tie: the path reads best with fewer turns.
    const score = cell * (perRow === preferred ? 1.08 : 1);
    if (score > bestScore) {
      bestScore = score;
      best = { ...layout, perRow, width, cell };
    }
  }
  if (best) return best;
  const layout = layoutStations(count, preferred);
  return { ...layout, perRow: preferred, width: boxWidth, cell: boxWidth / preferred };
}

/** The path through the points: straight hops, rounded by the stroke's line join. */
export function pathThrough(points: readonly Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
}
