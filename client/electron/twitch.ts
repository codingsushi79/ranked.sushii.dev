import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { BrowserWindow } from "electron";
import type { PollChoice, PollState } from "../shared/types";
import { SettingsStore } from "./settings";
import {
  isTwitchAppConfigured,
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
} from "./twitch-config";

const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/authorize";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_API = "https://api.twitch.tv/helix";
const REDIRECT_URI = "http://localhost:17563/callback";
const SCOPES = ["channel:manage:polls", "user:read:email"];

interface TwitchPollChoice {
  id: string;
  title: string;
  votes: number;
  channel_points_votes: number;
  bits_votes: number;
}

interface TwitchPoll {
  id: string;
  broadcaster_id: string;
  title: string;
  choices: TwitchPollChoice[];
  bits_voting_enabled: boolean;
  channel_points_voting_enabled: boolean;
  status: PollState["status"];
  duration: number;
  started_at: string;
  ended_at: string | null;
}

function mapPoll(poll: TwitchPoll): PollState {
  const choices: PollChoice[] = poll.choices.map((choice) => ({
    id: choice.id,
    title: choice.title,
    votes: choice.votes,
    channelPointsVotes: choice.channel_points_votes,
    bitsVotes: choice.bits_votes,
  }));

  return {
    id: poll.id,
    title: poll.title,
    status: poll.status,
    choices,
    totalVotes: choices.reduce((sum, choice) => sum + choice.votes, 0),
    endsAt: poll.ended_at,
  };
}

function formatTwitchTokenError(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string; status?: number };
    if (parsed.message === "invalid client") {
      return "Invalid Twitch client credentials. The developer must set CS2SYNC_TWITCH_CLIENT_ID and CS2SYNC_TWITCH_CLIENT_SECRET in .env and rebuild the app.";
    }
    if (parsed.message) {
      return `Twitch sign-in failed: ${parsed.message}`;
    }
  } catch {
    // Fall through to raw body.
  }

  return body || "Twitch sign-in failed.";
}

function createPkcePair() {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

export class TwitchClient {
  private oauthServer: import("http").Server | null = null;
  private pendingCodeVerifier: string | null = null;

  constructor(private settingsStore: SettingsStore) {}

  isConfigured(): boolean {
    return isTwitchAppConfigured();
  }

  isAuthenticated(): boolean {
    const auth = this.settingsStore.getAuth();
    return Boolean(auth?.accessToken && auth.expiresAt > Date.now() + 60_000);
  }

  getBroadcasterId(): string | null {
    return this.settingsStore.getAuth()?.broadcasterId ?? null;
  }

  private getClientId(): string {
    if (!TWITCH_CLIENT_ID) {
      throw new Error("CS2Sync is missing its Twitch app configuration.");
    }
    return TWITCH_CLIENT_ID;
  }

  private getClientSecret(): string {
    if (!TWITCH_CLIENT_SECRET) {
      throw new Error(
        "CS2Sync is missing its Twitch client secret. Rebuild the app with CS2SYNC_TWITCH_CLIENT_SECRET set."
      );
    }
    return TWITCH_CLIENT_SECRET;
  }

  async getValidToken(): Promise<string | null> {
    const auth = this.settingsStore.getAuth();
    if (!auth) return null;

    if (auth.expiresAt > Date.now() + 60_000) {
      return auth.accessToken;
    }

    if (!auth.refreshToken) {
      return null;
    }

    const body = new URLSearchParams({
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      grant_type: "refresh_token",
      refresh_token: auth.refreshToken,
    });

    const response = await fetch(TWITCH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      this.settingsStore.clearAuth();
      return null;
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    this.settingsStore.saveAuth({
      ...auth,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? auth.refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    return data.access_token;
  }

  private async helix<T>(path: string, init?: RequestInit): Promise<T | null> {
    const token = await this.getValidToken();
    if (!token) return null;

    const response = await fetch(`${TWITCH_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": this.getClientId(),
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twitch API error (${response.status}): ${text}`);
    }

    return (await response.json()) as T;
  }

  async startOAuth(parentWindow: BrowserWindow | null): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(
        "CS2Sync Twitch app is not configured. Set CS2SYNC_TWITCH_CLIENT_ID and CS2SYNC_TWITCH_CLIENT_SECRET before building the app."
      );
    }

    await this.stopOAuthServer();

    const http = await import("http");
    const state = crypto.randomBytes(16).toString("hex");
    const { verifier, challenge } = createPkcePair();
    this.pendingCodeVerifier = verifier;

    this.oauthServer = http.createServer(async (req, res) => {
      if (!req.url?.startsWith("/callback")) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const url = new URL(req.url, REDIRECT_URI);
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400);
        res.end(`Authorization denied: ${error}`);
        this.pendingCodeVerifier = null;
        return;
      }

      if (!code || returnedState !== state || !this.pendingCodeVerifier) {
        res.writeHead(400);
        res.end("Authorization failed.");
        this.pendingCodeVerifier = null;
        return;
      }

      try {
        await this.exchangeCode(code, this.pendingCodeVerifier);
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<html><body style='font-family:sans-serif;background:#0f1117;color:#fff;display:grid;place-items:center;height:100vh;margin:0'><div style='text-align:center'><h2>Signed in to Twitch</h2><p>You can close this window and return to CS2Sync.</p></div></body></html>"
        );
      } catch (exchangeError) {
        res.writeHead(500);
        res.end(exchangeError instanceof Error ? exchangeError.message : "Token exchange failed.");
      } finally {
        this.pendingCodeVerifier = null;
        setTimeout(() => this.stopOAuthServer(), 500);
      }
    });

    await new Promise<void>((resolve, reject) => {
      this.oauthServer?.listen(17563, "127.0.0.1", () => resolve());
      this.oauthServer?.on("error", reject);
    });

    const authUrl = new URL(TWITCH_AUTH_URL);
    authUrl.searchParams.set("client_id", this.getClientId());
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPES.join(" "));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    const { shell } = await import("electron");
    await shell.openExternal(authUrl.toString());
    parentWindow?.focus();
  }

  private async exchangeCode(code: string, codeVerifier: string) {
    const body = new URLSearchParams({
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    });

    const response = await fetch(TWITCH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      throw new Error(formatTwitchTokenError(await response.text()));
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    const user = await fetch(`${TWITCH_API}/users`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        "Client-Id": this.getClientId(),
      },
    }).then((res) => res.json() as Promise<{ data: Array<{ id: string; login: string }> }>);

    const profile = user.data[0];
    if (!profile) {
      throw new Error("Could not load Twitch user profile.");
    }

    this.settingsStore.saveAuth({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      broadcasterLogin: profile.login,
      broadcasterId: profile.id,
    });
  }

  async stopOAuthServer() {
    if (!this.oauthServer) return;
    await new Promise<void>((resolve) => {
      this.oauthServer?.close(() => resolve());
    });
    this.oauthServer = null;
  }

  logout() {
    this.settingsStore.clearAuth();
  }

  async createRoundPoll(): Promise<PollState | null> {
    const broadcasterId = this.getBroadcasterId();
    if (!broadcasterId) {
      throw new Error("Sign in with Twitch to manage polls.");
    }

    const settings = this.settingsStore.get();
    const payload = {
      broadcaster_id: broadcasterId,
      title: settings.pollTitle,
      choices: [{ title: settings.pollChoiceA }, { title: settings.pollChoiceB }],
      duration: settings.pollDurationSeconds,
    };

    const result = await this.helix<{ data: TwitchPoll[] }>("/polls", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const poll = result?.data?.[0];
    return poll ? mapPoll(poll) : null;
  }

  async getPoll(pollId: string): Promise<PollState | null> {
    const broadcasterId = this.getBroadcasterId();
    if (!broadcasterId) return null;

    const result = await this.helix<{ data: TwitchPoll[] }>(
      `/polls?broadcaster_id=${broadcasterId}&id=${pollId}`
    );
    const poll = result?.data?.[0];
    return poll ? mapPoll(poll) : null;
  }

  async endPoll(pollId: string): Promise<PollState | null> {
    const broadcasterId = this.getBroadcasterId();
    if (!broadcasterId) return null;

    const result = await this.helix<{ data: TwitchPoll[] }>("/polls", {
      method: "PATCH",
      body: JSON.stringify({
        broadcaster_id: broadcasterId,
        id: pollId,
        status: "TERMINATED",
      }),
    });
    const poll = result?.data?.[0];
    return poll ? mapPoll(poll) : null;
  }
}

export function writeGsiConfig(cfgDir: string, port: number): string {
  const filename = "gamestate_integration_cs2sync.cfg";
  const filePath = path.join(cfgDir, filename);
  const contents = `"CS2Sync"
{
    "uri"               "http://127.0.0.1:${port}/"
    "timeout"           "5.0"
    "buffer"            "0.1"
    "throttle"          "0.1"
    "heartbeat"         "30.0"
    "data"
    {
        "provider"                  "1"
        "map"                       "1"
        "map_round_wins"            "1"
        "round"                     "1"
        "player_id"                 "1"
        "player_state"              "1"
        "player_match_stats"        "1"
        "player_weapons"            "0"
        "player_position"           "0"
        "phase_countdowns"          "1"
        "allplayers_id"             "0"
        "allplayers_state"          "0"
        "allplayers_match_stats"    "0"
        "allplayers_weapons"        "0"
        "allplayers_position"       "0"
        "allgrenades"               "0"
        "bomb"                      "0"
    }
}
`;

  fs.writeFileSync(filePath, contents, "utf8");
  return filePath;
}
