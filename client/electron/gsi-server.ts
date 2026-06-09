import express from "express";
import type { Server } from "http";
import type { GameSnapshot } from "../shared/types";
import { EMPTY_GAME } from "../shared/types";

export interface RawGsiPayload {
  provider?: { timestamp?: number; name?: string };
  map?: {
    name?: string;
    mode?: string;
    phase?: string;
    round?: number;
    team_ct?: { score?: number };
    team_t?: { score?: number };
  };
  round?: {
    phase?: string;
    win_team?: string;
  };
  player?: {
    steamid?: string;
    name?: string;
    team?: string;
    match_stats?: {
      kills?: number;
      deaths?: number;
      assists?: number;
      headshot_kills?: number;
      headshots?: number;
      mvps?: number;
      damage?: number;
      total_damage?: number;
      rounds_played?: number;
      adr?: number | string;
    };
    state?: {
      adr?: number | string;
      round_totaldmg?: number;
    };
  };
  allplayers?: Record<
    string,
    {
      name?: string;
      team?: string;
      match_stats?: {
        kills?: number;
        deaths?: number;
        assists?: number;
        headshot_kills?: number;
        headshots?: number;
        mvps?: number;
        damage?: number;
        total_damage?: number;
        rounds_played?: number;
        adr?: number | string;
      };
    }
  >;
  added?: RawGsiPayload;
  previously?: RawGsiPayload;
}

export type GsiUpdateHandler = (payload: RawGsiPayload, game: GameSnapshot) => void;

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function mergeSection<T extends Record<string, unknown>>(base: T | undefined, patch: T | undefined): T | undefined {
  if (!base && !patch) {
    return undefined;
  }

  return { ...(base ?? {}), ...(patch ?? {}) } as T;
}

function mergePayload(previous: RawGsiPayload | null, incoming: RawGsiPayload): RawGsiPayload {
  const delta = incoming.added ?? incoming;
  const mergedPlayer = mergeSection(previous?.player, delta.player);

  return {
    ...previous,
    ...incoming,
    ...delta,
    map: mergeSection(previous?.map, delta.map),
    round: mergeSection(previous?.round, delta.round),
    allplayers: { ...(previous?.allplayers ?? {}), ...(delta.allplayers ?? {}) },
    player: mergedPlayer
      ? {
          ...mergedPlayer,
          match_stats: mergeSection(previous?.player?.match_stats, delta.player?.match_stats),
          state: mergeSection(previous?.player?.state, delta.player?.state),
        }
      : previous?.player,
  };
}

function resolveAdr(
  player: RawGsiPayload["player"],
  roundNumber: number,
  trackedDamage: number,
  trackedRounds: number,
  previousAdr: number
): number {
  const stateAdr = readNumber(player?.state?.adr);
  if (stateAdr !== null && stateAdr >= 0) {
    return stateAdr;
  }

  const matchDamage =
    readNumber(player?.match_stats?.damage) ??
    readNumber(player?.match_stats?.total_damage) ??
    (trackedDamage > 0 ? trackedDamage : null);

  const roundsPlayed =
    readNumber(player?.match_stats?.rounds_played) ??
    (trackedRounds > 0 ? trackedRounds : null) ??
    (roundNumber > 0 ? roundNumber : null);

  if (matchDamage !== null && roundsPlayed !== null && roundsPlayed > 0) {
    return matchDamage / roundsPlayed;
  }

  return previousAdr;
}

export class GsiServer {
  private app = express();
  private server: Server | null = null;
  private game: GameSnapshot = { ...EMPTY_GAME };
  private lastPayload: RawGsiPayload | null = null;
  private previousRoundPhase: string | null = null;
  private trackedMatchDamage = 0;
  private trackedRoundDamage = 0;
  private trackedRounds = 0;
  private trackedMapName: string | null = null;
  private previousMapPhase: string | null = null;

  constructor(
    private port: number,
    private onUpdate: GsiUpdateHandler
  ) {
    this.app.use(express.json({ limit: "1mb" }));
    this.app.post("/", (req, res) => {
      const payload = req.body as RawGsiPayload;
      const merged = mergePayload(this.lastPayload, payload);
      this.lastPayload = merged;
      this.applyPayload(merged);
      this.onUpdate(merged, this.game);
      res.sendStatus(200);
    });
  }

  async start() {
    await new Promise<void>((resolve, reject) => {
      this.server = this.app.listen(this.port, "127.0.0.1", () => resolve());
      this.server.on("error", reject);
    });
  }

  stop() {
    if (!this.server) return;
    this.server.close();
    this.server = null;
    this.game = { ...EMPTY_GAME };
    this.lastPayload = null;
    this.previousRoundPhase = null;
    this.trackedMatchDamage = 0;
    this.trackedRoundDamage = 0;
    this.trackedRounds = 0;
    this.trackedMapName = null;
    this.previousMapPhase = null;
  }

  getSnapshot() {
    return this.game;
  }

  getLastPayload() {
    return this.lastPayload;
  }

  private resetMatchTracking() {
    this.trackedMatchDamage = 0;
    this.trackedRoundDamage = 0;
    this.trackedRounds = 0;
    this.game.stats.adr = 0;
  }

  private updateDamageTracking(payload: RawGsiPayload, roundNumber: number, roundPhase: string | null) {
    const mapName = payload.map?.name ?? null;
    const mapPhase = payload.map?.phase ?? null;

    if (
      mapPhase === "live" &&
      this.previousMapPhase !== "live" &&
      (this.previousMapPhase === "gameover" ||
        this.previousMapPhase === "warmup" ||
        this.previousMapPhase === "intermission")
    ) {
      this.resetMatchTracking();
    }

    if (mapName && mapName !== this.trackedMapName) {
      this.trackedMapName = mapName;
      if (mapName !== "menu") {
        this.resetMatchTracking();
      }
    }

    const roundDamage = readNumber(payload.player?.state?.round_totaldmg);
    if (roundDamage !== null) {
      this.trackedRoundDamage = roundDamage;
    }

    const matchDamage =
      readNumber(payload.player?.match_stats?.damage) ??
      readNumber(payload.player?.match_stats?.total_damage);
    if (matchDamage !== null && matchDamage >= this.trackedMatchDamage) {
      this.trackedMatchDamage = matchDamage;
    }

    if (roundPhase === "over" && this.previousRoundPhase !== "over") {
      this.trackedMatchDamage += this.trackedRoundDamage;
      this.trackedRoundDamage = 0;
      this.trackedRounds = Math.max(this.trackedRounds, roundNumber);
    }

    if (roundNumber > this.trackedRounds) {
      this.trackedRounds = roundNumber;
    }

    this.previousRoundPhase = roundPhase;
    this.previousMapPhase = mapPhase;
  }

  private applyPayload(payload: RawGsiPayload) {
    this.game.connected = true;
    this.game.lastUpdate = Date.now();

    const roundNumber = payload.map?.round ?? this.game.map?.round ?? 0;
    const roundPhase = payload.round?.phase ?? this.game.round?.phase ?? null;
    this.updateDamageTracking(payload, roundNumber, roundPhase);

    const stats = payload.player?.match_stats;
    if (stats || payload.player?.state) {
      this.game.stats = {
        kills: stats?.kills ?? this.game.stats.kills,
        deaths: stats?.deaths ?? this.game.stats.deaths,
        assists: stats?.assists ?? this.game.stats.assists,
        adr: resolveAdr(
          payload.player,
          roundNumber,
          this.trackedMatchDamage,
          this.trackedRounds,
          this.game.stats.adr
        ),
      };
    }

    this.game.playerName = payload.player?.name ?? this.game.playerName;
    this.game.team = payload.player?.team ?? this.game.team;

    if (payload.map) {
      this.game.inMatch = payload.map.phase === "live";
      this.game.map = {
        name: payload.map.name ?? "Unknown",
        phase: payload.map.phase ?? "unknown",
        round: payload.map.round ?? 0,
        teamCT: { score: payload.map.team_ct?.score ?? 0 },
        teamT: { score: payload.map.team_t?.score ?? 0 },
      };
    }

    if (payload.round) {
      this.game.round = {
        phase: payload.round.phase ?? "unknown",
        winTeam: payload.round.win_team as "CT" | "T" | undefined,
      };
    }
  }
}
