const fs = require("fs");
const path = require("path");
const { createServer, listen, PORT } = require("./server");
const state = require("./state");
const { installJsiScripts } = require("./jsi-install");

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

function runJsiInstall(config) {
  try {
    const result = installJsiScripts(config);
    config.jsiInstall = result;
    saveConfig(config);
    state.setJsiInstall(result);
    return result;
  } catch (err) {
    const result = {
      ok: false,
      installedTo: [],
      errors: [err.message],
      cs2Found: [],
      updatedAt: new Date().toISOString(),
    };
    config.jsiInstall = result;
    saveConfig(config);
    state.setJsiInstall(result);
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
  runJsiInstall(config);

  const server = createServer(
    () => config,
    (next) => {
      config = normalizeConfig(next);
      saveConfig(config);
    },
    () => {
      config = loadConfig();
      return runJsiInstall(config);
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

module.exports = { startRankedBridge, PORT, CONFIG_PATH };
