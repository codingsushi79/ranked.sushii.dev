import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  matches,
  matchPlayers,
  playerSeasons,
  type ScoreboardEntry,
} from "@/db/schema";
import { calculateEloChange, STARTING_ELO } from "@/lib/elo";
import { ensureCurrentSeason, getOrCreatePlayerSeason } from "@/lib/player";
import { isRankingsLocked } from "@/lib/finale";
import { fetchSteamProfiles } from "@/lib/steam";
import { normalizeScoreboard } from "@/lib/scoreboard";
import type { matchReportSchema } from "@/lib/validators";
import type { z } from "zod";

type MatchReport = z.infer<typeof matchReportSchema>;

export async function processMatchReport(report: MatchReport) {
  const existing = await db.query.matches.findFirst({
    where: eq(matches.externalId, report.externalId),
  });
  if (existing) {
    return { duplicate: true, matchId: existing.id };
  }

  if (await isRankingsLocked()) {
    throw new Error("Rankings are locked for the season finale");
  }

  const season = await ensureCurrentSeason();

  type ResolvedPlayer = {
    userId: string;
    team: number;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    mvps: number;
    damage: number;
    adr: number;
    elo: number;
    placementGames: number;
    wins: number;
    losses: number;
    seasonKills: number;
    seasonDeaths: number;
    seasonAssists: number;
    seasonHeadshots: number;
    seasonMvps: number;
    seasonDamage: number;
    seasonMatches: number;
    username: string;
    steamName: string | null;
    steamId: string | null;
  };

  type PlayerWithElo = {
    team: number;
    elo: number;
  };

  const playersWithElo: PlayerWithElo[] = [];
  const resolvedPlayers: ResolvedPlayer[] = [];
  const steamIds = [
    ...new Set(report.players.map((p) => p.steamId).filter((id): id is string => !!id)),
  ];
  const linkedUsers = steamIds.length
    ? await db.query.users.findMany({
        where: inArray(users.steamId, steamIds),
      })
    : [];
  const userBySteamId = new Map(
    linkedUsers
      .filter((user) => user.steamId)
      .map((user) => [user.steamId!, user])
  );
  const steamProfiles = await fetchSteamProfiles(steamIds);

  for (const p of report.players) {
    let userId = p.userId;
    const linked = p.steamId ? userBySteamId.get(p.steamId) : undefined;
    if (!userId && linked) {
      userId = linked.id;
    }

    let elo = STARTING_ELO;
    if (userId) {
      const ps = await getOrCreatePlayerSeason(userId, season.id);
      elo = ps.elo;
      resolvedPlayers.push({
        userId,
        team: p.team,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        headshots: p.headshots ?? 0,
        mvps: p.mvps ?? 0,
        damage: p.damage ?? 0,
        adr: p.adr ?? 0,
        elo: ps.elo,
        placementGames: ps.placementGames,
        wins: ps.wins,
        losses: ps.losses,
        seasonKills: ps.kills,
        seasonDeaths: ps.deaths,
        seasonAssists: ps.assists,
        seasonHeadshots: ps.headshots,
        seasonMvps: ps.mvps,
        seasonDamage: ps.damage,
        seasonMatches: ps.matchesPlayed,
        username: linked?.username ?? p.username ?? "Player",
        steamName: linked?.steamName ?? p.displayName ?? null,
        steamId: p.steamId ?? linked?.steamId ?? null,
      });
    }

    playersWithElo.push({ team: p.team, elo });
  }

  if (resolvedPlayers.length < 1) {
    throw new Error(
      "No ranked account found for this match — sign in with Steam on the website"
    );
  }

  const team0 = playersWithElo.filter((p) => p.team === 0);
  const team1 = playersWithElo.filter((p) => p.team === 1);
  const team0Avg =
    team0.reduce((s, p) => s + p.elo, 0) / Math.max(team0.length, 1);
  const team1Avg =
    team1.reduce((s, p) => s + p.elo, 0) / Math.max(team1.length, 1);

  const rawScoreboard: ScoreboardEntry[] = report.players.map((p) => {
    const linked = p.steamId ? userBySteamId.get(p.steamId) : undefined;
    const steamProfile = p.steamId ? steamProfiles.get(p.steamId) : undefined;
    return {
      steamId: p.steamId,
      username: p.username ?? linked?.username,
      displayName:
        p.displayName ??
        linked?.steamName ??
        steamProfile?.steamName ??
        linked?.username,
      team: p.team,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      headshots: p.headshots ?? 0,
      mvps: p.mvps ?? 0,
      damage: p.damage ?? 0,
      adr: p.adr ?? 0,
    };
  });

  const scoreboard = normalizeScoreboard(rawScoreboard, resolvedPlayers);

  return db.transaction(async (tx) => {
    const [match] = await tx
      .insert(matches)
      .values({
        seasonId: season.id,
        externalId: report.externalId,
        map: report.map,
        mode: report.mode,
        winnerTeam: report.winnerTeam,
        team0Score: report.team0Score ?? null,
        team1Score: report.team1Score ?? null,
        demoShareCode: report.demoShareCode ?? null,
        demoUrl: report.demoUrl ?? null,
        scoreboard,
      })
      .returning();

    const results = [];

    for (const p of resolvedPlayers) {
      const teamAvg = p.team === 0 ? team0Avg : team1Avg;
      const enemyAvg = p.team === 0 ? team1Avg : team0Avg;
      const won = p.team === report.winnerTeam;

      const eloChange = calculateEloChange({
        playerElo: p.elo,
        teamAvgElo: teamAvg,
        enemyAvgElo: enemyAvg,
        won,
        placementGames: p.placementGames,
        stats: {
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          adr: p.adr,
        },
      });

      const newElo = Math.max(0, p.elo + eloChange);

      await tx.insert(matchPlayers).values({
        matchId: match.id,
        userId: p.userId,
        team: p.team,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        headshots: p.headshots,
        mvps: p.mvps,
        damage: p.damage,
        adr: p.adr,
        eloBefore: p.elo,
        eloAfter: newElo,
        eloChange,
        won,
      });

      await tx
        .update(playerSeasons)
        .set({
          elo: newElo,
          placementGames: p.placementGames + 1,
          wins: p.wins + (won ? 1 : 0),
          losses: p.losses + (won ? 0 : 1),
          kills: p.seasonKills + p.kills,
          deaths: p.seasonDeaths + p.deaths,
          assists: p.seasonAssists + p.assists,
          headshots: p.seasonHeadshots + p.headshots,
          mvps: p.seasonMvps + p.mvps,
          damage: p.seasonDamage + p.damage,
          matchesPlayed: p.seasonMatches + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(playerSeasons.userId, p.userId),
            eq(playerSeasons.seasonId, season.id)
          )
        );

      results.push({ userId: p.userId, eloChange, newElo, won });
    }

    return { duplicate: false, matchId: match.id, results };
  });
}
