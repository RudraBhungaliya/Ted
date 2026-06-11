import { app, BrowserWindow, ipcMain, session, desktopCapturer } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    title: "Ted Intelligence",
    webPreferences: {
      preload: join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://localhost:3000");

  mainWindow.on("closed", () => {
    mainWindow = null;
    app.quit();
  });
}

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setIgnoreMouseEvents(false, { forward: true });

  overlayWindow.loadURL("http://localhost:3000/overlay");

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });
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

  session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
    desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
      const screenSource = sources[0];
      if (screenSource) {
        callback({ video: screenSource });
      } else {
        console.error("No screen capture sources found.");
      }
    }).catch((err) => {
      console.error("Failed to get desktop sources:", err);
    });
  });

  ipcMain.handle("desktop:setClickThrough", (_event, enabled: boolean) => {
    overlayWindow?.setIgnoreMouseEvents(enabled, { forward: true });
  });

  ipcMain.handle("desktop:setAlwaysOnTop", (_event, enabled: boolean) => {
    overlayWindow?.setAlwaysOnTop(enabled, "screen-saver");
  });

  ipcMain.handle("desktop:showOverlay", () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
    if (!overlayWindow) {
      createOverlayWindow();
    }
    overlayWindow?.show();
    overlayWindow?.focus();
  });

  ipcMain.handle("desktop:stopSession", (_event, sessionId?: string) => {
    overlayWindow?.hide();
    if (mainWindow) {
      mainWindow.restore();
      mainWindow.focus();
      mainWindow.webContents.send("desktop:session-ended", sessionId);
    }
  });

  createMainWindow();
  createOverlayWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (!mainWindow) {
    createMainWindow();
  }
});