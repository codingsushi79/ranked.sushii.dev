import fs from "fs";
import path from "path";

function loadEnvFile() {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function readBakedConfig() {
  const bakedPath = path.join(__dirname, "twitch-config.baked.json");
  if (!fs.existsSync(bakedPath)) {
    return { clientId: "", clientSecret: "" };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(bakedPath, "utf8")) as {
      clientId?: string;
      clientSecret?: string;
    };
    return {
      clientId: parsed.clientId?.trim() ?? "",
      clientSecret: parsed.clientSecret?.trim() ?? "",
    };
  } catch {
    return { clientId: "", clientSecret: "" };
  }
}

loadEnvFile();

const baked = readBakedConfig();

export const TWITCH_CLIENT_ID =
  process.env.CS2SYNC_TWITCH_CLIENT_ID?.trim() || baked.clientId;
export const TWITCH_CLIENT_SECRET =
  process.env.CS2SYNC_TWITCH_CLIENT_SECRET?.trim() || baked.clientSecret;

export function isTwitchAppConfigured() {
  return TWITCH_CLIENT_ID.length > 0 && TWITCH_CLIENT_SECRET.length > 0;
}
