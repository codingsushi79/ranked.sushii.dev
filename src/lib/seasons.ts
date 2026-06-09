import { addMonths, startOfMonth } from "./dates";

/** Season 1 starts May 2026 — each season is 4 months. */
const SEASON_EPOCH = new Date("2026-05-01T00:00:00Z");
const SEASON_MONTHS = 4;

export const FINALE_LOCK_DAYS = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type SeasonPhase =
  | "regular"
  | "lock_day1"
  | "lock_day2"
  | "lock_day3"
  | "between_seasons";

export function getCurrentSeasonInfo(now = new Date()) {
  const epochStart = startOfMonth(SEASON_EPOCH);
  const monthsSince =
    (now.getUTCFullYear() - epochStart.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - epochStart.getUTCMonth());
  const seasonNumber = Math.floor(monthsSince / SEASON_MONTHS) + 1;
  const seasonStart = addMonths(epochStart, (seasonNumber - 1) * SEASON_MONTHS);
  const seasonEnd = addMonths(seasonStart, SEASON_MONTHS);

  return {
    number: seasonNumber,
    startsAt: seasonStart,
    endsAt: seasonEnd,
  };
}

export function getSeasonTimeline(
  season: { startsAt: Date; endsAt: Date },
  now = new Date()
) {
  const lockStartsAt = new Date(
    season.endsAt.getTime() - FINALE_LOCK_DAYS * MS_PER_DAY
  );
  const gameDayStartsAt = new Date(
    season.endsAt.getTime() - 2 * MS_PER_DAY
  );
  const resultsDayStartsAt = new Date(
    season.endsAt.getTime() - MS_PER_DAY
  );

  let phase: SeasonPhase;
  if (now < lockStartsAt) phase = "regular";
  else if (now < gameDayStartsAt) phase = "lock_day1";
  else if (now < resultsDayStartsAt) phase = "lock_day2";
  else if (now < season.endsAt) phase = "lock_day3";
  else phase = "between_seasons";

  return {
    phase,
    lockStartsAt,
    gameDayStartsAt,
    resultsDayStartsAt,
    seasonEndsAt: season.endsAt,
    isLocked: phase !== "regular" && phase !== "between_seasons",
    msUntilLock: Math.max(0, lockStartsAt.getTime() - now.getTime()),
    msUntilSeasonEnd: Math.max(0, season.endsAt.getTime() - now.getTime()),
  };
}
