import type { RawGsiPayload } from "./gsi-server";
import { normalizeMatchMode } from "./match-modes";

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
  externalId: string
): GsiMatchReport | { error: string } {
  const mapName = payload.map?.name;
  if (!mapName || mapName === "menu") {
    return { error: "No map data in GSI payload" };
  }

  const mode = normalizeMatchMode(payload.map?.mode);
  if (!mode) {
    return { error: "Only Competitive and Premier matches are rated" };
  }

  const team0Score = readNumber(payload.map?.team_ct?.score);
  const team1Score = readNumber(payload.map?.team_t?.score);
  if (team0Score === team1Score) {
    return { error: "Match ended in a tie" };
  }
  const winnerTeam = team0Score > team1Score ? 0 : 1;

  const players: GsiMatchPlayer[] = [];

  if (payload.allplayers) {
    for (const [steamId, data] of Object.entries(payload.allplayers)) {
      const parsed = playerFromGsi(steamId, data);
      if (parsed) players.push(parsed);
    }
  }

  if (players.length === 0 && payload.player?.steamid) {
    const parsed = playerFromGsi(payload.player.steamid, payload.player);
    if (parsed) players.push(parsed);
  }

  if (players.length === 0) {
    return {
      error:
        "No player stats in GSI — restart CS2 after reinstalling GSI config",
    };
  }

  return {
    externalId,
    map: mapName,
    mode,
    winnerTeam,
    team0Score,
    team1Score,
    players,
  };
}
