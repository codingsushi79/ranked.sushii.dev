import type { AppState, GameSnapshot, PollState } from "../shared/types";
import { EMPTY_STATS } from "../shared/types";
import { GsiServer, type RawGsiPayload } from "./gsi-server";
import type { SettingsStore } from "./settings";
import type { TwitchClient } from "./twitch";
import { writeGsiConfig } from "./twitch";

interface GameControllerOptions {
  settingsStore: SettingsStore;
  twitch: TwitchClient;
  onState: (state: AppState) => void;
  onError: (message: string) => void;
  onStatus: (message: string) => void;
}

export class GameController {
  private gsi: GsiServer | null = null;
  private pollRefreshTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private game: GameSnapshot | null = null;
  private poll: PollState | null = null;
  private pollPhase: AppState["pollPhase"] = "idle";
  private gsiInstalled = false;
  private matchActive = false;
  private roundOneStarted = false;
  private roundOneEnded = false;
  private activePollId: string | null = null;
  private previousMapPhase: string | null = null;
  private previousRoundPhase: string | null = null;
  private previousRoundNumber = -1;

  constructor(private options: GameControllerOptions) {}

  async start() {
    this.gsiInstalled = this.detectGsiInstalled();
    await this.restartGsi();
    this.startHeartbeat();
    this.emitState();
  }

  updateSettings() {
    void this.restartGsi();
    this.emitState();
  }

  refreshAuthState() {
    this.emitState();
  }

  clearPollState() {
    this.clearPollRefresh();
    this.poll = null;
    this.pollPhase = "idle";
    this.activePollId = null;
    this.roundOneEnded = false;
    this.emitState();
  }

  stop() {
    this.clearPollRefresh();
    this.gsi?.stop();
    this.gsi = null;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  isGsiInstalled() {
    return this.gsiInstalled;
  }

  isCs2Connected() {
    return this.game?.connected ?? false;
  }

  async installGsiConfig() {
    const cfgDir = this.options.settingsStore.getCs2CfgDirectory();
    if (!cfgDir) {
      throw new Error("Could not find your CS2 cfg folder. Install CS2 via Steam first.");
    }

    const port = this.options.settingsStore.get().gsiPort;
    writeGsiConfig(cfgDir, port);
    this.gsiInstalled = true;
    this.options.onStatus("GSI config installed. Restart CS2 if it is already running.");
    this.emitState();
    return true;
  }

  async forceClosePoll() {
    if (!this.activePollId) return;
    await this.closePoll("manual");
  }

  private detectGsiInstalled() {
    const cfgDir = this.options.settingsStore.getCs2CfgDirectory();
    if (!cfgDir) return false;
    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    return fs.existsSync(path.join(cfgDir, "gamestate_integration_cs2sync.cfg"));
  }

  private async restartGsi() {
    this.gsi?.stop();
    const port = this.options.settingsStore.get().gsiPort;

    this.gsi = new GsiServer(port, (payload, game) => {
      this.game = game;
      this.handleGameLogic(payload);
      this.emitState();
    });

    await this.gsi.start();
  }

  private handleGameLogic(payload: RawGsiPayload) {
    const mapPhase = payload.map?.phase ?? null;
    const roundPhase = payload.round?.phase ?? null;
    const roundNumber = payload.map?.round ?? 0;

    if (mapPhase === "live" && this.previousMapPhase !== "live") {
      this.onMatchStarted();
    }

    if (mapPhase === "gameover") {
      this.resetMatch();
    }

    if (
      roundPhase === "live" &&
      roundNumber <= 1 &&
      this.previousRoundPhase !== "live"
    ) {
      this.roundOneStarted = true;
    }

    if (
      this.roundOneStarted &&
      !this.roundOneEnded &&
      roundPhase === "over" &&
      this.previousRoundPhase !== "over"
    ) {
      void this.closePoll("round-end");
    }

    if (
      this.roundOneStarted &&
      !this.roundOneEnded &&
      roundNumber > this.previousRoundNumber &&
      this.previousRoundNumber >= 0 &&
      roundNumber >= 1
    ) {
      void this.closePoll("round-end");
    }

    this.previousMapPhase = mapPhase;
    this.previousRoundPhase = roundPhase;
    this.previousRoundNumber = roundNumber;
  }

  private onMatchStarted() {
    if (this.matchActive) return;
    this.matchActive = true;
    this.roundOneStarted = false;
    this.roundOneEnded = false;
    if (this.game) {
      this.game.stats = { ...EMPTY_STATS };
    }
    this.options.onStatus(
      this.options.twitch.isAuthenticated()
        ? "Match detected — creating Twitch poll..."
        : "Match detected."
    );
    if (this.options.twitch.isAuthenticated()) {
      void this.createPoll();
    }
  }

  private resetMatch() {
    this.matchActive = false;
    this.roundOneStarted = false;
    this.roundOneEnded = false;
    this.pollPhase = "idle";
    this.poll = null;
    this.activePollId = null;
    this.previousMapPhase = null;
    this.previousRoundPhase = null;
    this.previousRoundNumber = -1;
    this.clearPollRefresh();
  }

  private async createPoll() {
    if (!this.options.twitch.isAuthenticated()) {
      return;
    }

    try {
      const poll = await this.options.twitch.createRoundPoll();
      if (!poll) {
        throw new Error("Twitch did not return a poll.");
      }

      this.poll = poll;
      this.activePollId = poll.id;
      this.pollPhase = "active";
      this.startPollRefresh();
      this.options.onStatus("Match win poll is live on Twitch.");
    } catch (error) {
      this.pollPhase = "idle";
      this.options.onError(
        error instanceof Error ? error.message : "Failed to create Twitch poll."
      );
    }
  }

  private startPollRefresh() {
    this.clearPollRefresh();
    this.pollRefreshTimer = setInterval(() => {
      void this.refreshPoll();
    }, 3000);
  }

  private clearPollRefresh() {
    if (this.pollRefreshTimer) {
      clearInterval(this.pollRefreshTimer);
      this.pollRefreshTimer = null;
    }
  }

  private async refreshPoll() {
    if (!this.activePollId) return;

    try {
      const poll = await this.options.twitch.getPoll(this.activePollId);
      if (poll) {
        this.poll = poll;
        this.emitState();
      }
    } catch (error) {
      this.options.onError(
        error instanceof Error ? error.message : "Failed to refresh poll standings."
      );
    }
  }

  private async closePoll(reason: "round-end" | "manual") {
    if (!this.activePollId || this.roundOneEnded) return;

    this.roundOneEnded = true;
    this.pollPhase = "closing";
    this.emitState();

    try {
      const poll = await this.options.twitch.endPoll(this.activePollId);
      this.poll = poll;
      this.pollPhase = "closed";
      this.clearPollRefresh();
      this.options.onStatus(
        reason === "manual" ? "Poll closed manually." : "Round 1 ended — voting closed."
      );
    } catch (error) {
      this.options.onError(
        error instanceof Error ? error.message : "Failed to close Twitch poll."
      );
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (!this.game?.connected || !this.game.lastUpdate) return;
      const stale = Date.now() - this.game.lastUpdate > 10_000;
      if (stale) {
        this.game.connected = false;
        this.emitState();
      }
    }, 2000);
  }

  private emitState() {
    const state: AppState = {
      cs2: this.game ? { ...this.game } : {
        connected: false,
        inMatch: false,
        map: null,
        round: null,
        stats: { ...EMPTY_STATS },
        playerName: "",
        team: "",
        lastUpdate: 0,
      },
      poll: this.poll ? { ...this.poll, choices: [...this.poll.choices] } : null,
      pollPhase: this.pollPhase,
      twitchConnected: this.options.twitch.isAuthenticated(),
      gsiInstalled: this.gsiInstalled,
    };
    this.options.onState(state);
  }
}
