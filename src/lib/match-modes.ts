/** Modes that count toward ranked Elo. */
export const ALLOWED_MATCH_MODES = ["competitive", "premier"] as const;

export type AllowedMatchMode = (typeof ALLOWED_MATCH_MODES)[number];

const MODE_ALIASES: Record<string, AllowedMatchMode> = {
  competitive: "competitive",
  comp: "competitive",
  premier: "premier",
};

export function normalizeMatchMode(
  mode: string | undefined | null
): AllowedMatchMode | null {
  if (!mode) return null;
  const key = mode.toLowerCase().trim();
  if (key in MODE_ALIASES) return MODE_ALIASES[key];
  if ((ALLOWED_MATCH_MODES as readonly string[]).includes(key)) {
    return key as AllowedMatchMode;
  }
  return null;
}

export function isAllowedMatchMode(mode: string | undefined | null): boolean {
  return normalizeMatchMode(mode) !== null;
}

export const ALLOWED_MATCH_MODES_LABEL = "Competitive and Premier only";
