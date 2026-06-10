import { sql } from "drizzle-orm";
import { db } from "@/db";
import { matchPlayers, matches, playerSeasons } from "@/db/schema";
import { STARTING_ELO } from "@/lib/elo";

export async function resetAllRankedData() {
  await db.delete(matchPlayers);
  await db.delete(matches);

  const updated = await db
    .update(playerSeasons)
    .set({
      elo: STARTING_ELO,
      placementGames: 0,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      headshots: 0,
      mvps: 0,
      damage: 0,
      roundsPlayed: 0,
      matchesPlayed: 0,
      updatedAt: new Date(),
    })
    .returning({ id: playerSeasons.id });

  return {
    matchesDeleted: true,
    playerSeasonsReset: updated.length,
  };
}

export async function countRankedData() {
  const [matchCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matches);
  const [playerCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matchPlayers);
  const [seasonRows] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(playerSeasons);

  return {
    matches: matchCount?.count ?? 0,
    matchPlayers: playerCount?.count ?? 0,
    playerSeasons: seasonRows?.count ?? 0,
  };
}
