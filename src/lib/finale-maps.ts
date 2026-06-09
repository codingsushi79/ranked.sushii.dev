export const FINALE_MAP_POOL = [
  "de_ancient",
  "de_anubis",
  "de_dust2",
  "de_inferno",
  "de_mirage",
  "de_nuke",
  "de_vertigo",
] as const;

export function formatFinaleMap(map: string): string {
  return map.replace(/^de_/i, "").replace(/_/g, " ");
}

export function getFinaleTeams(topPlayers: { rank: number; username: string; steamName: string | null; steamAvatar: string | null; userId: string; elo: number }[]) {
  const team0 = topPlayers.filter((p) => p.rank % 2 === 1);
  const team1 = topPlayers.filter((p) => p.rank % 2 === 0);
  return { team0, team1, captain0: topPlayers[0] ?? null, captain1: topPlayers[1] ?? null };
}

export function createInitialPickBan(): import("@/db/schema").PickBanState {
  return {
    mapPool: [...FINALE_MAP_POOL],
    bannedMaps: [],
    selectedMap: null,
    nextBanBy: 0,
  };
}

export function applyMapBan(
  pickBan: import("@/db/schema").PickBanState,
  map: string
): import("@/db/schema").PickBanState {
  if (pickBan.selectedMap) return pickBan;
  if (!pickBan.mapPool.includes(map) || pickBan.bannedMaps.includes(map)) {
    throw new Error("Invalid map ban");
  }

  const bannedMaps = [...pickBan.bannedMaps, map];
  const remaining = pickBan.mapPool.filter((m) => !bannedMaps.includes(m));

  if (remaining.length === 1) {
    return {
      ...pickBan,
      bannedMaps,
      selectedMap: remaining[0],
      nextBanBy: null,
    };
  }

  return {
    ...pickBan,
    bannedMaps,
    nextBanBy: pickBan.nextBanBy === 0 ? 1 : 0,
  };
}
