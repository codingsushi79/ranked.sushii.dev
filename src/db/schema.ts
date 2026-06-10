import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  real,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    email: text("email").unique(),
    passwordHash: text("password_hash"),
    emailVerified: boolean("email_verified").notNull().default(false),
    steamId: text("steam_id").unique(),
    steamName: text("steam_name"),
    steamAvatar: text("steam_avatar"),
    clientTokenHash: text("client_token_hash"),
    isAdmin: boolean("is_admin").notNull().default(false),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_steam_id_idx").on(t.steamId)]
);

export const emailVerifications = pgTable("email_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const seasons = pgTable("seasons", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: integer("number").notNull().unique(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
});

export const playerSeasons = pgTable(
  "player_seasons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    elo: integer("elo").notNull().default(1000),
    placementGames: integer("placement_games").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    kills: integer("kills").notNull().default(0),
    deaths: integer("deaths").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    headshots: integer("headshots").notNull().default(0),
    mvps: integer("mvps").notNull().default(0),
    damage: integer("damage").notNull().default(0),
    roundsPlayed: integer("rounds_played").notNull().default(0),
    matchesPlayed: integer("matches_played").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("player_seasons_user_season_idx").on(t.userId, t.seasonId),
    index("player_seasons_season_elo_idx").on(t.seasonId, t.elo),
  ]
);

export type ScoreboardEntry = {
  steamId?: string;
  username?: string;
  displayName?: string;
  team: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots?: number;
  mvps?: number;
  damage?: number;
  adr?: number;
};

export const csrepProfiles = pgTable("csrep_profiles", {
  steamId: text("steam_id").primaryKey(),
  score: integer("score"),
  label: text("label").notNull().default("Unknown"),
  autoflagged: boolean("autoflagged").notNull().default(false),
  overwatchConvicted: boolean("overwatch_convicted").notNull().default(false),
  reportsCount: integer("reports_count").notNull().default(0),
  profileUrl: text("profile_url").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
});

export type CsrepProfileRow = typeof csrepProfiles.$inferSelect;

export const playerLive = pgTable("player_live", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  inMatch: boolean("in_match").notNull().default(false),
  map: text("map"),
  mode: text("mode"),
  phase: text("phase"),
  playerTeam: integer("player_team"),
  team0Score: integer("team0_score").notNull().default(0),
  team1Score: integer("team1_score").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PlayerLiveRow = typeof playerLive.$inferSelect;

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id),
    externalId: text("external_id").notNull(),
    map: text("map").notNull(),
    mode: text("mode").notNull().default("competitive"),
    winnerTeam: integer("winner_team").notNull(),
    team0Score: integer("team0_score"),
    team1Score: integer("team1_score"),
    demoShareCode: text("demo_share_code"),
    demoUrl: text("demo_url"),
    scoreboard: jsonb("scoreboard").$type<ScoreboardEntry[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("matches_external_id_idx").on(t.externalId),
    index("matches_season_idx").on(t.seasonId),
  ]
);

export const matchPlayers = pgTable(
  "match_players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    team: integer("team").notNull(),
    kills: integer("kills").notNull().default(0),
    deaths: integer("deaths").notNull().default(0),
    assists: integer("assists").notNull().default(0),
    headshots: integer("headshots").notNull().default(0),
    mvps: integer("mvps").notNull().default(0),
    damage: integer("damage").notNull().default(0),
    adr: real("adr").notNull().default(0),
    eloBefore: integer("elo_before").notNull(),
    eloAfter: integer("elo_after").notNull(),
    eloChange: integer("elo_change").notNull(),
    won: boolean("won").notNull(),
  },
  (t) => [
    uniqueIndex("match_players_match_user_idx").on(t.matchId, t.userId),
    index("match_players_user_idx").on(t.userId),
  ]
);

export type FinalePlayer = {
  userId: string;
  username: string;
  steamName: string | null;
  steamAvatar: string | null;
  rank: number;
  elo: number;
};

export type PickBanState = {
  mapPool: string[];
  bannedMaps: string[];
  selectedMap: string | null;
  nextBanBy: 0 | 1 | null;
};

export type FinalePhase =
  | "pick_ban"
  | "scheduled"
  | "live"
  | "completed";

export const seasonFinale = pgTable(
  "season_finale",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" })
      .unique(),
    phase: text("phase").notNull().default("pick_ban").$type<FinalePhase>(),
    topPlayers: jsonb("top_players").$type<FinalePlayer[]>().notNull(),
    team0Name: text("team0_name"),
    team1Name: text("team1_name"),
    pickBan: jsonb("pick_ban").$type<PickBanState>().notNull(),
    map: text("map"),
    joinLink: text("join_link"),
    gameTime: timestamp("game_time", { withTimezone: true }),
    team0Score: integer("team0_score").notNull().default(0),
    team1Score: integer("team1_score").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("season_finale_season_idx").on(t.seasonId)]
);

export type User = typeof users.$inferSelect;
export type PlayerSeason = typeof playerSeasons.$inferSelect;
export type Season = typeof seasons.$inferSelect;
