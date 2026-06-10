import { NextRequest } from "next/server";
import { z } from "zod";
import { authenticateClient } from "@/lib/client-auth";
import { jsonError, jsonOk } from "@/lib/api";
import { upsertPlayerLive } from "@/lib/player-live";

const liveUpdateSchema = z.object({
  inMatch: z.boolean(),
  map: z.string().optional(),
  mode: z.string().optional(),
  phase: z.string().optional(),
  playerTeam: z.number().int().min(0).max(1).optional(),
  team0Score: z.number().int().min(0).optional(),
  team1Score: z.number().int().min(0).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await authenticateClient(req.headers.get("authorization"));
  if (!auth) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await req.json();
    const parsed = liveUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid live data");
    }

    await upsertPlayerLive(auth.userId, parsed.data);
    return jsonOk({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to update live status", 500);
  }
}
