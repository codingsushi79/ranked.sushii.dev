import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const outPath = path.join(root, "electron", "update-config.baked.json");

export const DEFAULT_UPDATE_URL = "https://ranked.sushii.dev/downloads";

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

const url =
  process.env.RANKED_UPDATE_URL?.trim().replace(/\/$/, "") ||
  process.env.CS2SYNC_UPDATE_URL?.trim().replace(/\/$/, "") ||
  DEFAULT_UPDATE_URL;

fs.writeFileSync(outPath, JSON.stringify({ url }, null, 2));
console.log(`Baked update feed URL: ${url}`);
