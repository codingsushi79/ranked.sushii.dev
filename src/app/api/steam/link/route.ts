import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/auth";
import { getSteamLoginUrl } from "@/lib/steam";

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user?.emailVerified) {
    return NextResponse.redirect(
      new URL("/profile?verify=required", req.url)
    );
  }

  const returnUrl = new URL("/api/steam/callback", req.url).toString();
  return NextResponse.redirect(getSteamLoginUrl(returnUrl));
}
