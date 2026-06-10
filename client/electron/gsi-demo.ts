import type { RawGsiPayload } from "./gsi-server";

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readFromRecord(
  record: Record<string, unknown> | undefined,
  keys: string[]
): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = readString(record[key]);
    if (value) return value;
  }
  return null;
}

/** Best-effort demo share code / URL extraction from CS2 GSI payloads. */
export function extractDemoFromGsi(payload: RawGsiPayload | null | undefined): {
  demoShareCode: string | null;
  demoUrl: string | null;
} {
  if (!payload) {
    return { demoShareCode: null, demoUrl: null };
  }

  const sources: Array<Record<string, unknown> | undefined> = [
    payload as Record<string, unknown>,
    payload.map as Record<string, unknown> | undefined,
    payload.provider as Record<string, unknown> | undefined,
    payload.round as Record<string, unknown> | undefined,
    payload.player as Record<string, unknown> | undefined,
    payload.added as Record<string, unknown> | undefined,
    payload.added?.map as Record<string, unknown> | undefined,
  ];

  if (payload.allplayers) {
    for (const player of Object.values(payload.allplayers)) {
      if (player && typeof player === "object") {
        sources.push(player as Record<string, unknown>);
      }
    }
  }

  let demoShareCode: string | null = null;
  let demoUrl: string | null = null;

  for (const source of sources) {
    demoShareCode ??= readFromRecord(source, [
      "sharecode",
      "share_code",
      "shareCode",
      "demoShareCode",
      "demo_share_code",
      "match_share_code",
      "matchsharecode",
      "replay_share_code",
    ]);
    demoUrl ??= readFromRecord(source, [
      "demoUrl",
      "demo_url",
      "demoLink",
      "demo_link",
      "replay_url",
      "replayUrl",
    ]);
  }

  return { demoShareCode, demoUrl };
}
