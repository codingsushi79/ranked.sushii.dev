import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";
import {
  getFinaleContext,
  banFinaleMap,
  serializeFinale,
} from "@/lib/finale";
import { jsonError, jsonOk } from "@/lib/api";

const schema = z.object({ map: z.string().min(1) });

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return jsonError("Unauthorized", 401);

  const ctx = await getFinaleContext(userId);
  if (!ctx.finale || !ctx.access.canView) return jsonError("Forbidden", 403);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid map");

  try {
    await banFinaleMap(ctx.finale.id, parsed.data.map, ctx.access);
    const updated = await getFinaleContext(userId);
    return jsonOk({ finale: serializeFinale(updated) });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Ban failed", 400);
  }
}
