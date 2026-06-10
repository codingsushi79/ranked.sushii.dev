import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getPlayerProfileData } from "@/lib/player-profile";
import { csrepTrustToJson } from "@/lib/csrep-types";
import { playerLiveToJson } from "@/lib/player-live";

export async function getClientProfile(userId: string) {
  const profile = await getPlayerProfileData(userId);
  if (!profile) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true },
  });
  if (!user) return null;

  return {
    id: profile.id,
    username: profile.username,
    email: user.email ?? "",
    emailVerified: profile.emailVerified,
    isAdmin: profile.isAdmin,
    steamId: profile.steamId,
    steamName: profile.steamName,
    steamAvatar: profile.steamAvatar,
    clientId: profile.id,
    season: {
      number: profile.season.number,
      startsAt: profile.season.startsAt.toISOString(),
      endsAt: profile.season.endsAt.toISOString(),
      label: profile.season.label,
    },
    stats: profile.stats,
    recentMatches: profile.recentMatches.map((m) => ({
      ...m,
      playedAt: m.playedAt.toISOString(),
    })),
    csrep: csrepTrustToJson(profile.csrep),
    live: playerLiveToJson(profile.live),
    canPlay: !!profile.steamId,
  };
}
