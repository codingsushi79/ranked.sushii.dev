import type { ScoreboardEntry } from "@/db/schema";

type RankedIdentity = {
  userId: string;
  username: string;
  steamId: string | null;
  steamName: string | null;
  team: number;
  kills: number;
  deaths: number;
  assists: number;
};

function mergeEntry(
  current: ScoreboardEntry | undefined,
  next: ScoreboardEntry
): ScoreboardEntry {
  if (!current) return next;
  const currentActivity = current.kills + current.deaths + current.assists;
  const nextActivity = next.kills + next.deaths + next.assists;
  const pickNext = nextActivity > currentActivity;
  const chosen = pickNext ? next : current;
  const other = pickNext ? current : next;
  return {
    ...chosen,
    username: chosen.username ?? other.username,
    displayName: chosen.displayName ?? other.displayName,
    headshots: Math.max(chosen.headshots ?? 0, other.headshots ?? 0),
    mvps: Math.max(chosen.mvps ?? 0, other.mvps ?? 0),
    damage: Math.max(chosen.damage ?? 0, other.damage ?? 0),
    adr: Math.max(chosen.adr ?? 0, other.adr ?? 0),
  };
}

/** Collapse duplicate GSI rows and drop unranked stat-clones of ranked players. */
export function normalizeScoreboard(
  scoreboard: ScoreboardEntry[],
  rankedRows: RankedIdentity[]
): ScoreboardEntry[] {
  const rankedSteamIds = new Set(
    rankedRows.map((row) => row.steamId).filter((id): id is string => !!id)
  );

  const bySteamId = new Map<string, ScoreboardEntry>();
  const unkeyed: ScoreboardEntry[] = [];

  for (const entry of scoreboard) {
    if (entry.steamId) {
      bySteamId.set(entry.steamId, mergeEntry(bySteamId.get(entry.steamId), entry));
    } else {
      unkeyed.push(entry);
    }
  }

  let entries = [...bySteamId.values(), ...unkeyed];

  entries = entries.filter((entry) => {
    if (entry.steamId && rankedSteamIds.has(entry.steamId)) return true;
    const cloneOfRanked = rankedRows.some(
      (ranked) =>
        ranked.team === entry.team &&
        ranked.kills === entry.kills &&
        ranked.deaths === entry.deaths &&
        ranked.assists === entry.assists
    );
    return !cloneOfRanked;
  });

  return entries;
}

export function matchesRankedEntry(
  entry: ScoreboardEntry,
  ranked: RankedIdentity
): boolean {
  if (entry.steamId && ranked.steamId && entry.steamId === ranked.steamId) {
    return true;
  }
  if (entry.username && entry.username === ranked.username) return true;
  if (
    entry.displayName &&
    ranked.steamName &&
    entry.displayName === ranked.steamName
  ) {
    return true;
  }
  return false;
}
