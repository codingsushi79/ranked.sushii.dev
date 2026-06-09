CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "username" text NOT NULL UNIQUE,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "email_verified" boolean DEFAULT false NOT NULL,
  "steam_id" text UNIQUE,
  "steam_name" text,
  "steam_avatar" text,
  "client_token_hash" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "users_steam_id_idx" ON "users" ("steam_id");

CREATE TABLE IF NOT EXISTS "email_verifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "otp" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "seasons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "number" integer NOT NULL UNIQUE,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "player_seasons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "season_id" uuid NOT NULL REFERENCES "seasons"("id") ON DELETE cascade,
  "elo" integer DEFAULT 1000 NOT NULL,
  "placement_games" integer DEFAULT 0 NOT NULL,
  "wins" integer DEFAULT 0 NOT NULL,
  "losses" integer DEFAULT 0 NOT NULL,
  "kills" integer DEFAULT 0 NOT NULL,
  "deaths" integer DEFAULT 0 NOT NULL,
  "assists" integer DEFAULT 0 NOT NULL,
  "headshots" integer DEFAULT 0 NOT NULL,
  "mvps" integer DEFAULT 0 NOT NULL,
  "damage" integer DEFAULT 0 NOT NULL,
  "rounds_played" integer DEFAULT 0 NOT NULL,
  "matches_played" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "player_seasons_user_season_idx" ON "player_seasons" ("user_id", "season_id");
CREATE INDEX IF NOT EXISTS "player_seasons_season_elo_idx" ON "player_seasons" ("season_id", "elo");

CREATE TABLE IF NOT EXISTS "matches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "season_id" uuid NOT NULL REFERENCES "seasons"("id"),
  "external_id" text NOT NULL,
  "map" text NOT NULL,
  "mode" text DEFAULT 'competitive' NOT NULL,
  "winner_team" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "matches_external_id_idx" ON "matches" ("external_id");
CREATE INDEX IF NOT EXISTS "matches_season_idx" ON "matches" ("season_id");

CREATE TABLE IF NOT EXISTS "match_players" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL REFERENCES "matches"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "team" integer NOT NULL,
  "kills" integer DEFAULT 0 NOT NULL,
  "deaths" integer DEFAULT 0 NOT NULL,
  "assists" integer DEFAULT 0 NOT NULL,
  "headshots" integer DEFAULT 0 NOT NULL,
  "mvps" integer DEFAULT 0 NOT NULL,
  "damage" integer DEFAULT 0 NOT NULL,
  "adr" real DEFAULT 0 NOT NULL,
  "elo_before" integer NOT NULL,
  "elo_after" integer NOT NULL,
  "elo_change" integer NOT NULL,
  "won" boolean NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "match_players_match_user_idx" ON "match_players" ("match_id", "user_id");
CREATE INDEX IF NOT EXISTS "match_players_user_idx" ON "match_players" ("user_id");
