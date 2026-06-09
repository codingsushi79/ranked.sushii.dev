import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const outPath = path.join(root, "electron", "twitch-config.baked.json");

function loadEnvFile() {
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

const payload = {
  clientId: process.env.CS2SYNC_TWITCH_CLIENT_ID?.trim() ?? "",
  clientSecret: process.env.CS2SYNC_TWITCH_CLIENT_SECRET?.trim() ?? "",
};

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

if (!payload.clientId) {
  console.warn("Warning: CS2SYNC_TWITCH_CLIENT_ID missing — shipped app sign-in will not work.");
} else if (!payload.clientSecret) {
  console.warn(
    "Warning: CS2SYNC_TWITCH_CLIENT_SECRET missing — Twitch sign-in will fail with invalid client credentials."
  );
} else {
  console.log("Baked Twitch config for build.");
}
