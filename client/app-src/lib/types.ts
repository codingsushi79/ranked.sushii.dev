export type AppView =
  | { kind: "home" }
  | { kind: "leaderboard" }
  | { kind: "profile" }
  | { kind: "tracking" }
  | { kind: "settings" }
  | { kind: "player"; username: string }
  | { kind: "match"; id: string };

export type CsrepTrustJson = {
  steamId: string;
  score: number | null;
  label: string;
  autoflagged: boolean;
  overwatchConvicted: boolean;
  reportsCount: number;
  profileUrl: string;
  configured: boolean;
};

export type ClientProfile = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
  steamId: string | null;
  steamName: string | null;
  steamAvatar: string | null;
  clientId: string;
  canPlay: boolean;
  season: {
    number: number;
    startsAt: string;
    endsAt: string;
    label: string;
  };
  stats: {
    elo: number;
    level: number;
    placementGames: number;
    placementsRemaining: number;
    isPlacing: boolean;
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    mvps: number;
    damage: number;
    matchesPlayed: number;
    kd: number;
    winRate: number;
  };
  recentMatches: RecentMatch[];
  csrep: CsrepTrustJson | null;
  live?: PlayerLiveSnapshot | null;
};

export type RecentMatch = {
  matchId: string;
  map: string;
  mode: string;
  kills: number;
  deaths: number;
  assists: number;
  eloChange: number;
  won: boolean;
  team0Score?: number | null;
  team1Score?: number | null;
  demoShareCode?: string | null;
  demoUrl?: string | null;
  playedAt: string;
};

export type LeaderboardPlayer = {
  rank: number;
  username: string;
  steamName: string | null;
  steamAvatar: string | null;
  elo: number;
  level: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  kd: number;
  isAdmin?: boolean;
  emailVerified?: boolean;
  csrep?: CsrepTrustJson | null;
};

export type PublicPlayer = {
  username: string;
  steamName: string | null;
  steamAvatar: string | null;
  steamId: string | null;
  season: number;
  stats: ClientProfile["stats"];
  csrep?: CsrepTrustJson | null;
  live?: PlayerLiveSnapshot | null;
  recentMatches: Omit<RecentMatch, "mode">[];
};

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

export type MatchDetail = {
  id: string;
  map: string;
  mode: string;
  winnerTeam: number;
  team0Score: number | null;
  team1Score: number | null;
  playedAt: string;
  season: number | null;
  demo?: {
    shareCode: string;
    steamUrl: string;
    webUrl: string;
  } | null;
  demoUrl?: string | null;
  team0: MatchPlayerRow[];
  team1: MatchPlayerRow[];
};

export type MatchPlayerRow = {
  username?: string;
  displayName?: string;
  steamAvatar?: string | null;
  team: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots?: number;
  mvps?: number;
  damage?: number;
  adr?: number;
  kd?: number;
  eloChange?: number | null;
  isRanked?: boolean;
};

export type BridgeStatus = {
  hasClientId: boolean;
  clientIdPreview?: string;
  tracking?: boolean;
  cs2Connected?: boolean;
  inMatch?: boolean;
  inRatedMatch?: boolean;
  matchMode?: string | null;
  gsiInstalled?: boolean;
  activeMatch?: { map: string; mode: string; playerCount: number; externalId?: string };
  lastReport?: { ok: boolean; at: string; message?: string; externalId?: string };
  lastError?: string;
  updateRequired?: boolean;
  jsiInstall?: {
    ready?: boolean;
    inCatalog?: boolean;
    inInstalled?: boolean;
  };
  apiUrl?: string;
};

export function formatMap(map: string) {
  return String(map || "unknown")
    .replace(/^de_/i, "")
    .replace(/_/g, " ");
}

export function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}
