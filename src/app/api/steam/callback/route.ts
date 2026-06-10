import { NextRequest, NextResponse } from "next/server";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, getSessionUserId, setSessionCookie } from "@/lib/auth";
import { verifySteamOpenId, fetchSteamProfile } from "@/lib/steam";
import {
  clearSteamAuthCookie,
  readSteamAuthCookie,
  safeNextPath,
} from "@/lib/steam-auth";

function redirectTo(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.url));
}

export async function GET(req: NextRequest) {
  const authState = await readSteamAuthCookie();
  await clearSteamAuthCookie();

  const params = req.nextUrl.searchParams;
  const steamId = await verifySteamOpenId(params);

  if (!steamId) {
    return redirectTo(req, "/login?error=steam_failed");
  }

  const mode = authState?.mode ?? "login";
  const sessionUserId = await getSessionUserId();

  if (mode === "link") {
    if (!sessionUserId) {
      const next = safeNextPath(authState?.next);
      const loginNext = next ?? "/signup/link-steam";
      return redirectTo(
        req,
        `/login?next=${encodeURIComponent(loginNext)}&error=login_required`
      );
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, sessionUserId),
    });
    if (!currentUser) {
      return redirectTo(req, "/login");
    }

    if (currentUser.steamId) {
      return redirectTo(req, "/profile?steam=locked");
    }

    const taken = await db.query.users.findFirst({
      where: and(eq(users.steamId, steamId), ne(users.id, sessionUserId)),
    });
    if (taken) {
      return redirectTo(req, "/profile?steam=taken");
    }

    const profile = await fetchSteamProfile(steamId);
    await db
      .update(users)
      .set({
        steamId,
        steamName: profile.steamName,
        steamAvatar: profile.steamAvatar,
      })
      .where(eq(users.id, sessionUserId));

    const next = safeNextPath(authState?.next);
    return redirectTo(req, next ?? "/profile?steam=linked");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.steamId, steamId),
  });

  if (!existing) {
    return redirectTo(req, "/login?error=no_steam_account");
  }

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
  return redirectTo(req, next ?? "/profile");
}
