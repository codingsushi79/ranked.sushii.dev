import { app, ipcMain } from "electron";
import { autoUpdater } from "electron-updater";
import { spawn } from "child_process";
import { createWriteStream } from "fs";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import type { UpdateStatusPayload } from "../shared/types";
import { broadcast } from "./windows";

const DEFAULT_UPDATE_URL = "https://ranked.sushii.dev/downloads";
const AUTO_INSTALL_DELAY_MS = 3_000;

let eventsAttached = false;
let updaterConfigured = false;
let manifestDownloadPromise: Promise<void> | null = null;

function readUpdateUrl() {
  const bakedPath = path.join(__dirname, "update-config.baked.json");
  if (fs.existsSync(bakedPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(bakedPath, "utf8")) as { url?: string };
      if (parsed.url?.trim()) {
        return parsed.url.trim().replace(/\/$/, "");
      }
    } catch {
      // Fall through to env/default.
    }
  }

  const fromEnv =
    process.env.RANKED_UPDATE_URL?.trim() || process.env.CS2SYNC_UPDATE_URL?.trim();
  return fromEnv ? fromEnv.replace(/\/$/, "") : DEFAULT_UPDATE_URL;
}

function compareVersions(left: string, right: string) {
  const leftParts = left.split(".").map((part) => parseInt(part, 10) || 0);
  const rightParts = right.split(".").map((part) => parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (diff !== 0) {
      return diff > 0 ? 1 : -1;
    }
  }

  return 0;
}

function sendUpdate(payload: UpdateStatusPayload) {
  broadcast("app:update", payload);
}

function scheduleAutoInstall(version: string) {
  sendUpdate({ status: "ready", version });
  setTimeout(() => {
    autoUpdater.quitAndInstall(false, true);
  }, AUTO_INSTALL_DELAY_MS);
}

function attachUpdaterEvents() {
  if (eventsAttached) {
    return;
  }

  eventsAttached = true;

  autoUpdater.on("checking-for-update", () => {
    sendUpdate({ status: "checking" });
  });

  autoUpdater.on("update-available", (info) => {
    sendUpdate({
      status: "available",
      version: info.version,
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    sendUpdate({
      status: "idle",
      version: info.version,
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    sendUpdate({
      status: "downloading",
      progress: Math.round(progress.percent),
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    scheduleAutoInstall(info.version);
  });

  autoUpdater.on("error", (error) => {
    sendUpdate({
      status: "error",
      message: error.message,
    });
  });
}

function ensureUpdaterConfigured() {
  if (updaterConfigured) {
    return;
  }

  updaterConfigured = true;
  attachUpdaterEvents();
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.setFeedURL({
    provider: "generic",
    url: readUpdateUrl(),
  });
}

async function fetchManifest() {
  const response = await fetch(`${readUpdateUrl()}/manifest.json`, {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 402) {
      throw new Error("Update server is unavailable. Download the latest build from ranked.sushii.dev.");
    }
    throw new Error(`Update server returned ${response.status}`);
  }

  return (await response.json()) as { version: string; filename: string };
}

async function downloadPortableFromManifest(filename: string, version: string) {
  if (manifestDownloadPromise) {
    return manifestDownloadPromise;
  }

  manifestDownloadPromise = (async () => {
    const url = `${readUpdateUrl()}/${filename}`;
    const destination = path.join(app.getPath("temp"), filename);

    sendUpdate({ status: "downloading", progress: 0, version });

    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`Download failed (${response.status})`);
    }

    const totalBytes = Number(response.headers.get("content-length") || 0);
    let downloadedBytes = 0;
    const reader = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
    reader.on("data", (chunk: Buffer) => {
      downloadedBytes += chunk.length;
      if (totalBytes > 0) {
        sendUpdate({
          status: "downloading",
          progress: Math.round((downloadedBytes / totalBytes) * 100),
          version,
        });
      }
    });

    await pipeline(reader, createWriteStream(destination));
    schedulePortableInstall(destination, version);
  })().finally(() => {
    manifestDownloadPromise = null;
  });

  return manifestDownloadPromise;
}

function schedulePortableInstall(installerPath: string, version: string) {
  sendUpdate({ status: "ready", version });
  setTimeout(() => {
    spawn(installerPath, [], { detached: true, stdio: "ignore" }).unref();
    app.quit();
  }, AUTO_INSTALL_DELAY_MS);
}

async function checkViaManifest(): Promise<UpdateStatusPayload> {
  const currentVersion = app.getVersion();

  try {
    const manifest = await fetchManifest();
    if (compareVersions(manifest.version, currentVersion) > 0) {
      void downloadPortableFromManifest(manifest.filename, manifest.version);
      const payload: UpdateStatusPayload = {
        status: "available",
        version: manifest.version,
      };
      sendUpdate(payload);
      return payload;
    }

    const payload: UpdateStatusPayload = {
      status: "idle",
      version: currentVersion,
    };
    sendUpdate(payload);
    return payload;
  } catch (error) {
    const payload: UpdateStatusPayload = {
      status: "error",
      message: error instanceof Error ? error.message : "Update check failed.",
      version: currentVersion,
    };
    sendUpdate(payload);
    return payload;
  }
}

async function performUpdateCheck(): Promise<UpdateStatusPayload> {
  const currentVersion = app.getVersion();

  if (!app.isPackaged) {
    const payload: UpdateStatusPayload = {
      status: "idle",
      version: currentVersion,
      message: "Updates are checked in the installed Windows app.",
    };
    sendUpdate(payload);
    return payload;
  }

  ensureUpdaterConfigured();
  sendUpdate({ status: "checking" });

  try {
    const result = await autoUpdater.checkForUpdates();
    const latestVersion = result?.updateInfo?.version;

    if (latestVersion && compareVersions(latestVersion, currentVersion) > 0) {
      const payload: UpdateStatusPayload = {
        status: "available",
        version: latestVersion,
      };
      sendUpdate(payload);
      return payload;
    }

    const payload: UpdateStatusPayload = {
      status: "idle",
      version: currentVersion,
    };
    sendUpdate(payload);
    return payload;
  } catch {
    return checkViaManifest();
  }
}

export function initAutoUpdater() {
  ipcMain.handle("update:check", () => performUpdateCheck());

  ipcMain.handle("update:install", () => {
    if (updaterConfigured) {
      autoUpdater.quitAndInstall(false, true);
      return;
    }

    void fetchManifest()
      .then((manifest) => downloadPortableFromManifest(manifest.filename, manifest.version))
      .catch((error) => {
        sendUpdate({
          status: "error",
          message: error instanceof Error ? error.message : "Could not install update.",
        });
      });
  });

  if (!app.isPackaged) {
    return;
  }

  ensureUpdaterConfigured();
  setTimeout(() => {
    void performUpdateCheck();
  }, 5_000);
}
