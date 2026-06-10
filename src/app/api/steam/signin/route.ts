import { NextRequest, NextResponse } from "next/server";
import { getSteamLoginUrl } from "@/lib/steam";
import {
  newSteamAuthState,
  safeNextPath,
  setSteamAuthCookie,
} from "@/lib/steam-auth";

export async function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next"));
  const terms = req.nextUrl.searchParams.get("terms") === "1";

  await setSteamAuthCookie(newSteamAuthState(next, terms));

  const returnUrl = new URL("/api/steam/callback", req.url).toString();
  return NextResponse.redirect(getSteamLoginUrl(returnUrl));
}
