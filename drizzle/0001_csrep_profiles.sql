CREATE TABLE IF NOT EXISTS "csrep_profiles" (
  "steam_id" text PRIMARY KEY NOT NULL,
  "score" integer,
  "label" text DEFAULT 'Unknown' NOT NULL,
  "autoflagged" boolean DEFAULT false NOT NULL,
  "overwatch_convicted" boolean DEFAULT false NOT NULL,
  "reports_count" integer DEFAULT 0 NOT NULL,
  "profile_url" text NOT NULL,
  "fetched_at" timestamp with time zone NOT NULL
);
