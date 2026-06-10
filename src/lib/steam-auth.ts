import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateToken } from "@/lib/auth";

export const STEAM_AUTH_COOKIE = "steam_auth";
const STEAM_AUTH_MAX_AGE = 600;

export type SteamAuthMode = "login" | "link";

export type SteamAuthState = {
  nonce: string;
  next: string | null;
  mode: SteamAuthMode;
};

export async function setSteamAuthCookie(state: SteamAuthState) {
  const cookieStore = await cookies();
  cookieStore.set(STEAM_AUTH_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STEAM_AUTH_MAX_AGE,
  });
}

export async function readSteamAuthCookie(): Promise<SteamAuthState | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(STEAM_AUTH_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SteamAuthState;
    if (
      !parsed.nonce ||
      (parsed.mode !== "login" && parsed.mode !== "link")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearSteamAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(STEAM_AUTH_COOKIE);
}

export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export function newSteamAuthState(
  next: string | null,
  mode: SteamAuthMode
): SteamAuthState {
  return {
    nonce: generateToken(),
    next,
    mode,
  };
}
