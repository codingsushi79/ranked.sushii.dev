/** @typedef {{ externalId: string, map: string, mode: string, playerCount: number, startedAt: string }} ActiveMatch */

const state = {
  hasClientId: false,
  clientIdPreview: null,
  tracking: false,
  /** @type {ActiveMatch | null} */
  activeMatch: null,
  lastReport: null,
  lastError: null,
  bridgeStartedAt: new Date().toISOString(),
  jsiInstall: null,
  cs2Connected: false,
  inMatch: false,
  inRatedMatch: false,
  matchMode: null,
  gsiInstalled: false,
  updateRequired: false,
  gameIntegration: null,
};

function setClientId(clientId) {
  state.hasClientId = !!clientId;
  state.clientIdPreview = clientId
    ? `${clientId.slice(0, 8)}…${clientId.slice(-4)}`
    : null;
}

function startTracking(match) {
  state.tracking = true;
  state.activeMatch = {
    externalId: match.externalId,
    map: match.map || "unknown",
    mode: match.mode || "competitive",
    playerCount: match.playerCount ?? 0,
    startedAt: new Date().toISOString(),
  };
  state.lastError = null;
}

function updateTracking(patch) {
  if (!state.activeMatch) return;
  Object.assign(state.activeMatch, patch);
}

function stopTracking() {
  state.tracking = false;
  state.activeMatch = null;
}

function setLastReport(report) {
  state.lastReport = report;
  state.lastError = report.ok ? null : report.message;
}

function setJsiInstall(jsiInstall) {
  state.jsiInstall = jsiInstall;
}

function setCs2Status(patch) {
  if (patch.connected != null) state.cs2Connected = !!patch.connected;
  if (patch.inMatch != null) state.inMatch = !!patch.inMatch;
  if (patch.inRatedMatch != null) state.inRatedMatch = !!patch.inRatedMatch;
  if ("matchMode" in patch) state.matchMode = patch.matchMode ?? null;
  if (patch.gsiInstalled != null) state.gsiInstalled = !!patch.gsiInstalled;
  if (patch.updateRequired != null) state.updateRequired = !!patch.updateRequired;
}

function setGameIntegration(integration) {
  state.gameIntegration = integration;
  if (integration?.jsi) state.jsiInstall = integration.jsi;
  state.gsiInstalled = !!(
    integration?.gsiInstalled ||
    integration?.gsi?.ok
  );
}

function getStatus() {
  return {
    hasClientId: state.hasClientId,
    tracking: state.tracking,
    activeMatch: state.activeMatch,
    lastReport: state.lastReport,
    lastError: state.lastError,
    bridgeStartedAt: state.bridgeStartedAt,
    jsiInstall: state.jsiInstall,
    gameIntegration: state.gameIntegration,
    cs2Connected: state.cs2Connected,
    inMatch: state.inMatch,
    inRatedMatch: state.inRatedMatch,
    matchMode: state.matchMode,
    gsiInstalled: state.gsiInstalled,
    updateRequired: state.updateRequired,
  };
}

module.exports = {
  setClientId,
  startTracking,
  updateTracking,
  stopTracking,
  setLastReport,
  setJsiInstall,
  setGameIntegration,
  setCs2Status,
  getStatus,
};
