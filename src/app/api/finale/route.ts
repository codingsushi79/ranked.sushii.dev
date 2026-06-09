import { getSessionUserId } from "@/lib/auth";
import { getFinaleContext, serializeFinale } from "@/lib/finale";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  const userId = await getSessionUserId();
  const ctx = await getFinaleContext(userId);

  if (!ctx.finale) {
    return jsonOk({ finale: null, access: ctx.access });
  }

  if (!ctx.access.canView) {
    return jsonError("Forbidden", 403);
  }

  return jsonOk({
    finale: serializeFinale(ctx),
    access: ctx.access,
    timeline: {
      phase: ctx.timeline.phase,
      isLocked: ctx.timeline.isLocked,
    },
  });
}
