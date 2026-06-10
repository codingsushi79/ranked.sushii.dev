import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { matches, matchPlayers, playerSeasons, users } from "@/db/schema";

export async function listAdminUsers(query?: string) {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      emailVerified: users.emailVerified,
      isAdmin: users.isAdmin,
      steamId: users.steamId,
      steamName: users.steamName,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100);

  if (!query) return rows;
  const q = query.toLowerCase();
  return rows.filter(
    (u) =>
      u.username.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.steamName?.toLowerCase().includes(q)
  );
}

export async function listAdminMatches(limit = 50) {
  return db
    .select({
      id: matches.id,
      externalId: matches.externalId,
      map: matches.map,
      mode: matches.mode,
      team0Score: matches.team0Score,
      team1Score: matches.team1Score,
      winnerTeam: matches.winnerTeam,
      createdAt: matches.createdAt,
      playerCount: sql<number>`(
        select count(*)::int from match_players mp where mp.match_id = ${matches.id}
      )`,
    })
    .from(matches)
    .orderBy(desc(matches.createdAt))
    .limit(limit);
}

export async function deleteMatchAndRevertStats(matchId: string) {
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });
  if (!match) return false;

  const players = await db.query.matchPlayers.findMany({
    where: eq(matchPlayers.matchId, matchId),
  });

  for (const mp of players) {
    const ps = await db.query.playerSeasons.findFirst({
      where: and(
        eq(playerSeasons.userId, mp.userId),
        eq(playerSeasons.seasonId, match.seasonId)
      ),
    });
    if (!ps) continue;

    await db
      .update(playerSeasons)
      .set({
        elo: mp.eloBefore,
        placementGames: Math.max(0, ps.placementGames - 1),
        wins: ps.wins - (mp.won ? 1 : 0),
        losses: ps.losses - (mp.won ? 0 : 1),
        kills: Math.max(0, ps.kills - mp.kills),
        deaths: Math.max(0, ps.deaths - mp.deaths),
        assists: Math.max(0, ps.assists - mp.assists),
        headshots: Math.max(0, ps.headshots - mp.headshots),
        mvps: Math.max(0, ps.mvps - mp.mvps),
        damage: Math.max(0, ps.damage - mp.damage),
        matchesPlayed: Math.max(0, ps.matchesPlayed - 1),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(playerSeasons.userId, mp.userId),
          eq(playerSeasons.seasonId, match.seasonId)
        )
      );
  }

  await db.delete(matchPlayers).where(eq(matchPlayers.matchId, matchId));
  await db.delete(matches).where(eq(matches.id, matchId));
  return true;
}

export async function updateUserAdmin(userId: string, isAdmin: boolean) {
  const [updated] = await db
    .update(users)
    .set({ isAdmin })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      username: users.username,
      isAdmin: users.isAdmin,
    });
  return updated ?? null;
}

export async function verifyUserEmail(userId: string) {
  const [updated] = await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.id, userId))
    .returning({ id: users.id, emailVerified: users.emailVerified });
  return updated ?? null;
}
