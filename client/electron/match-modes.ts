export const ALLOWED_MATCH_MODES = ["competitive", "premier"] as const;

export type AllowedMatchMode = (typeof ALLOWED_MATCH_MODES)[number];

export function normalizeMatchMode(
  mode: string | undefined | null
): AllowedMatchMode | null {
  if (!mode) return null;
  const key = mode.toLowerCase().trim();
  if (key === "comp" || key === "competitive") return "competitive";
  if (key === "premier") return "premier";
  return null;
}

export function isAllowedMatchMode(mode: string | undefined | null): boolean {
  return normalizeMatchMode(mode) !== null;
}

const MODE_LABELS: Record<string, string> = {
  casual: "Casual",
  competitive: "Competitive",
  comp: "Competitive",
  premier: "Premier",
  deathmatch: "Deathmatch",
  wingman: "Wingman",
  arms_race: "Arms Race",
  custom: "Custom",
};

export function formatGameModeLabel(mode: string | null | undefined): string {
  if (!mode) return "This mode";
  const key = mode.toLowerCase().trim();
  if (MODE_LABELS[key]) return MODE_LABELS[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
