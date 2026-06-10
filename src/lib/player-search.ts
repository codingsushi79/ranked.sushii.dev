import { eq, or, ilike, and } from "drizzle-orm";
import { db } from "@/db";
import { users, playerSeasons } from "@/db/schema";
import { ensureCurrentSeason } from "@/lib/player";
import { eloToLevel } from "@/lib/elo";

export async function searchPlayers(query: string, limit = 8) {
  const q = query.trim();
  if (q.length < 2) return [];

  const pattern = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const season = await ensureCurrentSeason();

  const rows = await db
    .select({
      username: users.username,
      steamName: users.steamName,
      steamAvatar: users.steamAvatar,
      isAdmin: users.isAdmin,
      elo: playerSeasons.elo,
    })
    .from(users)
    .leftJoin(
      playerSeasons,
      and(
        eq(playerSeasons.userId, users.id),
        eq(playerSeasons.seasonId, season.id)
      )
    )
    .where(
      and(
        eq(users.emailVerified, true),
        or(ilike(users.username, pattern), ilike(users.steamName, pattern))
      )
    )
    .limit(limit);

  return rows.map((row) => ({
    username: row.username,
    steamName: row.steamName,
    steamAvatar: row.steamAvatar,
    isAdmin: row.isAdmin,
    elo: row.elo ?? 1000,
    level: eloToLevel(row.elo ?? 1000),
  }));
}
