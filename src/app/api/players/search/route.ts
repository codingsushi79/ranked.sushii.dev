import { NextRequest } from "next/server";
import { searchPlayers } from "@/lib/player-search";
import { jsonOk } from "@/lib/api";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const players = await searchPlayers(q);
  return jsonOk({ players });
}
