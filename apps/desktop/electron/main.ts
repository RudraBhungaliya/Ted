import { app, BrowserWindow, ipcMain, session } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(false, { forward: true });

  win.loadURL("http://localhost:3000/overlay");

  mainWindow = win;
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      console.log("Permission request:", permission);

      if (
        permission === "media" ||
        permission === "display-capture" ||
        permission === "clipboard-read" ||
        permission === "clipboard-sanitized-write"
      ) {
        callback(true);
        return;
      }

      callback(false);
    }
  );

  ipcMain.handle("desktop:setClickThrough", (_event, enabled: boolean) => {
    mainWindow?.setIgnoreMouseEvents(enabled, { forward: true });
  });

  ipcMain.handle("desktop:setAlwaysOnTop", (_event, enabled: boolean) => {
    mainWindow?.setAlwaysOnTop(enabled, "screen-saver");
  });

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});