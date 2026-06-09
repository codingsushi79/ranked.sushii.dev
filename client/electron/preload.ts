import { contextBridge, ipcRenderer } from "electron";
import type { UpdateStatusPayload } from "../shared/types";

export interface RankedApi {
  getStatus: () => Promise<Record<string, unknown>>;
  getProfile: () => Promise<Record<string, unknown>>;
  fetch: (path: string) => Promise<Record<string, unknown>>;
  login: () => Promise<{ ok: boolean }>;
  signOut: () => Promise<unknown>;
  getApiUrl: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<UpdateStatusPayload>;
  installUpdate: () => Promise<void>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  onUpdate: (callback: (payload: UpdateStatusPayload) => void) => () => void;
}

const api: RankedApi = {
  getStatus: () => ipcRenderer.invoke("ranked:status"),
  getProfile: () => ipcRenderer.invoke("ranked:profile"),
  fetch: (path) => ipcRenderer.invoke("ranked:fetch", path),
  login: () => ipcRenderer.invoke("ranked:login"),
  signOut: () => ipcRenderer.invoke("ranked:sign-out"),
  getApiUrl: () => ipcRenderer.invoke("ranked:api-url"),
  getAppVersion: () => ipcRenderer.invoke("app:version"),
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  installUpdate: () => ipcRenderer.invoke("update:install"),
  minimize: () => ipcRenderer.invoke("window:minimize"),
  close: () => ipcRenderer.invoke("window:close"),
  openExternal: (url) => ipcRenderer.invoke("shell:open", url),
  onUpdate: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: UpdateStatusPayload) =>
      callback(payload);
    ipcRenderer.on("app:update", listener);
    return () => ipcRenderer.removeListener("app:update", listener);
  },
};

contextBridge.exposeInMainWorld("ranked", api);

declare global {
  interface Window {
    ranked: RankedApi;
  }
}
