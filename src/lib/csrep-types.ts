export type CsrepTrustLabel =
  | "Trusted"
  | "Normal"
  | "Caution"
  | "Suspicious"
  | "Highly Suspicious"
  | "Autoflagged"
  | "Overwatch Convicted"
  | "Unknown";

export type CsrepTrust = {
  steamId: string;
  score: number | null;
  label: CsrepTrustLabel;
  autoflagged: boolean;
  overwatchConvicted: boolean;
  reportsCount: number;
  profileUrl: string;
  fetchedAt: Date;
  configured: boolean;
};

export type CsrepTrustJson = Omit<CsrepTrust, "fetchedAt">;

export function csrepProfileUrl(steamId: string): string {
  return `https://csrep.gg/player/${steamId}`;
}

export function csrepTrustToJson(trust: CsrepTrust | null | undefined): CsrepTrustJson | null {
  if (!trust) return null;
  const { fetchedAt: _fetchedAt, ...rest } = trust;
  return rest;
}

export function scoreToTrustLabel(
  score: number,
  flags: { autoflagged?: boolean; overwatchConvicted?: boolean } = {}
): CsrepTrustLabel {
  if (flags.overwatchConvicted) return "Overwatch Convicted";
  if (flags.autoflagged) return "Autoflagged";
  if (score >= 85) return "Trusted";
  if (score >= 70) return "Normal";
  if (score >= 55) return "Caution";
  if (score >= 40) return "Suspicious";
  return "Highly Suspicious";
}

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function pickBool(...values: unknown[]): boolean {
  return values.some(
    (v) => v === true || v === "true" || v === 1 || v === "1"
  );
}

/** Parse CSRep API payloads (field names may vary by API version). */
export function parseCsrepApiPayload(
  steamId: string,
  payload: unknown
): Omit<CsrepTrust, "fetchedAt" | "configured"> {
  const root =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const data =
    root.result && typeof root.result === "object"
      ? (root.result as Record<string, unknown>)
      : root.data && typeof root.data === "object"
        ? (root.data as Record<string, unknown>)
        : root;

  const player =
    data.player && typeof data.player === "object"
      ? (data.player as Record<string, unknown>)
      : data;

  const bans =
    player.bans && typeof player.bans === "object"
      ? (player.bans as Record<string, unknown>)
      : undefined;

  const score = pickNumber(
    player.trust_rating,
    player.trustRating,
    player.score,
    player.csrepScore,
    player.csrep_score,
    player.reputation,
    player.reputationScore,
    player.trustScore,
    player.trust_score,
    player.rating
  );

  const autoflagged = pickBool(
    player.autoflagged,
    player.autoFlagged,
    player.isAutoflagged,
    player.aiFlagged,
    player.ai_flagged,
    player.flagged
  );

  const overwatchConvicted = pickBool(
    player.overwatchConvicted,
    player.overwatch_convicted,
    player.isOverwatchConvicted,
    player.convicted,
    bans?.overwatch
  );

  const reportsCount =
    pickNumber(player.reports, player.reportsCount, player.reportCount) ?? 0;

  const apiLabel = pickString(
    player.label,
    player.reputationLabel,
    player.trustLabel,
    player.status
  );

  const label =
    (apiLabel as CsrepTrustLabel | null) ??
    (score != null
      ? scoreToTrustLabel(score, { autoflagged, overwatchConvicted })
      : overwatchConvicted
        ? "Overwatch Convicted"
        : autoflagged
          ? "Autoflagged"
          : "Unknown");

  return {
    steamId,
    score,
    label,
    autoflagged,
    overwatchConvicted,
    reportsCount,
    profileUrl: csrepProfileUrl(steamId),
  };
}
