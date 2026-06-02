import { app, BrowserWindow } from "electron";

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
  });

  win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
  createWindow();
});