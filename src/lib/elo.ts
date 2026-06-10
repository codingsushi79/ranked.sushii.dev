export const PLACEMENT_GAMES = 5;
export const STARTING_ELO = 1000;
export const MAX_LEVEL = 5;

/** Highest finite Elo in a bounded band; max level continues from MAX_LEVEL_ELO_MIN. */
export const TOP_FINITE_ELO = 3700;
export const MAX_LEVEL_ELO_MIN = 3701;
export const LEVEL_BAND_WIDTH = TOP_FINITE_ELO / MAX_LEVEL;

/** Level thresholds: five equal bands of 740 Elo (0–3700), then 3701+ at level 5. */
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

export function levelLabel(level: number): string {
  return `Level ${level}`;
}

/** Progress through the current level band (0–1). Max level is always 1. */
export function levelProgress(elo: number, level?: number): number {
  const lvl = level ?? eloToLevel(elo);
  if (lvl >= MAX_LEVEL) return 1;
  const { min, max } = levelRange(lvl);
  const span = max - min;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (elo - min) / span));
}

/** Ring color: green (low) → orange (mid) → red (high / max level). */
export function levelRingColor(level: number): string {
  if (level >= MAX_LEVEL) return "#ef4444";
  const t = (level - 1) / (MAX_LEVEL - 1);
  const green = { r: 34, g: 197, b: 94 };
  const orange = { r: 245, g: 158, b: 11 };
  const red = { r: 239, g: 68, b: 68 };
  const lerp = (a: number, b: number, u: number) => Math.round(a + (b - a) * u);
  const mix = (
    c1: typeof green,
    c2: typeof green,
    u: number
  ) => `rgb(${lerp(c1.r, c2.r, u)}, ${lerp(c1.g, c2.g, u)}, ${lerp(c1.b, c2.b, u)})`;
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

/** Expected win probability from team vs enemy average ELO (standard Elo). */
export function expectedScore(teamElo: number, enemyElo: number): number {
  return 1 / (1 + Math.pow(10, (enemyElo - teamElo) / 400));
}

/** K-factor: higher during placements, lower at high ELO to slow rank inflation. */
export function kFactor(elo: number, placementGames: number): number {
  if (placementGames < PLACEMENT_GAMES) return 40;
  if (elo < 1500) return 28;
  if (elo < 2500) return 24;
  if (elo < 3500) return 20;
  return 16;
}

/** Performance modifier from individual stats (−0.15 to +0.15 on actual score). */
export function performanceModifier(stats: {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
}): number {
  const kd = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;
  const kdMod = Math.max(-0.08, Math.min(0.08, (kd - 1) * 0.04));
  const adrMod = Math.max(-0.07, Math.min(0.07, (stats.adr - 80) / 400));
  return kdMod + adrMod;
}

export function calculateEloChange(params: {
  playerElo: number;
  teamAvgElo: number;
  enemyAvgElo: number;
  won: boolean;
  placementGames: number;
  stats: { kills: number; deaths: number; assists: number; adr: number };
}): number {
  const k = kFactor(params.playerElo, params.placementGames);
  const expected = expectedScore(params.teamAvgElo, params.enemyAvgElo);
  const actual = params.won ? 1 : 0;
  const perf = performanceModifier(params.stats);
  const adjustedActual = Math.max(0, Math.min(1, actual + perf));
  let change = Math.round(k * (adjustedActual - expected));
  change = Math.max(-50, Math.min(50, change));
  if (params.won) change = Math.max(0, change);
  return change;
}
