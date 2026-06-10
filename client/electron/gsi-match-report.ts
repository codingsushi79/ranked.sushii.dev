import type { RawGsiPayload } from "./gsi-server";
import { normalizeMatchMode, type AllowedMatchMode } from "./match-modes";

export type GsiMatchSessionMeta = {
  map: string;
  mode: string;
  lastLivePayload?: RawGsiPayload | null;
};

export type GsiMatchPlayer = {
  steamId: string;
  team: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  mvps: number;
  damage: number;
  adr: number;
};

export type GsiMatchReport = {
  externalId: string;
  map: string;
  mode: "competitive" | "premier";
  winnerTeam: number;
  team0Score: number;
  team1Score: number;
  demoShareCode?: string;
  demoUrl?: string;
  players: GsiMatchPlayer[];
};

function readNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function teamToNumber(team: string | undefined): number | null {
  if (!team) return null;
  const key = team.toUpperCase();
  if (key === "CT") return 0;
  if (key === "T") return 1;
  return null;
}

function adrFromStats(stats: Record<string, unknown> | undefined): number {
  if (!stats) return 0;
  const adr = readNumber(stats.adr);
  if (adr > 0) return adr;
  const damage = readNumber(stats.damage ?? stats.total_damage);
  const rounds = readNumber(stats.rounds_played);
  if (rounds > 0 && damage > 0) return damage / rounds;
  return 0;
}

function resolveScores(
  payload: RawGsiPayload,
  fallback?: RawGsiPayload | null
): { team0Score: number; team1Score: number } {
  let team0Score = readNumber(payload.map?.team_ct?.score);
  let team1Score = readNumber(payload.map?.team_t?.score);

  if (fallback?.map) {
    const fb0 = readNumber(fallback.map.team_ct?.score);
    const fb1 = readNumber(fallback.map.team_t?.score);
    const currentTotal = team0Score + team1Score;
    const fallbackTotal = fb0 + fb1;

    if (team0Score === team1Score && fb0 !== fb1) {
      team0Score = fb0;
      team1Score = fb1;
    } else if (fallbackTotal > currentTotal) {
      team0Score = fb0;
      team1Score = fb1;
    }
  }

  return { team0Score, team1Score };
}

function collectPlayers(
  payload: RawGsiPayload,
  fallback?: RawGsiPayload | null
): GsiMatchPlayer[] {
  const bySteamId = new Map<string, GsiMatchPlayer>();

  for (const source of [payload, fallback]) {
    if (!source) continue;

    if (source.allplayers) {
      for (const [steamId, data] of Object.entries(source.allplayers)) {
        const parsed = playerFromGsi(steamId, data);
        if (parsed) bySteamId.set(steamId, parsed);
      }
    }

    if (source.player?.steamid) {
      const parsed = playerFromGsi(source.player.steamid, source.player);
      if (parsed) bySteamId.set(source.player.steamid, parsed);
    }
  }

  return [...bySteamId.values()];
}

function playerFromGsi(
  steamId: string,
  data: {
    team?: string;
    match_stats?: Record<string, unknown>;
  }
): GsiMatchPlayer | null {
  const team = teamToNumber(data.team);
  if (team === null) return null;
  const stats = data.match_stats ?? {};
  return {
    steamId,
    team,
    kills: readNumber(stats.kills),
    deaths: readNumber(stats.deaths),
    assists: readNumber(stats.assists),
    headshots: readNumber(stats.headshot_kills ?? stats.headshots),
    mvps: readNumber(stats.mvps),
    damage: readNumber(stats.damage ?? stats.total_damage),
    adr: adrFromStats(stats),
  };
}

export function buildMatchReportFromGsi(
  payload: RawGsiPayload,
  externalId: string,
  session?: GsiMatchSessionMeta & {
    demoShareCode?: string | null;
    demoUrl?: string | null;
  }
): GsiMatchReport | { error: string } {
  const fallback = session?.lastLivePayload ?? null;
  const mapName =
    payload.map?.name && payload.map.name !== "menu"
      ? payload.map.name
      : session?.map;
  if (!mapName || mapName === "menu") {
    return { error: "No map data in GSI payload" };
  }

  const mode: AllowedMatchMode | null =
    normalizeMatchMode(payload.map?.mode) ??
    (session ? normalizeMatchMode(session.mode) : null);
  if (!mode) {
    return { error: "Only Competitive and Premier matches are rated" };
  }

  const { team0Score, team1Score } = resolveScores(payload, fallback);
  if (team0Score === team1Score) {
    return { error: "Match ended in a tie — scores missing from GSI" };
  }
  const winnerTeam = team0Score > team1Score ? 0 : 1;

  const players = collectPlayers(payload, fallback);

  if (players.length === 0) {
    return {
      error:
        "No player stats in GSI — restart CS2 after launching the game",
    };
  }

  return {
    externalId,
    map: mapName,
    mode,
    winnerTeam,
    team0Score,
    team1Score,
    demoShareCode: session?.demoShareCode ?? undefined,
    demoUrl: session?.demoUrl ?? undefined,
    players,
  };
}
