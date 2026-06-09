import { contextBridge, ipcRenderer } from "electron";
import type { UpdateStatusPayload } from "../shared/types";

export interface RankedApi {
  getStatus: () => Promise<Record<string, unknown>>;
  getProfile: () => Promise<Record<string, unknown>>;
  saveClientId: (clientId: string) => Promise<unknown>;
  clearClientId: () => Promise<unknown>;
  reinstallJsi: () => Promise<unknown>;
  reinstallGsi: () => Promise<boolean>;
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
  saveClientId: (clientId) => ipcRenderer.invoke("ranked:save-client-id", clientId),
  clearClientId: () => ipcRenderer.invoke("ranked:clear-client-id"),
  reinstallJsi: () => ipcRenderer.invoke("ranked:reinstall-jsi"),
  reinstallGsi: () => ipcRenderer.invoke("ranked:reinstall-gsi"),
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
