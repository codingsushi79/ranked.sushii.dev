import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";
import {
  getFinaleContext,
  updateFinaleTeamNames,
  serializeFinale,
} from "@/lib/finale";
import { jsonError, jsonOk } from "@/lib/api";

const schema = z.object({
  team0Name: z.string().max(32).optional(),
  team1Name: z.string().max(32).optional(),
});

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Unauthorized", 401);

  const ctx = await getFinaleContext(userId);
  if (!ctx.finale || !ctx.access.canView) return jsonError("Forbidden", 403);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input");

  try {
    await updateFinaleTeamNames(ctx.finale.id, parsed.data, ctx.access);
    const updated = await getFinaleContext(userId);
    return jsonOk({ finale: serializeFinale(updated) });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Update failed", 400);
  }
}
