import { NextRequest } from "next/server";
import { getMatchDetail } from "@/lib/matches";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const match = await getMatchDetail(id);
  if (!match) return jsonError("Match not found", 404);
  return jsonOk({ match });
}
