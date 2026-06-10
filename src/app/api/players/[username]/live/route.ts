import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { jsonError, jsonOk } from "@/lib/api";
import { getPlayerLive, playerLiveToJson } from "@/lib/player-live";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (!user) return jsonError("Player not found", 404);

  const live = await getPlayerLive(user.id);
  return jsonOk({ live: playerLiveToJson(live) });
}
