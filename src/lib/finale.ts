import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, seasonFinale, type FinalePlayer, type FinalePhase } from "@/db/schema";
import { ensureCurrentSeason, getLeaderboard } from "@/lib/player";
import { getSeasonTimeline, type SeasonPhase } from "@/lib/seasons";
import {
  applyMapBan,
  createInitialPickBan,
  getFinaleTeams,
} from "@/lib/finale-maps";

function syncPhaseWithTimeline(
  dbPhase: FinalePhase,
  seasonPhase: SeasonPhase,
  hasSchedule: boolean
): FinalePhase {
  if (seasonPhase === "lock_day3") return "completed";
  if (seasonPhase === "lock_day2") {
    return hasSchedule ? "live" : dbPhase;
  }
  if (seasonPhase === "lock_day1") {
    if (dbPhase === "live" || dbPhase === "completed") return dbPhase;
    return hasSchedule ? "scheduled" : dbPhase;
  }
  return dbPhase;
}

export async function ensureSeasonFinale(seasonId: string) {
  const existing = await db.query.seasonFinale.findFirst({
    where: eq(seasonFinale.seasonId, seasonId),
  });
  if (existing) return existing;

  const topRows = await getLeaderboard(seasonId, null, 10);
  const topPlayers: FinalePlayer[] = topRows.map((row) => ({
    userId: row.userId,
    username: row.username,
    steamName: row.steamName,
    steamAvatar: row.steamAvatar,
    rank: row.rank,
    elo: row.elo,
  }));

  const [created] = await db
    .insert(seasonFinale)
    .values({
      seasonId,
      topPlayers,
      pickBan: createInitialPickBan(),
      team0Name: "Team Odds",
      team1Name: "Team Evens",
      phase: "pick_ban",
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const fallback = await db.query.seasonFinale.findFirst({
    where: eq(seasonFinale.seasonId, seasonId),
  });
  if (!fallback) throw new Error("Failed to ensure season finale");
  return fallback;
}

export async function getFinaleContext(userId: string | null) {
  const season = await ensureCurrentSeason();
  const timeline = getSeasonTimeline(season);

  if (!timeline.isLocked) {
    return {
      season,
      timeline,
      finale: null,
      access: {
        canView: false,
        isTopTen: false,
        isAdmin: false,
        isCaptain0: false,
        isCaptain1: false,
      },
    };
  }

  const finaleRow = await ensureSeasonFinale(season.id);
  const hasSchedule = !!(
    (finaleRow.map ?? finaleRow.pickBan.selectedMap) &&
    finaleRow.joinLink &&
    finaleRow.gameTime
  );
  const phase = syncPhaseWithTimeline(
    finaleRow.phase,
    timeline.phase,
    hasSchedule
  );

  let user: { id: string; username: string; isAdmin: boolean } | null = null;
  if (userId) {
    const u = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (u) user = { id: u.id, username: u.username, isAdmin: u.isAdmin };
  }

  const isTopTen = user
    ? finaleRow.topPlayers.some((p) => p.userId === user.id)
    : false;
  const isAdmin = user?.isAdmin ?? false;
  const captain0 = finaleRow.topPlayers[0] ?? null;
  const captain1 = finaleRow.topPlayers[1] ?? null;
  const isCaptain0 = user?.id === captain0?.userId;
  const isCaptain1 = user?.id === captain1?.userId;
  const { team0, team1 } = getFinaleTeams(finaleRow.topPlayers);

  return {
    season,
    timeline,
    finale: {
      ...finaleRow,
      phase,
      map: finaleRow.map ?? finaleRow.pickBan.selectedMap,
      team0,
      team1,
      captain0,
      captain1,
    },
    access: {
      canView: isTopTen || isAdmin,
      isTopTen,
      isAdmin,
      isCaptain0,
      isCaptain1,
    },
  };
}

export async function banFinaleMap(
  finaleId: string,
  map: string,
  actor: { isAdmin: boolean; isCaptain0: boolean; isCaptain1: boolean }
) {
  const finale = await db.query.seasonFinale.findFirst({
    where: eq(seasonFinale.id, finaleId),
  });
  if (!finale) throw new Error("Finale not found");
  if (finale.pickBan.selectedMap) throw new Error("Map already selected");

  const next = finale.pickBan.nextBanBy;
  if (!actor.isAdmin) {
    if (next === 0 && !actor.isCaptain0) throw new Error("Not your turn to ban");
    if (next === 1 && !actor.isCaptain1) throw new Error("Not your turn to ban");
  }

  const pickBan = applyMapBan(finale.pickBan, map);
  const selectedMap = pickBan.selectedMap;

  await db
    .update(seasonFinale)
    .set({
      pickBan,
      map: selectedMap ?? finale.map,
      updatedAt: new Date(),
    })
    .where(eq(seasonFinale.id, finaleId));

  return pickBan;
}

export async function updateFinaleTeamNames(
  finaleId: string,
  input: { team0Name?: string; team1Name?: string },
  actor: { isAdmin: boolean; isCaptain0: boolean; isCaptain1: boolean }
) {
  const updates: Partial<{ team0Name: string; team1Name: string }> = {};
  if (input.team0Name != null) {
    if (!actor.isAdmin && !actor.isCaptain0) throw new Error("Forbidden");
    updates.team0Name = input.team0Name.trim().slice(0, 32);
  }
  if (input.team1Name != null) {
    if (!actor.isAdmin && !actor.isCaptain1) throw new Error("Forbidden");
    updates.team1Name = input.team1Name.trim().slice(0, 32);
  }
  if (Object.keys(updates).length === 0) return;

  await db
    .update(seasonFinale)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(seasonFinale.id, finaleId));
}

export async function updateFinaleAdmin(
  finaleId: string,
  input: {
    joinLink?: string | null;
    gameTime?: string | null;
    team0Score?: number;
    team1Score?: number;
    phase?: FinalePhase;
  }
) {
  const finale = await db.query.seasonFinale.findFirst({
    where: eq(seasonFinale.id, finaleId),
  });
  if (!finale) throw new Error("Finale not found");

  const map = finale.map ?? finale.pickBan.selectedMap;
  const joinLink =
    input.joinLink !== undefined ? input.joinLink : finale.joinLink;
  const gameTime =
    input.gameTime !== undefined
      ? input.gameTime
        ? new Date(input.gameTime)
        : null
      : finale.gameTime;

  let phase = input.phase ?? finale.phase;
  if (map && joinLink && gameTime && phase === "pick_ban") {
    phase = "scheduled";
  }

  await db
    .update(seasonFinale)
    .set({
      joinLink,
      gameTime,
      team0Score: input.team0Score ?? finale.team0Score,
      team1Score: input.team1Score ?? finale.team1Score,
      phase,
      map,
      updatedAt: new Date(),
    })
    .where(eq(seasonFinale.id, finaleId));
}

export function serializeFinale(ctx: Awaited<ReturnType<typeof getFinaleContext>>) {
  if (!ctx.finale) return null;
  return {
    id: ctx.finale.id,
    phase: ctx.finale.phase,
    seasonPhase: ctx.timeline.phase,
    team0Name: ctx.finale.team0Name,
    team1Name: ctx.finale.team1Name,
    map: ctx.finale.map,
    joinLink: ctx.finale.joinLink,
    gameTime: ctx.finale.gameTime?.toISOString() ?? null,
    team0Score: ctx.finale.team0Score,
    team1Score: ctx.finale.team1Score,
    pickBan: ctx.finale.pickBan,
    team0: ctx.finale.team0,
    team1: ctx.finale.team1,
    captain0: ctx.finale.captain0,
    captain1: ctx.finale.captain1,
  };
}

export async function isRankingsLocked(): Promise<boolean> {
  const season = await ensureCurrentSeason();
  return getSeasonTimeline(season).isLocked;
}
