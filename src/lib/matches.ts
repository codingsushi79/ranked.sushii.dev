import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  matches,
  matchPlayers,
  users,
  seasons,
  type ScoreboardEntry,
} from "@/db/schema";
import { buildDemoLinks } from "@/lib/demo";
import { kdRatio } from "@/lib/player";

export async function getMatchDetail(matchId: string) {
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });
  if (!match) return null;

  const season = await db.query.seasons.findFirst({
    where: eq(seasons.id, match.seasonId),
  });

  const rankedRows = await db
    .select({
      userId: users.id,
      username: users.username,
      steamName: users.steamName,
      steamAvatar: users.steamAvatar,
      steamId: users.steamId,
      isAdmin: users.isAdmin,
      team: matchPlayers.team,
      kills: matchPlayers.kills,
      deaths: matchPlayers.deaths,
      assists: matchPlayers.assists,
      headshots: matchPlayers.headshots,
      mvps: matchPlayers.mvps,
      damage: matchPlayers.damage,
      adr: matchPlayers.adr,
      eloBefore: matchPlayers.eloBefore,
      eloAfter: matchPlayers.eloAfter,
      eloChange: matchPlayers.eloChange,
      won: matchPlayers.won,
    })
    .from(matchPlayers)
    .innerJoin(users, eq(matchPlayers.userId, users.id))
    .where(eq(matchPlayers.matchId, matchId));

  const scoreboard: ScoreboardEntry[] =
    match.scoreboard ??
    rankedRows.map((r) => ({
      steamId: r.steamId ?? undefined,
      username: r.username,
      displayName: r.steamName ?? r.username,
      team: r.team,
      kills: r.kills,
      deaths: r.deaths,
      assists: r.assists,
      headshots: r.headshots,
      mvps: r.mvps,
      damage: r.damage,
      adr: r.adr,
    }));

  const enriched = scoreboard.map((entry) => {
    const ranked = rankedRows.find(
      (r) =>
        (entry.username && r.username === entry.username) ||
        (entry.steamId && r.steamId === entry.steamId)
    );
    return {
      ...entry,
      displayName:
        entry.displayName ?? ranked?.steamName ?? entry.username ?? "Player",
      username: entry.username ?? ranked?.username,
      steamAvatar: ranked?.steamAvatar ?? null,
      isAdmin: ranked?.isAdmin ?? false,
      kd: kdRatio(entry.kills, entry.deaths),
      eloChange: ranked?.eloChange ?? null,
      eloBefore: ranked?.eloBefore ?? null,
      eloAfter: ranked?.eloAfter ?? null,
      isRanked: !!ranked,
    };
  });

  const team0 = enriched.filter((p) => p.team === 0);
  const team1 = enriched.filter((p) => p.team === 1);

  return {
    id: match.id,
    externalId: match.externalId,
    map: match.map,
    mode: match.mode,
    winnerTeam: match.winnerTeam,
    team0Score: match.team0Score,
    team1Score: match.team1Score,
    playedAt: match.createdAt,
    season: season?.number ?? null,
    demo: buildDemoLinks(match.demoShareCode),
    demoUrl: match.demoUrl,
    team0,
    team1,
    rankedPlayers: rankedRows,
  };
}

export type MatchDetail = NonNullable<Awaited<ReturnType<typeof getMatchDetail>>>;

export async function listRecentMatchesForUser(userId: string, limit = 10) {
  return db
    .select({
      matchId: matches.id,
      map: matches.map,
      mode: matches.mode,
      kills: matchPlayers.kills,
      deaths: matchPlayers.deaths,
      assists: matchPlayers.assists,
      eloChange: matchPlayers.eloChange,
      won: matchPlayers.won,
      team0Score: matches.team0Score,
      team1Score: matches.team1Score,
      playedAt: matches.createdAt,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(eq(matchPlayers.userId, userId))
    .orderBy(desc(matches.createdAt))
    .limit(limit);
}
