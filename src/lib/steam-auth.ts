import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateToken } from "@/lib/auth";
import { isAdminUsername } from "@/lib/admin-config";
import { promoteAdminIfEligible } from "@/lib/admin";
import {
  ensureCurrentSeason,
  getOrCreatePlayerSeason,
} from "@/lib/player";

export const STEAM_AUTH_COOKIE = "steam_auth";
const STEAM_AUTH_MAX_AGE = 600;

export type SteamAuthState = {
  nonce: string;
  next: string | null;
  terms: boolean;
};

export function sanitizeUsername(raw: string, steamId: string): string {
  let base = raw
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (base.length < 3) {
    base = `player_${steamId.slice(-6)}`;
  }

  return base.slice(0, 20);
}

export async function ensureUniqueUsername(base: string): Promise<string> {
  let candidate = base;
  let suffix = 2;

  while (true) {
    const taken = await db.query.users.findFirst({
      where: eq(users.username, candidate),
      columns: { id: true },
    });
    if (!taken) return candidate;

    const suffixStr = `_${suffix}`;
    candidate = `${base.slice(0, Math.max(3, 20 - suffixStr.length))}${suffixStr}`;
    suffix += 1;
  }
}

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
    if (!parsed.nonce || typeof parsed.terms !== "boolean") return null;
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

export async function createUserFromSteam(
  steamId: string,
  steamName: string,
  steamAvatar: string | null
) {
  const baseUsername = sanitizeUsername(steamName, steamId);
  const username = await ensureUniqueUsername(baseUsername);

  const [created] = await db
    .insert(users)
    .values({
      username,
      email: null,
      passwordHash: null,
      emailVerified: true,
      steamId,
      steamName,
      steamAvatar,
      termsAcceptedAt: new Date(),
      isAdmin: isAdminUsername(username),
    })
    .returning();

  await promoteAdminIfEligible(created.id, { username });
  const season = await ensureCurrentSeason();
  await getOrCreatePlayerSeason(created.id, season.id);

  return created;
}

export function newSteamAuthState(
  next: string | null,
  terms: boolean
): SteamAuthState {
  return {
    nonce: generateToken(),
    next,
    terms,
  };
}
