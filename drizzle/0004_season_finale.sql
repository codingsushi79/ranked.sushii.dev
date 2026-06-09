CREATE TABLE IF NOT EXISTS "season_finale" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "season_id" uuid NOT NULL UNIQUE REFERENCES "seasons"("id") ON DELETE cascade,
  "phase" text DEFAULT 'pick_ban' NOT NULL,
  "top_players" jsonb NOT NULL,
  "team0_name" text,
  "team1_name" text,
  "pick_ban" jsonb NOT NULL,
  "map" text,
  "join_link" text,
  "game_time" timestamp with time zone,
  "team0_score" integer DEFAULT 0 NOT NULL,
  "team1_score" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "season_finale_season_idx" ON "season_finale" ("season_id");
--> statement-breakpoint
UPDATE "users" SET "is_admin" = true WHERE lower("username") = 'sushics2';
