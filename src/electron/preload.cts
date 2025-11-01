const electron = require("electron");

/* context bridge used to bridge data between electron process and main window  */
/* These functions will be loaded before the mainWindow is opened  */

electron.contextBridge.exposeInMainWorld("electron", {
  // On doesn't care if anyone is listeneing
  // Invoke Expects a return value

  startServer: (callback: (message: any) => void) =>
    ipcOn("startServer", (response) => {
      callback(response);
    }),

  sendFrameAction: (payload) => {
    ipcSend("sendFrameAction", payload);
  },

  startOverlay: (config?: Partial<OverlayConfig>) => {
    if (config) {
      ipcSend("overlay:start", config);
    } else {
      ipcSend("overlay:start", {});
    }
  },
  stopOverlay: () => ipcSend("overlay:stop", undefined),
  onOverlayStatus: (callback: (status: OverlayStatus) => void) => {
    const listener = (
      _: Electron.IpcRendererEvent,
      payload: OverlayStatus,
    ) => callback(payload);
    electron.ipcRenderer.on("overlay:status", listener);
    return () => {
      electron.ipcRenderer.removeListener("overlay:status", listener);
    };
  },
  getOverlayStatus: () => ipcInvoke("overlay:getStatus"),
  setOverlayConfig: (config: Partial<OverlayConfig>) =>
    ipcSend("overlay:setConfig", config),
  playWebmOverlay: (config: WebmOverlayConfig) =>
    ipcSend("overlay:webm:show", config),
  stopWebmOverlay: () => ipcSend("overlay:webm:hide", undefined),
  getWindowBounds: () => ipcInvoke("window:getBounds"),
  setWindowBounds: (bounds: Partial<WindowBounds>) =>
    ipcSend("window:setBounds", bounds),
  openExternalLink: (url) => ipcSend("openExternalLink", url),
  openHudsDirectory: () => ipcSend("openHudsDirectory", undefined),
  openHudAssetsDirectory: () => ipcSend("openHudAssetsDirectory", undefined),
  setAppZoom: (zoomFactor: number) => ipcSend("app:setZoom", zoomFactor),
  importLegacyData: () => ipcInvoke("legacy:import"),
  fixGSI: () => ipcInvoke("gsi:fix"),
  selectImportSource: () => ipcInvoke("data:selectImportSource"),
  importData: (payload: ImportDataPayload) =>
    electron.ipcRenderer.invoke("data:import", payload),
  exportData: (selection: DataExportSelection) =>
    electron.ipcRenderer.invoke("data:export", selection),
  openExportsDirectory: () => ipcSend("exports:open", undefined),
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key,
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key);
}

/* Using callbacks because these functions are async */
function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void,
) {
  electron.ipcRenderer.on(
    key as string,
    (_: Electron.IpcRendererEvent, payload: EventPayloadMapping[Key]) => callback(payload)
  );
}

function ipcSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload: EventPayloadMapping[Key],
) {
  electron.ipcRenderer.send(key, payload);
}
