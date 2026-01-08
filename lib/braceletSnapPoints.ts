export type SnapPoint = { x: number; y: number };

/**
 * Bracelet-specific snap points for charm placement.
 *
 * - Coordinates are in the preview's "design space": 800 (width) x 350 (height)
 * - (0,0) is top-left of the preview viewport.
 *
 * Add/adjust points per bracelet id here.
 */
export const BRACELET_SNAP_POINTS: Record<string, SnapPoint[]> = {
  // Example:
  // 'bracelet-1': [
  //   { x: 0, y: 80 },
  //   { x: 100, y: 140 },
  //   // ...
  // ],
};

/**
 * Fallback points used when a bracelet doesn't have a custom entry above.
 * These are the original defaults.
 */
export const DEFAULT_SNAP_POINTS: SnapPoint[] = [
  { x: 80, y: 155 }, // P1
  { x: 125, y: 185 }, // P1 alt
  { x: 175, y: 215 }, // P2
  { x: 230, y: 240 }, // P2 alt
  { x: 290, y: 255 }, // P3
  { x: 345, y: 265 }, // P3 alt
  { x: 400, y: 270 }, // P4
  { x: 455, y: 265 }, // P5 alt
  { x: 510, y: 255 }, // P5
  { x: 565, y: 240 }, // P6
  { x: 615, y: 215 }, // P6 alt
  { x: 670, y: 190 }, // P7 alt
  { x: 720, y: 155 }, // P7
];

export function getBraceletSnapPoints(braceletId: string | null | undefined): SnapPoint[] | null {
  if (!braceletId) return null;
  return BRACELET_SNAP_POINTS[braceletId] ?? null;
}


