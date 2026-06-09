// Ranked CS2 JSI script — installed automatically by the desktop client
// Posts match results to the local desktop client at localhost:27500
// Rated modes: Competitive and Premier only

const BRIDGE = "http://127.0.0.1:27500";

const ALLOWED_MODES = { competitive: true, comp: true, premier: true };

function normalizeMode(mode) {
  if (!mode) return "competitive";
  const key = String(mode).toLowerCase().trim();
  if (key === "comp") return "competitive";
  if (ALLOWED_MODES[key]) return key === "comp" ? "competitive" : key;
  return null;
}

let matchState = {
  externalId: null,
  map: null,
  mode: "competitive",
  players: {},
  winnerTeam: null,
  team0Score: null,
  team1Score: null,
  demoShareCode: null,
  demoUrl: null,
};

function resetMatch() {
  matchState = {
    externalId: null,
    map: null,
    mode: "competitive",
    players: {},
    winnerTeam: null,
    team0Score: null,
    team1Score: null,
    demoShareCode: null,
    demoUrl: null,
  };
}

function trackPlayer(steamId, team) {
  if (!matchState.players[steamId]) {
    matchState.players[steamId] = {
      steamId,
      team,
      kills: 0,
      deaths: 0,
      assists: 0,
      headshots: 0,
      mvps: 0,
      damage: 0,
      adr: 0,
    };
  }
}

async function notifyBridge(path, body) {
  try {
    await fetch(`${BRIDGE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* bridge offline */
  }
}

async function submitMatch() {
  const players = Object.values(matchState.players);
  if (players.length < 2 || matchState.winnerTeam === null) return;

  const mode = normalizeMode(matchState.mode);
  if (!mode) {
    console.log("[Ranked CS2] Match ignored — only Competitive and Premier are rated");
    resetMatch();
    return;
  }
  matchState.mode = mode;

  const payload = {
    externalId: matchState.externalId || `cs2-${Date.now()}`,
    map: matchState.map || "unknown",
    mode: matchState.mode,
    winnerTeam: matchState.winnerTeam,
    team0Score: matchState.team0Score ?? undefined,
    team1Score: matchState.team1Score ?? undefined,
    demoShareCode: matchState.demoShareCode ?? undefined,
    demoUrl: matchState.demoUrl ?? undefined,
    players,
  };

  try {
    await fetch(`${BRIDGE}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("[Ranked CS2] Match submitted");
  } catch (e) {
    console.log("[Ranked CS2] Bridge offline — is the desktop client running?");
  }
  resetMatch();
}

// Hook into game events (adapt to your JSI environment's event API)
// Example handlers — wire these to your CS2 JSI event callbacks:

function onMatchStart(data) {
  resetMatch();
  const mode = normalizeMode(data.mode);
  if (!mode) {
    console.log("[Ranked CS2] Match ignored — only Competitive and Premier are rated");
    return;
  }
  matchState.externalId = data.matchId;
  matchState.map = data.mapName;
  matchState.mode = mode;
  notifyBridge("/match/start", {
    externalId: matchState.externalId,
    map: matchState.map,
    mode: matchState.mode,
    playerCount: 0,
  });
}

function onPlayerConnect(data) {
  trackPlayer(data.steamId, data.team);
  notifyBridge("/match/update", {
    playerCount: Object.keys(matchState.players).length,
  });
}

function onKill(data) {
  trackPlayer(data.attackerSteamId, data.attackerTeam);
  trackPlayer(data.victimSteamId, data.victimTeam);
  if (matchState.players[data.attackerSteamId]) {
    matchState.players[data.attackerSteamId].kills++;
    if (data.headshot) matchState.players[data.attackerSteamId].headshots++;
  }
  if (matchState.players[data.victimSteamId]) {
    matchState.players[data.victimSteamId].deaths++;
  }
  notifyBridge("/match/update", {
    playerCount: Object.keys(matchState.players).length,
  });
}

function onAssist(data) {
  trackPlayer(data.assisterSteamId, data.assisterTeam);
  if (matchState.players[data.assisterSteamId]) {
    matchState.players[data.assisterSteamId].assists++;
  }
  notifyBridge("/match/update", {
    playerCount: Object.keys(matchState.players).length,
  });
}

function onMatchEnd(data) {
  matchState.winnerTeam = data.winnerTeam;
  matchState.team0Score = data.team0Score ?? data.scoreTeam0 ?? null;
  matchState.team1Score = data.team1Score ?? data.scoreTeam1 ?? null;
  matchState.demoShareCode = data.demoShareCode ?? data.shareCode ?? null;
  matchState.demoUrl = data.demoUrl ?? null;
  for (const p of data.players || []) {
    trackPlayer(p.steamId, p.team);
    const tracked = matchState.players[p.steamId];
    if (tracked) {
      tracked.kills = p.kills ?? tracked.kills;
      tracked.deaths = p.deaths ?? tracked.deaths;
      tracked.assists = p.assists ?? tracked.assists;
      tracked.headshots = p.headshots ?? tracked.headshots;
      tracked.mvps = p.mvps ?? tracked.mvps;
      tracked.damage = p.damage ?? tracked.damage;
      tracked.adr = p.adr ?? tracked.adr;
    }
  }
  submitMatch();
}

console.log("[Ranked CS2] JSI script loaded — bridge at", BRIDGE);
if (typeof globalThis !== "undefined") {
  globalThis.rankedCs2 = {
    onMatchStart,
    onPlayerConnect,
    onKill,
    onAssist,
    onMatchEnd,
  };
  globalThis.onMatchStart = onMatchStart;
  globalThis.onPlayerConnect = onPlayerConnect;
  globalThis.onKill = onKill;
  globalThis.onAssist = onAssist;
  globalThis.onMatchEnd = onMatchEnd;
}
