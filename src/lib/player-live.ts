import { eq } from "drizzle-orm";
import { db } from "@/db";
import { playerLive } from "@/db/schema";

const LIVE_STALE_MS = 90_000;

export type PlayerLiveSnapshot = {
  inMatch: boolean;
  map: string;
  mode: string;
  phase: string;
  playerTeam: number;
  team0Score: number;
  team1Score: number;
  playerScore: number;
  opponentScore: number;
  updatedAt: string;
};

export type PlayerLiveUpdate = {
  inMatch: boolean;
  map?: string;
  mode?: string;
  phase?: string;
  playerTeam?: number;
  team0Score?: number;
  team1Score?: number;
};

function toSnapshot(row: typeof playerLive.$inferSelect): PlayerLiveSnapshot {
  const playerTeam = row.playerTeam ?? 0;
  const team0Score = row.team0Score ?? 0;
  const team1Score = row.team1Score ?? 0;
  const playerScore = playerTeam === 1 ? team1Score : team0Score;
  const opponentScore = playerTeam === 1 ? team0Score : team1Score;

  return {
    inMatch: row.inMatch,
    map: row.map ?? "unknown",
    mode: row.mode ?? "competitive",
    phase: row.phase ?? "live",
    playerTeam,
    team0Score,
    team1Score,
    playerScore,
    opponentScore,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function upsertPlayerLive(
  userId: string,
  update: PlayerLiveUpdate
): Promise<void> {
  const now = new Date();

  if (!update.inMatch) {
    await db.delete(playerLive).where(eq(playerLive.userId, userId));
    return;
  }

  await db
    .insert(playerLive)
    .values({
      userId,
      inMatch: true,
      map: update.map ?? null,
      mode: update.mode ?? null,
      phase: update.phase ?? null,
      playerTeam: update.playerTeam ?? null,
      team0Score: update.team0Score ?? 0,
      team1Score: update.team1Score ?? 0,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: playerLive.userId,
      set: {
        inMatch: true,
        map: update.map ?? null,
        mode: update.mode ?? null,
        phase: update.phase ?? null,
        playerTeam: update.playerTeam ?? null,
        team0Score: update.team0Score ?? 0,
        team1Score: update.team1Score ?? 0,
        updatedAt: now,
      },
    });
}

export async function clearPlayerLive(userId: string): Promise<void> {
  await db.delete(playerLive).where(eq(playerLive.userId, userId));
}

export async function getPlayerLive(
  userId: string
): Promise<PlayerLiveSnapshot | null> {
  const row = await db.query.playerLive.findFirst({
    where: eq(playerLive.userId, userId),
  });

  if (!row?.inMatch) return null;
  if (Date.now() - row.updatedAt.getTime() > LIVE_STALE_MS) return null;

  return toSnapshot(row);
}

export function playerLiveToJson(snapshot: PlayerLiveSnapshot | null) {
  return snapshot;
}
