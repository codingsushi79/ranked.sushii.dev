import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, playerSeasons, matchPlayers, matches } from "@/db/schema";
import { ensureCurrentSeason, getOrCreatePlayerSeason, kdRatio } from "@/lib/player";
import { eloToLevel, PLACEMENT_GAMES } from "@/lib/elo";
import { getCsrepTrust } from "@/lib/csrep";
import { csrepTrustToJson } from "@/lib/csrep-types";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (!user) return jsonError("Player not found", 404);

  const season = await ensureCurrentSeason();
  const ps = await getOrCreatePlayerSeason(user.id, season.id);

  const recentMatches = await db
    .select({
      map: matches.map,
      mode: matches.mode,
      kills: matchPlayers.kills,
      deaths: matchPlayers.deaths,
      assists: matchPlayers.assists,
      eloChange: matchPlayers.eloChange,
      won: matchPlayers.won,
      playedAt: matches.createdAt,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(eq(matchPlayers.userId, user.id))
    .orderBy(desc(matches.createdAt))
    .limit(10);

  const csrep = user.steamId ? csrepTrustToJson(await getCsrepTrust(user.steamId)) : null;

  return jsonOk({
    username: user.username,
    steamName: user.steamName,
    steamAvatar: user.steamAvatar,
    steamId: user.steamId,
    season: season.number,
    stats: {
      elo: ps.elo,
      level: eloToLevel(ps.elo),
      isPlacing: ps.placementGames < PLACEMENT_GAMES,
      placementsRemaining: Math.max(0, PLACEMENT_GAMES - ps.placementGames),
      wins: ps.wins,
      losses: ps.losses,
      kills: ps.kills,
      deaths: ps.deaths,
      assists: ps.assists,
      headshots: ps.headshots,
      mvps: ps.mvps,
      damage: ps.damage,
      matchesPlayed: ps.matchesPlayed,
      kd: kdRatio(ps.kills, ps.deaths),
      winRate:
        ps.wins + ps.losses > 0
          ? Math.round((ps.wins / (ps.wins + ps.losses)) * 100)
          : 0,
    },
    csrep,
    recentMatches,
  });
}
