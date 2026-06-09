const fs = require("fs");
const path = require("path");
const { createServer, listen, PORT } = require("./server");
const state = require("./state");
const {
  installGameIntegration,
  inspectGameIntegration,
} = require("./game-integration");

const CONFIG_PATH = path.join(
  process.env.APPDATA || path.join(require("os").homedir(), ".ranked-cs2"),
  "config.json"
);

function loadConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    return normalizeConfig(config);
  } catch {
    return {};
  }
}

function normalizeConfig(config) {
  if (config.token && !config.clientId) {
    config.clientId = config.token;
    delete config.token;
  }
  return config;
}

function saveConfig(config) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function getStoredClientId(config) {
  return config.clientId || config.token || null;
}

function runGameIntegrationInstall(config) {
  try {
    const result = installGameIntegration(config);
    config.gameIntegration = result;
    config.jsiInstall = result.jsi;
    saveConfig(config);
    state.setJsiInstall(result.jsi);
    state.setGameIntegration(result);
    return result;
  } catch (err) {
    const result = {
      ok: false,
      gsi: { ok: false, errors: [err.message], installedTo: [] },
      jsi: {
        ok: false,
        installedTo: [],
        errors: [err.message],
        cs2Found: [],
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    config.gameIntegration = result;
    config.jsiInstall = result.jsi;
    saveConfig(config);
    state.setJsiInstall(result.jsi);
    state.setGameIntegration(result);
    return result;
  }
}

/** Start the local JSI bridge (no browser window). Returns stop handle. */
function startRankedBridge() {
  let config = loadConfig();
  if (config.token && !config.clientId) {
    saveConfig(config);
  }
  state.setClientId(getStoredClientId(config));
  runGameIntegrationInstall(config);

  const server = createServer(
    () => config,
    (next) => {
      config = normalizeConfig(next);
      saveConfig(config);
    },
    () => {
      config = loadConfig();
      return runGameIntegrationInstall(config);
    }
  );

  listen(server);

  return {
    port: PORT,
    getConfig: () => config,
    reloadConfig: () => {
      config = loadConfig();
      state.setClientId(getStoredClientId(config));
      return config;
    },
    stop: () =>
      new Promise((resolve) => {
        server.close(() => resolve());
      }),
  };
}

module.exports = { startRankedBridge, PORT, CONFIG_PATH, installGameIntegration };
