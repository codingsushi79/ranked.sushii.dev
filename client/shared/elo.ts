export const MAX_LEVEL = 5;

export const TOP_FINITE_ELO = 3700;
export const MAX_LEVEL_ELO_MIN = 3701;
export const LEVEL_BAND_WIDTH = TOP_FINITE_ELO / MAX_LEVEL;

export function eloToLevel(elo: number): number {
  if (elo >= MAX_LEVEL_ELO_MIN) return MAX_LEVEL;
  if (elo <= 0) return 1;
  return Math.min(MAX_LEVEL, Math.ceil(elo / LEVEL_BAND_WIDTH));
}

export function levelRange(level: number): { min: number; max: number } {
  const lvl = Math.max(1, Math.min(level, MAX_LEVEL));
  if (lvl >= MAX_LEVEL) {
    return { min: (MAX_LEVEL - 1) * LEVEL_BAND_WIDTH + 1, max: Infinity };
  }
  return {
    min: lvl === 1 ? 0 : (lvl - 1) * LEVEL_BAND_WIDTH + 1,
    max: lvl * LEVEL_BAND_WIDTH,
  };
}

export function levelProgress(elo: number, level?: number): number {
  const lvl = level ?? eloToLevel(elo);
  if (lvl >= MAX_LEVEL) return 1;
  const { min, max } = levelRange(lvl);
  const span = max - min;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (elo - min) / span));
}

export function levelRingColor(level: number): string {
  if (level >= MAX_LEVEL) return "#ef4444";
  const t = (level - 1) / (MAX_LEVEL - 1);
  const green = { r: 34, g: 197, b: 94 };
  const orange = { r: 245, g: 158, b: 11 };
  const red = { r: 239, g: 68, b: 68 };
  const lerp = (a: number, b: number, u: number) => Math.round(a + (b - a) * u);
  const mix = (c1: typeof green, c2: typeof green, u: number) =>
    `rgb(${lerp(c1.r, c2.r, u)}, ${lerp(c1.g, c2.g, u)}, ${lerp(c1.b, c2.b, u)})`;
  if (t <= 0.5) return mix(green, orange, t / 0.5);
  return mix(orange, red, (t - 0.5) / 0.5);
}

const LEVEL_RING_GAP_RATIO = 0.22;

/** SVG ring layout: gap centered at 6 o'clock, arc drawn clockwise from there. */
export function levelRingGeometry(size = 44, stroke = 6, innerInset = 3) {
  const r = (size - stroke) / 2 - innerInset;
  const c = 2 * Math.PI * r;
  const gap = c * LEVEL_RING_GAP_RATIO;
  const arc = c - gap;
  const rotation = 90 - ((arc + gap / 2) / c) * 360;
  return { size, stroke, r, c, gap, arc, rotation };
}
