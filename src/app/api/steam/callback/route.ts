import { NextRequest, NextResponse } from "next/server";
import { eq, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/auth";
import { verifySteamOpenId, fetchSteamProfile } from "@/lib/steam";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!currentUser?.emailVerified) {
    return NextResponse.redirect(
      new URL("/profile?verify=required", req.url)
    );
  }

  const params = req.nextUrl.searchParams;
  const steamId = await verifySteamOpenId(params);

  if (!steamId) {
    return NextResponse.redirect(
      new URL("/profile?steam=failed", req.url)
    );
  }

  const taken = await db.query.users.findFirst({
    where: and(eq(users.steamId, steamId), ne(users.id, userId)),
  });
  if (taken) {
    return NextResponse.redirect(
      new URL("/profile?steam=taken", req.url)
    );
  }

  const profile = await fetchSteamProfile(steamId);
  await db
    .update(users)
    .set({
      steamId,
      steamName: profile.steamName,
      steamAvatar: profile.steamAvatar,
    })
    .where(eq(users.id, userId));

  return NextResponse.redirect(new URL("/profile?steam=linked", req.url));
}
