import { app, BrowserWindow, session } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: join(__dirname, "preload.mjs"),
      contextIsolation: true,
    },
  });

  win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      console.log("Permission request:", permission);

      if (
        permission === "media" ||
        permission === "display-capture"
      ) {
        callback(true);
        return;
      }

      callback(false);
    }
  );

  createWindow();
});