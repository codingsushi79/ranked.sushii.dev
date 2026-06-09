import { NextRequest } from "next/server";
import { ensureCurrentSeason } from "@/lib/player";
import { getSeasonTimeline } from "@/lib/seasons";
import { jsonOk } from "@/lib/api";

export async function GET(_req: NextRequest) {
  const season = await ensureCurrentSeason();
  const timeline = getSeasonTimeline(season);

  return jsonOk({
    season: season.number,
    phase: timeline.phase,
    isLocked: timeline.isLocked,
    lockStartsAt: timeline.lockStartsAt.toISOString(),
    gameDayStartsAt: timeline.gameDayStartsAt.toISOString(),
    resultsDayStartsAt: timeline.resultsDayStartsAt.toISOString(),
    seasonEndsAt: timeline.seasonEndsAt.toISOString(),
    msUntilLock: timeline.msUntilLock,
    msUntilSeasonEnd: timeline.msUntilSeasonEnd,
  });
}
