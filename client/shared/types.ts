import type { ThemeDefinition } from "./theme";
import { DEFAULT_THEME } from "./theme";

export interface PlayerMatchStats {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
}

export interface MapState {
  name: string;
  phase: "warmup" | "live" | "gameover" | "intermission" | string;
  round: number;
  teamCT: { score: number };
  teamT: { score: number };
}

export interface RoundState {
  phase: "freezetime" | "live" | "over" | string;
  winTeam?: "CT" | "T";
}

export interface GameSnapshot {
  connected: boolean;
  inMatch: boolean;
  map: MapState | null;
  round: RoundState | null;
  stats: PlayerMatchStats;
  playerName: string;
  team: "CT" | "T" | "Spectator" | string;
  lastUpdate: number;
}

export interface PollChoice {
  id: string;
  title: string;
  votes: number;
  channelPointsVotes: number;
  bitsVotes: number;
}

export interface PollState {
  id: string;
  title: string;
  status: "ACTIVE" | "COMPLETED" | "TERMINATED" | "MODERATED" | "INVALID";
  choices: PollChoice[];
  totalVotes: number;
  endsAt: string | null;
}

export interface AppState {
  cs2: GameSnapshot;
  poll: PollState | null;
  pollPhase: "idle" | "active" | "closing" | "closed";
  twitchConnected: boolean;
  gsiInstalled: boolean;
}

export interface PollSettings {
  pollTitle: string;
  pollChoiceA: string;
  pollChoiceB: string;
  pollDurationSeconds: number;
}

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  broadcasterLogin: string;
  broadcasterId: string;
}

export interface AppSettings extends PollSettings {
  gsiPort: number;
  overlayOpacity: number;
  theme: ThemeDefinition;
}

export type { ThemeDefinition, ThemeColors, WindowStyle } from "./theme";
export {
  BUILTIN_THEMES,
  DEFAULT_THEME,
  decodeThemeCode,
  encodeThemeCode,
  normalizeTheme,
  resolveTheme,
  themeToCssVars,
} from "./theme";

export const DEFAULT_SETTINGS: AppSettings = {
  pollTitle: "Will we win this game?",
  pollChoiceA: "Yes",
  pollChoiceB: "No",
  pollDurationSeconds: 1800,
  gsiPort: 3001,
  overlayOpacity: DEFAULT_THEME.overlayOpacity,
  theme: DEFAULT_THEME,
};

export const EMPTY_STATS: PlayerMatchStats = {
  kills: 0,
  deaths: 0,
  assists: 0,
  adr: 0,
};

export const EMPTY_GAME: GameSnapshot = {
  connected: false,
  inMatch: false,
  map: null,
  round: null,
  stats: EMPTY_STATS,
  playerName: "",
  team: "",
  lastUpdate: 0,
};

export interface TwitchStatus {
  connected: boolean;
  login: string | null;
  configured: boolean;
}

export interface OverlayStatus {
  stats: boolean;
  poll: boolean;
}

export interface OverlayOpenOptions {
  stats: boolean;
  poll: boolean;
}

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error";

export interface UpdateStatusPayload {
  status: UpdateStatus;
  version?: string;
  progress?: number;
  message?: string;
}

export type WindowRole = "main" | "stats" | "poll";
