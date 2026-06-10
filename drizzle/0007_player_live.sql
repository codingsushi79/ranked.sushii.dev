CREATE TABLE IF NOT EXISTS "player_live" (
  "user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "in_match" boolean DEFAULT false NOT NULL,
  "map" text,
  "mode" text,
  "phase" text,
  "player_team" integer,
  "team0_score" integer DEFAULT 0 NOT NULL,
  "team1_score" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "player_live_updated_at_idx" ON "player_live" ("updated_at");
