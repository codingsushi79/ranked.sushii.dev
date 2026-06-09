import { app, BrowserWindow, ipcMain, shell } from "electron";
import { MatchTracker } from "./match-tracker";
import { initAutoUpdater } from "./updater";
import { createMainWindow } from "./windows";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { startRankedBridge } = require("../../bridge/index.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { API_URL } = require("../../bridge/server.js");

const BRIDGE_URL = "http://127.0.0.1:27500";

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

async function bootstrap() {
  rankedBridge = startRankedBridge();

  matchTracker = new MatchTracker();
  await matchTracker.start();

  ipcMain.handle("ranked:status", () => bridgeFetch("/api/status"));
  ipcMain.handle("ranked:profile", async () => {
    const config = rankedBridge?.getConfig();
    const clientId = getClientId(config);
    if (!clientId) throw new Error("No Client ID saved");
    const apiHost = new URL(API_URL).host;
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/client/me`, {
        headers: { Authorization: `Bearer ${clientId}` },
      });
    } catch {
      throw new Error(`Could not reach ${apiHost} — check your internet connection`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      if (res.status === 404) {
        throw new Error(
          "Profile API is missing on the server — redeploy ranked.sushii.dev, then try again"
        );
      }
      throw new Error(`Unexpected response from ${apiHost} (HTTP ${res.status})`);
    }
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error || "Profile fetch failed");
    return data;
  });
  ipcMain.handle("ranked:save-client-id", (_event, clientId: string) =>
    bridgeFetch("/api/client-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    })
  );
  ipcMain.handle("ranked:clear-client-id", () =>
    bridgeFetch("/api/client-id", { method: "DELETE" })
  );
  ipcMain.handle("ranked:reinstall-jsi", () =>
    bridgeFetch("/api/jsi/install", { method: "POST" })
  );
  ipcMain.handle("ranked:reinstall-gsi", async () => {
    const installed = await matchTracker?.installGsiConfig();
    if (!installed) {
      throw new Error("Could not find your CS2 cfg folder. Install CS2 via Steam first.");
    }
    return true;
  });

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
