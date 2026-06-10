import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/auth";
import {
  ensureCurrentSeason,
  getOrCreatePlayerSeason,
  kdRatio,
} from "@/lib/player";
import { eloToLevel, PLACEMENT_GAMES } from "@/lib/elo";

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return null;

  const season = await ensureCurrentSeason();
  const playerSeason = await getOrCreatePlayerSeason(user.id, season.id);

  return {
    id: user.id,
    username: user.username,
    email: user.email ?? "",
    emailVerified: user.emailVerified,
    isAdmin: user.isAdmin,
    steamId: user.steamId,
    steamName: user.steamName,
    steamAvatar: user.steamAvatar,
    clientId: user.id,
    season: {
      number: season.number,
      startsAt: season.startsAt,
      endsAt: season.endsAt,
    },
    stats: {
      elo: playerSeason.elo,
      level: eloToLevel(playerSeason.elo),
      placementGames: playerSeason.placementGames,
      placementsRemaining: Math.max(
        0,
        PLACEMENT_GAMES - playerSeason.placementGames
      ),
      isPlacing: playerSeason.placementGames < PLACEMENT_GAMES,
      wins: playerSeason.wins,
      losses: playerSeason.losses,
      kills: playerSeason.kills,
      deaths: playerSeason.deaths,
      assists: playerSeason.assists,
      headshots: playerSeason.headshots,
      mvps: playerSeason.mvps,
      damage: playerSeason.damage,
      matchesPlayed: playerSeason.matchesPlayed,
      kd: kdRatio(playerSeason.kills, playerSeason.deaths),
    },
  };
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
