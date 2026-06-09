import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api";
import { authenticateClient } from "@/lib/client-auth";
import { ensureCurrentSeason, getOrCreatePlayerSeason } from "@/lib/player";
import { eloToLevel } from "@/lib/elo";

export async function GET(request: Request) {
  const auth = await authenticateClient(request.headers.get("authorization"));
  if (!auth) {
    return jsonError("Unauthorized — verify email and use a valid client ID", 401);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, auth.userId),
    columns: {
      username: true,
      steamName: true,
      steamAvatar: true,
    },
  });
  if (!user) return jsonError("User not found", 404);

  const season = await ensureCurrentSeason();
  const ps = await getOrCreatePlayerSeason(auth.userId, season.id);

  return jsonOk({
    username: user.username,
    steamName: user.steamName,
    steamAvatar: user.steamAvatar,
    elo: ps.elo,
    level: eloToLevel(ps.elo),
    wins: ps.wins,
    losses: ps.losses,
    season: season.number,
  });
}
