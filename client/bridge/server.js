const http = require("http");
const path = require("path");
const state = require("./state");
const { normalizeMatchMode, isAllowedMatchMode } = require("./modes");
const { inspectJsiScripts } = require("./jsi-install");

const MODE_REJECT_MSG =
  "Only Competitive and Premier matches are rated";

const PORT = 27500;
const API_URL = process.env.RANKED_API_URL || "https://ranked.sushii.dev";

function getClientId(config) {
  return config.clientId || config.token || null;
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function reportMatch(config, payload) {
  const clientId = getClientId(config);
  const res = await fetch(`${API_URL}/api/matches/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientId}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `API error (${res.status}): ${text.slice(0, 200) || res.statusText}`
    );
  }
  if (!res.ok) throw new Error(data.error || "Report failed");
  return data;
}

function createServer(getConfig, saveConfig, reinstallJsi) {
  return http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      if (req.method === "GET" && req.url === "/api/status") {
        const config = getConfig();
        state.setClientId(getClientId(config));
        const jsiInstall = inspectJsiScripts(config);
        state.setJsiInstall(jsiInstall);
        sendJson(res, 200, { ...state.getStatus(), apiUrl: API_URL });
        return;
      }

      if (req.method === "POST" && req.url === "/api/jsi/install") {
        const result = reinstallJsi ? reinstallJsi() : null;
        if (!result) {
          sendJson(res, 500, { error: "Reinstall unavailable" });
          return;
        }
        sendJson(res, 200, { jsiInstall: result });
        return;
      }

      if (req.method === "POST" && req.url === "/api/client-id") {
        const body = await readBody(req);
        const clientId = String(body.clientId || body.token || "").trim();
        if (!clientId) {
          sendJson(res, 400, { error: "Client ID required" });
          return;
        }
        const config = getConfig();
        config.clientId = clientId;
        delete config.token;
        saveConfig(config);
        state.setClientId(clientId);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "DELETE" && req.url === "/api/client-id") {
        const config = getConfig();
        delete config.clientId;
        delete config.token;
        saveConfig(config);
        state.setClientId(null);
        sendJson(res, 200, { ok: true });
        return;
      }

      // Legacy token endpoints
      if (req.method === "POST" && req.url === "/api/token") {
        const body = await readBody(req);
        req.url = "/api/client-id";
        body.clientId = body.token;
        const config = getConfig();
        const clientId = String(body.clientId || "").trim();
        if (!clientId) {
          sendJson(res, 400, { error: "Client ID required" });
          return;
        }
        config.clientId = clientId;
        delete config.token;
        saveConfig(config);
        state.setClientId(clientId);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "DELETE" && req.url === "/api/token") {
        const config = getConfig();
        delete config.clientId;
        delete config.token;
        saveConfig(config);
        state.setClientId(null);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "POST" && req.url === "/match/start") {
        const body = await readBody(req);
        const mode = normalizeMatchMode(body.mode);
        if (!mode) {
          sendJson(res, 400, { error: MODE_REJECT_MSG, ignored: true });
          return;
        }
        const players = body.players ? Object.keys(body.players).length : 0;
        state.startTracking({
          externalId: body.externalId || body.matchId || `cs2-${Date.now()}`,
          map: body.map || body.mapName,
          mode,
          playerCount: body.playerCount ?? players,
        });
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "POST" && req.url === "/match/update") {
        const body = await readBody(req);
        const count = body.playerCount ?? (body.players ? Object.keys(body.players).length : undefined);
        if (count != null) state.updateTracking({ playerCount: count });
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "POST" && req.url === "/match/stop") {
        state.stopTracking();
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "POST" && req.url === "/match/error") {
        const body = await readBody(req);
        state.setLastReport({
          ok: false,
          externalId: body.externalId || `gsi-${Date.now()}`,
          message: body.message || "Match not reported",
          at: new Date().toISOString(),
        });
        state.stopTracking();
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "POST" && req.url === "/cs2/status") {
        const body = await readBody(req);
        state.setCs2Status(body);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "POST" && req.url === "/match") {
        const config = getConfig();
        if (!getClientId(config)) {
          sendJson(res, 401, { error: "No Client ID saved — open the client and save your Client ID" });
          return;
        }

        const body = await readBody(req);
        const mode = normalizeMatchMode(body.mode);
        if (!mode) {
          state.stopTracking();
          sendJson(res, 400, { error: MODE_REJECT_MSG, ignored: true });
          return;
        }
        body.mode = mode;
        const externalId = body.externalId || `cs2-${Date.now()}`;

        try {
          const result = await reportMatch(config, body);
          state.setLastReport({
            ok: true,
            externalId,
            message: result.duplicate ? "Already reported" : "Reported",
            at: new Date().toISOString(),
          });
          state.stopTracking();
          sendJson(res, 200, { ok: true, result });
        } catch (err) {
          state.setLastReport({
            ok: false,
            externalId,
            message: err.message,
            at: new Date().toISOString(),
          });
          state.stopTracking();
          sendJson(res, 500, { error: err.message });
        }
        return;
      }

      if (req.method === "GET" && req.url === "/health") {
        sendJson(res, 200, { ok: true, api: API_URL });
        return;
      }

      res.writeHead(404);
      res.end();
    } catch (err) {
      sendJson(res, 500, { error: err.message });
    }
  });
}

function listen(server, onReady) {
  server.listen(PORT, "127.0.0.1", () => {
    if (onReady) onReady(PORT);
  });
  return server;
}

module.exports = {
  PORT,
  API_URL,
  createServer,
  listen,
};
