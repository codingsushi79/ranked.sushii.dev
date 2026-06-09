import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eloToLevel, PLACEMENT_GAMES } from "@/lib/elo";
import { listRecentMatchesForUser } from "@/lib/matches";
import {
  ensureCurrentSeason,
  getOrCreatePlayerSeason,
  kdRatio,
} from "@/lib/player";
import { formatSeasonRange } from "@/lib/dates";
import { getCsrepTrust } from "@/lib/csrep";
import { csrepTrustToJson } from "@/lib/csrep-types";

export async function getClientProfile(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return null;

  const season = await ensureCurrentSeason();
  const ps = await getOrCreatePlayerSeason(user.id, season.id);
  const recentMatches = await listRecentMatchesForUser(user.id, 10);
  const csrep = user.steamId
    ? csrepTrustToJson(await getCsrepTrust(user.steamId))
    : null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    isAdmin: user.isAdmin,
    steamId: user.steamId,
    steamName: user.steamName,
    steamAvatar: user.steamAvatar,
    clientId: user.id,
    season: {
      number: season.number,
      startsAt: season.startsAt.toISOString(),
      endsAt: season.endsAt.toISOString(),
      label: formatSeasonRange(season.startsAt, season.endsAt),
    },
    stats: {
      elo: ps.elo,
      level: eloToLevel(ps.elo),
      placementGames: ps.placementGames,
      placementsRemaining: Math.max(0, PLACEMENT_GAMES - ps.placementGames),
      isPlacing: ps.placementGames < PLACEMENT_GAMES,
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
    recentMatches: recentMatches.map((m) => ({
      ...m,
      playedAt: m.playedAt.toISOString(),
    })),
    csrep,
    canPlay: user.emailVerified && !!user.steamId,
  };
}
