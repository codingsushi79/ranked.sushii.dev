import { NextRequest } from "next/server";
import { getCsrepTrust } from "@/lib/csrep";
import { csrepTrustToJson } from "@/lib/csrep-types";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  const { steamId } = await params;
  if (!/^\d{17}$/.test(steamId)) {
    return jsonError("Invalid Steam ID", 400);
  }

  const trust = await getCsrepTrust(steamId, {
    forceRefresh: req.nextUrl.searchParams.get("refresh") === "1",
  });

  if (!trust) return jsonError("Not found", 404);
  return jsonOk({ trust: csrepTrustToJson(trust) });
}
