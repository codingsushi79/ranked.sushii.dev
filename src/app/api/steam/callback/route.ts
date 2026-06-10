import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { verifySteamOpenId, fetchSteamProfile } from "@/lib/steam";
import {
  clearSteamAuthCookie,
  createUserFromSteam,
  readSteamAuthCookie,
  safeNextPath,
} from "@/lib/steam-auth";

function redirectWithError(req: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, req.url));
}

export async function GET(req: NextRequest) {
  const authState = await readSteamAuthCookie();
  await clearSteamAuthCookie();

  const params = req.nextUrl.searchParams;
  const steamId = await verifySteamOpenId(params);

  if (!steamId) {
    return redirectWithError(req, "steam_failed");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.steamId, steamId),
  });

  if (existing) {
    const profile = await fetchSteamProfile(steamId);
    await db
      .update(users)
      .set({
        steamName: profile.steamName,
        steamAvatar: profile.steamAvatar,
      })
      .where(eq(users.id, existing.id));

    const token = await createSessionToken(existing.id);
    await setSessionCookie(token);

    const next = safeNextPath(authState?.next);
    return NextResponse.redirect(new URL(next ?? "/profile", req.url));
  }

  if (!authState?.terms) {
    return NextResponse.redirect(
      new URL("/signup?error=terms", req.url)
    );
  }

  const profile = await fetchSteamProfile(steamId);
  const created = await createUserFromSteam(
    steamId,
    profile.steamName,
    profile.steamAvatar
  );

  const token = await createSessionToken(created.id);
  await setSessionCookie(token);

  const next = safeNextPath(authState.next);
  return NextResponse.redirect(new URL(next ?? "/profile?welcome=1", req.url));
}
