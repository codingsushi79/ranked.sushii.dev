/** Keep in sync with src/lib/match-modes.ts */
const ALLOWED = ["competitive", "premier"];

const ALIASES = {
  competitive: "competitive",
  comp: "competitive",
  premier: "premier",
};

function normalizeMatchMode(mode) {
  if (!mode) return null;
  const key = String(mode).toLowerCase().trim();
  if (ALIASES[key]) return ALIASES[key];
  if (ALLOWED.includes(key)) return key;
  return null;
}

function isAllowedMatchMode(mode) {
  return normalizeMatchMode(mode) !== null;
}

module.exports = { normalizeMatchMode, isAllowedMatchMode, ALLOWED };
