export const PLACEMENT_GAMES = 5;
export const STARTING_ELO = 1000;
export const MAX_LEVEL = 20;

/** Level thresholds: L1 0–100, L2 101–300, then +200 per level through L20 (3701–3900). */
export function eloToLevel(elo: number): number {
  if (elo <= 100) return 1;
  const level = Math.floor((elo - 101) / 200) + 2;
  return Math.min(level, MAX_LEVEL);
}

export function levelRange(level: number): { min: number; max: number } {
  if (level <= 1) return { min: 0, max: 100 };
  if (level >= MAX_LEVEL) {
    return { min: 101 + (MAX_LEVEL - 2) * 200, max: Infinity };
  }
  return {
    min: 101 + (level - 2) * 200,
    max: 100 + (level - 1) * 200,
  };
}

export function levelLabel(level: number): string {
  return `Level ${level}`;
}

/** Progress through the current level band (0–1). Level 20 is always 1. */
export function levelProgress(elo: number, level?: number): number {
  const lvl = level ?? eloToLevel(elo);
  if (lvl >= MAX_LEVEL) return 1;
  const { min, max } = levelRange(lvl);
  const span = max - min;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (elo - min) / span));
}

/** Ring color: green (low) → orange (mid) → red (high / L20). */
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
  const change = Math.round(k * (adjustedActual - expected));
  return Math.max(-50, Math.min(50, change));
}
