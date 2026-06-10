import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getPlayerProfileData } from "@/lib/player-profile";
import { csrepTrustToJson } from "@/lib/csrep-types";
import { playerLiveToJson } from "@/lib/player-live";
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

  const profile = await getPlayerProfileData(user.id);
  if (!profile) return jsonError("Player not found", 404);

  return jsonOk({
    username: profile.username,
    steamName: profile.steamName,
    steamAvatar: profile.steamAvatar,
    steamId: profile.steamId,
    season: profile.season.number,
    stats: profile.stats,
    csrep: csrepTrustToJson(profile.csrep),
    live: playerLiveToJson(profile.live),
    recentMatches: profile.recentMatches.map((m) => ({
      matchId: m.matchId,
      map: m.map,
      mode: m.mode,
      kills: m.kills,
      deaths: m.deaths,
      assists: m.assists,
      eloChange: m.eloChange,
      won: m.won,
      team0Score: m.team0Score,
      team1Score: m.team1Score,
      demoShareCode: m.demoShareCode,
      demoUrl: m.demoUrl,
      playedAt: m.playedAt.toISOString(),
    })),
  });
}
