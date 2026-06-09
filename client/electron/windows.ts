import { app, BrowserWindow, screen } from "electron";
import path from "path";

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function preloadPath() {
  return path.join(__dirname, "preload.js");
}

function distIndexPath() {
  return path.join(__dirname, "../../dist/index.html");
}

export function getMainWindow() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

export function broadcast(channel: string, payload: unknown) {
  const win = getMainWindow();
  if (win) {
    win.webContents.send(channel, payload);
  }
}

export function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return mainWindow;
  }

  const workArea = screen.getPrimaryDisplay().workArea;
  const windowWidth = 980;
  const windowHeight = Math.min(760, workArea.height - 48);

  const win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 820,
    minHeight: 620,
    x: workArea.x + Math.round((workArea.width - windowWidth) / 2),
    y: workArea.y + Math.round((workArea.height - windowHeight) / 2),
    frame: false,
    transparent: true,
    roundedCorners: true,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    hasShadow: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow = win;

  if (isDev) {
    void win.loadURL("http://localhost:5173");
  } else {
    void win.loadFile(distIndexPath());
  }

  win.on("closed", () => {
    mainWindow = null;
  });

  return win;
}
