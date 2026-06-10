import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { ensureCurrentSeason, getLeaderboard, getLeaderboardRank, getOrCreatePlayerSeason } from "@/lib/player";
import { getSeasonTimeline } from "@/lib/seasons";
import { getSessionUserId } from "@/lib/auth";
import { authenticateClient } from "@/lib/client-auth";
import { getCsrepTrustBatch } from "@/lib/csrep";
import { csrepTrustToJson } from "@/lib/csrep-types";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eloToLevel, MAX_LEVEL, PLACEMENT_GAMES } from "@/lib/elo";
import { jsonOk } from "@/lib/api";

function parseLevel(param: string | null): number | null {
  if (!param || param === "all" || param === "overall") return null;
  const n = Number(param);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(MAX_LEVEL, n));
}

export async function GET(req: NextRequest) {
  const level = parseLevel(req.nextUrl.searchParams.get("level"));
  const season = await ensureCurrentSeason();
  const timeline = getSeasonTimeline(season);
  const rows = await getLeaderboard(season.id, level);
  const csrepMap = await getCsrepTrustBatch(
    rows.map((row) => row.steamId).filter(Boolean) as string[]
  );

  const players = rows.map((row) => ({
    ...row,
    csrep: row.steamId ? csrepTrustToJson(csrepMap.get(row.steamId) ?? null) : null,
  }));

  const userId =
    (await getSessionUserId()) ??
    (await authenticateClient(req.headers.get("authorization"), {
      requireSteam: false,
    }))?.userId ??
    null;
  let viewer: {
    username: string;
    level: number;
    rank: number | null;
    rankAtLevel: number | null;
    inList: boolean;
  } | null = null;

  if (userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (user) {
      const ps = await getOrCreatePlayerSeason(user.id, season.id);
      const playerLevel = eloToLevel(ps.elo);
      const isPlaced = ps.placementGames >= PLACEMENT_GAMES;

      const rankOverall = isPlaced
        ? await getLeaderboardRank(season.id, user.id, null)
        : null;
      const rankAtLevel = isPlaced
        ? await getLeaderboardRank(season.id, user.id, playerLevel)
        : null;

      const activeRank =
        level != null ? rankAtLevel : rankOverall;

      viewer = {
        username: user.username,
        level: playerLevel,
        rank: rankOverall,
        rankAtLevel,
        inList: activeRank != null && players.some((p) => p.username === user.username),
      };
    }
  }

  return jsonOk({
    season: season.number,
    level,
    isLocked: timeline.isLocked,
    players,
    viewer,
  });
}
