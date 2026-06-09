import fs from "fs";
import os from "os";
import path from "path";
import { app } from "electron";
import { DEFAULT_SETTINGS, type AppSettings, type StoredAuth } from "../shared/types";
import { normalizeTheme } from "../shared/theme";

const SETTINGS_FILE = "settings.json";
const AUTH_FILE = "auth.json";

function getUserDataPath(filename: string) {
  return path.join(app.getPath("userData"), filename);
}

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export class SettingsStore {
  private settingsPath = getUserDataPath(SETTINGS_FILE);
  private authPath = getUserDataPath(AUTH_FILE);

  get(): AppSettings {
    const stored = readJson<Partial<AppSettings>>(this.settingsPath);
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    const theme = normalizeTheme(merged.theme);
    return {
      ...merged,
      theme,
      overlayOpacity: theme.overlayOpacity,
    };
  }

  save(next: AppSettings) {
    const theme = normalizeTheme(next.theme);
    writeJson(this.settingsPath, {
      ...next,
      theme,
      overlayOpacity: theme.overlayOpacity,
    });
  }

  getAuth(): StoredAuth | null {
    return readJson<StoredAuth>(this.authPath);
  }

  saveAuth(auth: StoredAuth) {
    writeJson(this.authPath, auth);
  }

  clearAuth() {
    if (fs.existsSync(this.authPath)) {
      fs.unlinkSync(this.authPath);
    }
  }

  getCs2CfgDirectory(): string | null {
    const candidates: string[] = [];

    if (process.platform === "win32") {
      const programFiles = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
      candidates.push(
        path.join(programFiles, "Steam", "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo", "cfg"),
        path.join(os.homedir(), "AppData", "Local", "Programs", "Steam", "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo", "cfg")
      );
    } else if (process.platform === "darwin") {
      candidates.push(
        path.join(os.homedir(), "Library", "Application Support", "Steam", "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo", "cfg")
      );
    } else {
      candidates.push(
        path.join(os.homedir(), ".steam", "steam", "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo", "cfg"),
        path.join(os.homedir(), ".local", "share", "Steam", "steamapps", "common", "Counter-Strike Global Offensive", "game", "csgo", "cfg")
      );
    }

    return candidates.find((dir) => fs.existsSync(dir)) ?? null;
  }
}
