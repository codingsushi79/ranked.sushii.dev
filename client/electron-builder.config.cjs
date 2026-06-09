const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const pkg = require("./package.json");
const updateUrl =
  process.env.RANKED_UPDATE_URL?.trim().replace(/\/$/, "") ||
  "https://ranked.sushii.dev/downloads";
const outputDir =
  process.env.ELECTRON_BUILDER_OUTPUT?.trim() || "../public/downloads/build";

/** @type {import("electron-builder").Configuration} */
module.exports = {
  ...pkg.build,
  directories: {
    ...pkg.build.directories,
    output: outputDir,
  },
  publish: {
    provider: "generic",
    url: updateUrl,
  },
};
