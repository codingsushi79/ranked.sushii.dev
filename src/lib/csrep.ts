import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { csrepProfiles } from "@/db/schema";
import {
  parseCsrepApiPayload,
  csrepProfileUrl,
  type CsrepTrust,
  type CsrepTrustLabel,
} from "@/lib/csrep-types";

const CACHE_MS = 60 * 60 * 1000;
const MISS_CACHE_MS = 15 * 60 * 1000;

function isConfigured(): boolean {
  return !!process.env.CSREP_API_KEY?.trim();
}

function apiBaseUrl(): string {
  const raw =
    process.env.CSREP_API_BASE_URL?.replace(/\/$/, "") ??
    "https://csrep.gg/api";
  // Older docs used /api/v1 — CSRep serves player data at /api/player/:id.
  return raw.replace(/\/v1$/, "");
}

function rowToTrust(row: typeof csrepProfiles.$inferSelect): CsrepTrust {
  return {
    steamId: row.steamId,
    score: row.score,
    label: row.label as CsrepTrustLabel,
    autoflagged: row.autoflagged,
    overwatchConvicted: row.overwatchConvicted,
    reportsCount: row.reportsCount,
    profileUrl: row.profileUrl,
    fetchedAt: row.fetchedAt,
    configured: isConfigured(),
  };
}

function fallbackTrust(steamId: string): CsrepTrust {
  return {
    steamId,
    score: null,
    label: "Unknown",
    autoflagged: false,
    overwatchConvicted: false,
    reportsCount: 0,
    profileUrl: csrepProfileUrl(steamId),
    fetchedAt: new Date(0),
    configured: isConfigured(),
  };
}

async function fetchFromApi(steamId: string) {
  const apiKey = process.env.CSREP_API_KEY?.trim();
  if (!apiKey) return null;

  const url = `${apiBaseUrl()}/player/${steamId}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-API-Key": apiKey,
    },
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!res.ok || !json || json.status === "ERROR") {
    console.warn(
      `CSRep API ${res.status} for ${steamId}:`,
      typeof json?.message === "string" ? json.message : url
    );
    return null;
  }

  return parseCsrepApiPayload(steamId, json);
}

async function upsertCache(
  trust: Omit<CsrepTrust, "fetchedAt" | "configured">,
  fetchedAt: Date
) {
  await db
    .insert(csrepProfiles)
    .values({
      steamId: trust.steamId,
      score: trust.score,
      label: trust.label,
      autoflagged: trust.autoflagged,
      overwatchConvicted: trust.overwatchConvicted,
      reportsCount: trust.reportsCount,
      profileUrl: trust.profileUrl,
      fetchedAt,
    })
    .onConflictDoUpdate({
      target: csrepProfiles.steamId,
      set: {
        score: trust.score,
        label: trust.label,
        autoflagged: trust.autoflagged,
        overwatchConvicted: trust.overwatchConvicted,
        reportsCount: trust.reportsCount,
        profileUrl: trust.profileUrl,
        fetchedAt,
      },
    });
}

export async function clearCsrepCache(steamId?: string) {
  if (steamId) {
    await db.delete(csrepProfiles).where(eq(csrepProfiles.steamId, steamId));
    return;
  }
  await db.delete(csrepProfiles);
}

export async function getCsrepTrust(
  steamId: string | null | undefined,
  options: { forceRefresh?: boolean } = {}
): Promise<CsrepTrust | null> {
  if (!steamId) return null;

  const cached = await db.query.csrepProfiles.findFirst({
    where: eq(csrepProfiles.steamId, steamId),
  });

  const now = Date.now();
  const cacheFresh =
    cached &&
    now - cached.fetchedAt.getTime() <
      (cached.score != null ? CACHE_MS : MISS_CACHE_MS);

  if (cached && cacheFresh && !options.forceRefresh) {
    return rowToTrust(cached);
  }

  const fetched = await fetchFromApi(steamId);
  const fetchedAt = new Date();

  if (fetched) {
    await upsertCache(fetched, fetchedAt);
    return { ...fetched, fetchedAt, configured: isConfigured() };
  }

  if (cached) {
    return rowToTrust(cached);
  }

  await upsertCache(
    {
      steamId,
      score: null,
      label: "Unknown",
      autoflagged: false,
      overwatchConvicted: false,
      reportsCount: 0,
      profileUrl: csrepProfileUrl(steamId),
    },
    fetchedAt
  );

  return fallbackTrust(steamId);
}

export async function getCsrepTrustBatch(
  steamIds: string[]
): Promise<Map<string, CsrepTrust>> {
  const unique = [...new Set(steamIds.filter(Boolean))];
  const map = new Map<string, CsrepTrust>();
  if (unique.length === 0) return map;

  const cached = await db.query.csrepProfiles.findMany({
    where: inArray(csrepProfiles.steamId, unique),
  });

  for (const row of cached) {
    map.set(row.steamId, rowToTrust(row));
  }

  const stale = unique.filter((id) => {
    const row = map.get(id);
    if (!row) return true;
    const age = Date.now() - row.fetchedAt.getTime();
    return age >= (row.score != null ? CACHE_MS : MISS_CACHE_MS);
  });

  await Promise.all(
    stale.slice(0, 25).map(async (steamId) => {
      const trust = await getCsrepTrust(steamId);
      if (trust) map.set(steamId, trust);
    })
  );

  for (const steamId of unique) {
    if (!map.has(steamId)) {
      map.set(steamId, fallbackTrust(steamId));
    }
  }

  return map;
}

export async function countCsrepCache() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(csrepProfiles);
  return row?.count ?? 0;
}
