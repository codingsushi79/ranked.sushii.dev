import { NextRequest } from "next/server";
import { authenticateClient } from "@/lib/client-auth";
import { processMatchReport } from "@/lib/match-processor";
import { matchReportSchema } from "@/lib/validators";
import { jsonError, jsonOk } from "@/lib/api";

export async function POST(req: NextRequest) {
  const auth = await authenticateClient(req.headers.get("authorization"));
  if (!auth) {
    return jsonError(
      "Unauthorized — sign in with Steam and use a valid client ID",
      401
    );
  }

  try {
    const body = await req.json();
    const parsed = matchReportSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid match data");
    }

    const result = await processMatchReport(parsed.data);
    return jsonOk(result);
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Failed to process match";
    return jsonError(message, 500);
  }
}
