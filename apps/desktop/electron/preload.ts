import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

contextBridge.exposeInMainWorld("desktopControls", {
  setClickThrough(enabled: boolean) {
    return ipcRenderer.invoke("desktop:setClickThrough", enabled);
  },
  setAlwaysOnTop(enabled: boolean) {
    return ipcRenderer.invoke("desktop:setAlwaysOnTop", enabled);
  },
  showOverlay() {
    return ipcRenderer.invoke("desktop:showOverlay");
  },
  stopSession(sessionId?: string) {
    return ipcRenderer.invoke("desktop:stopSession", sessionId);
  },
  setContentProtection(enabled: boolean) {
    return ipcRenderer.invoke("desktop:setContentProtection", enabled);
  },
  onSessionEnded(callback: () => void) {
    const listener = () => callback();
    ipcRenderer.on("desktop:session-ended", listener);
    return () => {
      ipcRenderer.off("desktop:session-ended", listener);
    };
  },
});

