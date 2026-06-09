import { eq, and, desc, sql, gte, lte, gt } from "drizzle-orm";
import { db } from "@/db";
import {
  seasons,
  playerSeasons,
  users,
  type Season,
} from "@/db/schema";
import { getCurrentSeasonInfo } from "./seasons";
import { eloToLevel, levelRange, STARTING_ELO } from "./elo";

const PLACED = sql`${playerSeasons.placementGames} >= 5`;

function levelEloBounds(level: number) {
  if (level === 20) {
    return { min: 101 + 18 * 200, max: 999999 };
  }
  const { min, max } = levelRange(level);
  return { min, max: max === Infinity ? 999999 : max };
}

export async function ensureCurrentSeason(): Promise<Season> {
  const info = getCurrentSeasonInfo();
  const existing = await db.query.seasons.findFirst({
    where: eq(seasons.number, info.number),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(seasons)
    .values({
      number: info.number,
      startsAt: info.startsAt,
      endsAt: info.endsAt,
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const fallback = await db.query.seasons.findFirst({
    where: eq(seasons.number, info.number),
  });
  if (!fallback) throw new Error("Failed to ensure season");
  return fallback;
}

export async function getOrCreatePlayerSeason(userId: string, seasonId: string) {
  const existing = await db.query.playerSeasons.findFirst({
    where: and(
      eq(playerSeasons.userId, userId),
      eq(playerSeasons.seasonId, seasonId)
    ),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(playerSeasons)
    .values({
      userId,
      seasonId,
      elo: STARTING_ELO,
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const fallback = await db.query.playerSeasons.findFirst({
    where: and(
      eq(playerSeasons.userId, userId),
      eq(playerSeasons.seasonId, seasonId)
    ),
  });
  if (!fallback) throw new Error("Failed to create player season");
  return fallback;
}

export async function getLeaderboard(
  seasonId: string,
  level: number | null,
  limit = 100
) {
  const levelFilter =
    level != null
      ? (() => {
          const { min, max } = levelEloBounds(level);
          return and(gte(playerSeasons.elo, min), lte(playerSeasons.elo, max));
        })()
      : undefined;

  const rows = await db
    .select({
      userId: users.id,
      username: users.username,
      steamName: users.steamName,
      steamAvatar: users.steamAvatar,
      steamId: users.steamId,
      isAdmin: users.isAdmin,
      emailVerified: users.emailVerified,
      elo: playerSeasons.elo,
      wins: playerSeasons.wins,
      losses: playerSeasons.losses,
      kills: playerSeasons.kills,
      deaths: playerSeasons.deaths,
      assists: playerSeasons.assists,
      matchesPlayed: playerSeasons.matchesPlayed,
      placementGames: playerSeasons.placementGames,
    })
    .from(playerSeasons)
    .innerJoin(users, eq(playerSeasons.userId, users.id))
    .where(
      and(eq(playerSeasons.seasonId, seasonId), PLACED, levelFilter)
    )
    .orderBy(desc(playerSeasons.elo))
    .limit(limit);

  return rows.map((row, i) => ({
    rank: i + 1,
    ...row,
    level: eloToLevel(row.elo),
    kd: row.deaths > 0 ? row.kills / row.deaths : row.kills,
  }));
}

export async function getLeaderboardRank(
  seasonId: string,
  userId: string,
  level: number | null
): Promise<number | null> {
  const ps = await db.query.playerSeasons.findFirst({
    where: and(
      eq(playerSeasons.userId, userId),
      eq(playerSeasons.seasonId, seasonId)
    ),
  });
  if (!ps || ps.placementGames < 5) return null;

  if (level != null) {
    const { min, max } = levelEloBounds(level);
    if (ps.elo < min || ps.elo > max) return null;
  }

  const levelFilter =
    level != null
      ? (() => {
          const { min, max } = levelEloBounds(level);
          return and(gte(playerSeasons.elo, min), lte(playerSeasons.elo, max));
        })()
      : undefined;

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(playerSeasons)
    .where(
      and(
        eq(playerSeasons.seasonId, seasonId),
        PLACED,
        gt(playerSeasons.elo, ps.elo),
        levelFilter
      )
    );

  return (result?.count ?? 0) + 1;
}

export function kdRatio(kills: number, deaths: number): number {
  if (deaths === 0) return kills;
  return Math.round((kills / deaths) * 100) / 100;
}
