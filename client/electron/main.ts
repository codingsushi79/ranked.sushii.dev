import { app, BrowserWindow, ipcMain, shell } from "electron";
import { startDesktopLogin } from "./auth";
import { MatchTracker } from "./match-tracker";
import { initAutoUpdater } from "./updater";
import { createMainWindow } from "./windows";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { startRankedBridge, installGameIntegration } = require("../../bridge/index.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { API_URL } = require("../../bridge/server.js");

const BRIDGE_URL = "http://127.0.0.1:27500";
const INSTALL_GAME_INTEGRATION_FLAG = "--install-game-integration";

let matchTracker: MatchTracker | null = null;
let rankedBridge: ReturnType<typeof startRankedBridge> | null = null;

function getClientId(config: Record<string, string | undefined> | undefined) {
  return config?.clientId || config?.token || null;
}

async function bridgeFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BRIDGE_URL}${path}`, init);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function apiFetch(path: string, init?: RequestInit) {
  const config = rankedBridge?.getConfig();
  const clientId = getClientId(config);
  const url = path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (clientId) headers.set("Authorization", `Bearer ${clientId}`);

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(`Could not reach ${new URL(API_URL).host}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text && contentType.includes("application/json")) {
    data = JSON.parse(text) as Record<string, unknown>;
  } else if (text && !contentType.includes("application/json")) {
    throw new Error(`Unexpected response (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error((data.error as string) || `Request failed (HTTP ${res.status})`);
  }

  return data;
}

async function bootstrap() {
  rankedBridge = startRankedBridge();

  matchTracker = new MatchTracker();
  await matchTracker.start();

  ipcMain.handle("ranked:status", () => bridgeFetch("/api/status"));
  ipcMain.handle("ranked:profile", () => apiFetch("/api/client/me"));
  ipcMain.handle("ranked:fetch", (_event, path: string) => apiFetch(path));
  ipcMain.handle("ranked:login", async () => {
    const clientId = await startDesktopLogin(API_URL);
    await bridgeFetch("/api/client-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    return { ok: true };
  });
  ipcMain.handle("ranked:sign-out", () =>
    bridgeFetch("/api/client-id", { method: "DELETE" })
  );
  ipcMain.handle("ranked:api-url", () => API_URL);

  ipcMain.handle("window:minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.minimize();
  });

  ipcMain.handle("window:close", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win?.close();
  });

  ipcMain.handle("shell:open", (_event, url: string) => {
    shell.openExternal(url);
  });

  initAutoUpdater();
  ipcMain.handle("app:version", () => app.getVersion());
  createMainWindow();
}

function runInstallerIntegrationStep() {
  const result = installGameIntegration({});
  const ok = result.gsi?.ok || result.jsi?.ready;
  app.exit(ok ? 0 : 1);
}

if (process.argv.includes(INSTALL_GAME_INTEGRATION_FLAG)) {
  app.whenReady().then(runInstallerIntegrationStep);
} else {
  app.whenReady().then(bootstrap);

  app.on("window-all-closed", () => {
    matchTracker?.stop();
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    matchTracker?.stop();
    void rankedBridge?.stop();
  });
}
