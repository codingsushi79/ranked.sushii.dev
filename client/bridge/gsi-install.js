const fs = require("fs");
const os = require("os");
const path = require("path");

const GSI_CONFIG_FILENAME = "gamestate_integration_ranked_cs2.cfg";
const LEGACY_GSI_FILENAME = "gamestate_integration_cs2sync.cfg";
const GSI_PORT = 3001;

function gsiConfigContents(port) {
  return `"Ranked CS2"
{
    "uri"               "http://127.0.0.1:${port}/"
    "timeout"           "5.0"
    "buffer"            "0.1"
    "throttle"          "0.1"
    "heartbeat"         "30.0"
    "data"
    {
        "provider"                  "1"
        "map"                       "1"
        "map_round_wins"            "1"
        "round"                     "1"
        "player_id"                 "1"
        "player_state"              "1"
        "player_match_stats"        "1"
        "player_weapons"            "0"
        "player_position"           "0"
        "phase_countdowns"          "1"
        "allplayers_id"             "1"
        "allplayers_state"          "1"
        "allplayers_match_stats"    "1"
        "allplayers_weapons"        "0"
        "allplayers_position"       "0"
        "allgrenades"               "0"
        "bomb"                      "0"
    }
}
`;
}

function getCs2CfgDirectories() {
  const candidates = [];

  if (process.platform === "win32") {
    const programFiles =
      process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
    candidates.push(
      path.join(
        programFiles,
        "Steam",
        "steamapps",
        "common",
        "Counter-Strike Global Offensive",
        "game",
        "csgo",
        "cfg"
      ),
      path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Programs",
        "Steam",
        "steamapps",
        "common",
        "Counter-Strike Global Offensive",
        "game",
        "csgo",
        "cfg"
      )
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Steam",
        "steamapps",
        "common",
        "Counter-Strike Global Offensive",
        "game",
        "csgo",
        "cfg"
      )
    );
  } else {
    candidates.push(
      path.join(
        os.homedir(),
        ".steam",
        "steam",
        "steamapps",
        "common",
        "Counter-Strike Global Offensive",
        "game",
        "csgo",
        "cfg"
      ),
      path.join(
        os.homedir(),
        ".local",
        "share",
        "Steam",
        "steamapps",
        "common",
        "Counter-Strike Global Offensive",
        "game",
        "csgo",
        "cfg"
      )
    );
  }

  return [...new Set(candidates.filter((dir) => fs.existsSync(dir)))];
}

function isGsiInstalled(cfgDir) {
  return (
    fs.existsSync(path.join(cfgDir, GSI_CONFIG_FILENAME)) ||
    fs.existsSync(path.join(cfgDir, LEGACY_GSI_FILENAME))
  );
}

function installGsiConfig(port = GSI_PORT) {
  const installedTo = [];
  const errors = [];
  const cfgDirs = getCs2CfgDirectories();

  if (cfgDirs.length === 0) {
    return {
      ok: false,
      installedTo,
      cfgDirs,
      errors: ["Counter-Strike 2 is not installed — install it from Steam first"],
      port,
    };
  }

  for (const cfgDir of cfgDirs) {
    try {
      const filePath = path.join(cfgDir, GSI_CONFIG_FILENAME);
      fs.writeFileSync(filePath, gsiConfigContents(port), "utf8");
      installedTo.push(filePath);
    } catch (err) {
      errors.push(`${cfgDir}: ${err.message}`);
    }
  }

  return {
    ok: installedTo.length > 0,
    installedTo,
    cfgDirs,
    errors,
    port,
  };
}

function detectGsiInstalled() {
  const cfgDirs = getCs2CfgDirectories();
  return cfgDirs.some(isGsiInstalled);
}

module.exports = {
  GSI_CONFIG_FILENAME,
  GSI_PORT,
  getCs2CfgDirectories,
  detectGsiInstalled,
  installGsiConfig,
};
