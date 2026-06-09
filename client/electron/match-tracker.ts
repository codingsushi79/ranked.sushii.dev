import fs from "fs";
import os from "os";
import path from "path";
import { GsiServer, type RawGsiPayload } from "./gsi-server";
import { GSI_CONFIG_FILENAME, writeGsiConfig } from "./gsi-config";
import { buildMatchReportFromGsi } from "./gsi-match-report";
import { isAllowedMatchMode, normalizeMatchMode } from "./match-modes";

const BRIDGE_URL = "http://127.0.0.1:27500";
const GSI_PORT = 3001;
const LEGACY_GSI_FILENAME = "gamestate_integration_cs2sync.cfg";

type MatchSession = {
  externalId: string;
  map: string;
  mode: string;
};

async function bridgePost(endpoint: string, body?: Record<string, unknown>) {
  try {
    const res = await fetch(`${BRIDGE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    return res;
  } catch {
    return null;
  }
}

function getCs2CfgDirectory(): string | null {
  const candidates: string[] = [];

  if (process.platform === "win32") {
    const programFiles = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
    candidates.push(
      path.join(
        programFiles,
        "Steam",
        "steamapps",
        "common",
        "Counter-Strike Global Offensive",
        "game",
        "csgo",
        "cfg"
      ),
      path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Programs",
        "Steam",
        "steamapps",
        "common",
        "Counter-Strike Global Offensive",
        "game",
        "csgo",
        "cfg"
      )
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Steam",
        "steamapps",
        "common",
        "Counter-Strike Global Offensive",
        "game",
        "csgo",
        "cfg"
      )
    );
  } else {
    candidates.push(
      path.join(
        os.homedir(),
        ".steam",
        "steam",
        "steamapps",
        "common",
        "Counter-Strike Global Offensive",
        "game",
        "csgo",
        "cfg"
      ),
      path.join(
        os.homedir(),
        ".local",
        "share",
        "Steam",
        "steamapps",
        "common",
        "Counter-Strike Global Offensive",
        "game",
        "csgo",
        "cfg"
      )
    );
  }

  return candidates.find((dir) => fs.existsSync(dir)) ?? null;
}

export class MatchTracker {
  private gsi: GsiServer | null = null;
  private gsiInstalled = false;
  private tracking = false;
  private cs2Connected = false;
  private inGame = false;
  private currentMode: string | null = null;
  private previousMapPhase: string | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private matchSession: MatchSession | null = null;

  async start() {
    this.gsiInstalled = this.detectGsiInstalled();
    await this.installGsiConfig();
    await this.restartGsi();
    this.startHeartbeat();
    await this.syncCs2Status();
  }

  stop() {
    this.gsi?.stop();
    this.gsi = null;
    this.matchSession = null;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  isGsiInstalled() {
    return this.gsiInstalled;
  }

  private detectGsiInstalled() {
    const cfgDir = getCs2CfgDirectory();
    if (!cfgDir) return false;
    return (
      fs.existsSync(path.join(cfgDir, GSI_CONFIG_FILENAME)) ||
      fs.existsSync(path.join(cfgDir, LEGACY_GSI_FILENAME))
    );
  }

  async installGsiConfig() {
    const cfgDir = getCs2CfgDirectory();
    if (!cfgDir) return false;
    writeGsiConfig(cfgDir, GSI_PORT);
    this.gsiInstalled = true;
    return true;
  }

  private async restartGsi() {
    this.gsi?.stop();
    this.gsi = new GsiServer(GSI_PORT, (payload) => {
      void this.handleGsi(payload);
    });
    await this.gsi.start();
  }

  private async handleGsi(payload: RawGsiPayload) {
    const mapPhase = payload.map?.phase ?? null;
    const mapName = payload.map?.name ?? "unknown";

    this.cs2Connected = true;
    this.inGame = mapPhase === "live" || mapPhase === "gameover";
    if (this.inGame) {
      this.currentMode = payload.map?.mode ?? null;
    } else {
      this.currentMode = null;
    }

    if (mapPhase === "live" && this.previousMapPhase !== "live") {
      const mode = normalizeMatchMode(payload.map?.mode);
      if (mode) {
        await this.onMatchStart(mapName, mode);
      }
    }

    if (this.matchSession && (mapPhase === "live" || mapPhase === "gameover")) {
      if (mapPhase === "gameover" && this.previousMapPhase !== "gameover") {
        const reportPayload = this.gsi?.getLastPayload() ?? payload;
        await this.submitMatch(reportPayload);
      }
    }

    if (mapPhase === "gameover" || mapPhase === "warmup" || mapPhase === "intermission") {
      if (this.previousMapPhase === "live" || this.previousMapPhase === "gameover") {
        await this.onMatchEnd();
      }
    }

    this.previousMapPhase = mapPhase;
    await this.syncCs2Status();
  }

  private async onMatchStart(mapName: string, mode: string) {
    this.tracking = true;
    this.matchSession = {
      externalId: `gsi-${Date.now()}`,
      map: mapName,
      mode,
    };
    await bridgePost("/match/start", {
      externalId: this.matchSession.externalId,
      map: mapName,
      mode,
      playerCount: 0,
      source: "gsi",
    });
  }

  private async submitMatch(payload: RawGsiPayload) {
    if (!this.matchSession) return;

    const result = buildMatchReportFromGsi(payload, this.matchSession.externalId);
    if ("error" in result) {
      await bridgePost("/match/error", {
        externalId: this.matchSession.externalId,
        message: result.error,
      });
      return;
    }

    await bridgePost("/match", result);
  }

  private async onMatchEnd() {
    this.tracking = false;
    this.matchSession = null;
    this.inGame = false;
    this.currentMode = null;
    await bridgePost("/match/stop");
  }

  private async syncCs2Status() {
    const inRatedMatch = this.inGame && isAllowedMatchMode(this.currentMode);
    await bridgePost("/cs2/status", {
      connected: this.cs2Connected,
      inMatch: this.inGame,
      inRatedMatch,
      matchMode: this.currentMode,
      gsiInstalled: this.gsiInstalled,
    });
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      const game = this.gsi?.getSnapshot();
      if (!game?.lastUpdate) return;

      const stale = Date.now() - game.lastUpdate > 10_000;
      if (!stale) return;

      if (this.cs2Connected) {
        this.cs2Connected = false;
        this.inGame = false;
        this.currentMode = null;
      }

      if (this.tracking) {
        void this.onMatchEnd();
      }

      void this.syncCs2Status();
    }, 2000);
  }
}
