import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminResponse } from "@/lib/admin";
import {
  getFinaleContext,
  updateFinaleAdmin,
  serializeFinale,
} from "@/lib/finale";
import { getSessionUserId } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";

const schema = z.object({
  joinLink: z.string().nullable().optional(),
  gameTime: z.string().nullable().optional(),
  team0Score: z.number().int().min(0).optional(),
  team1Score: z.number().int().min(0).optional(),
  phase: z.enum(["pick_ban", "scheduled", "live", "completed"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const admin = await requireAdminResponse();
  if (admin instanceof Response) return admin;

  const userId = await getSessionUserId();
  const ctx = await getFinaleContext(userId);
  if (!ctx.finale) return jsonError("Finale not active", 404);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    await updateFinaleAdmin(ctx.finale.id, parsed.data);
    const updated = await getFinaleContext(userId);
    return jsonOk({ finale: serializeFinale(updated) });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Update failed", 500);
  }
}
