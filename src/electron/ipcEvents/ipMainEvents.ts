import { BrowserWindow, shell } from "electron";
import {
  ipcMainHandle,
  ipcMainOn,
  openHudsDirectory,
  openHudAssetsDirectory,
} from "../helpers/index.js";
import {
  showOverlay,
  hideOverlay,
  getCurrentOverlayStatus,
  onOverlayStatusChange,
  setOverlayConfig,
  listDisplays,
} from "../hudWindow.js";
import * as PlayersModel from "../api/v2/players/players.data.js";
// Handle expects a response
export function ipcMainEvents(mainWindow: BrowserWindow) {
  ipcMainHandle("getPlayers", async () => {
    const players = await PlayersModel.selectAll();
    return players;
  });

  ipcMainOn("sendFrameAction", (payload) => {
    switch (payload) {
      case "CLOSE":
        mainWindow.close();
        break;
      case "MINIMIZE":
        mainWindow.minimize();
        break;
      case "MAXIMIZE":
        mainWindow.maximize();
        break;
      case "CONSOLE":
        mainWindow.webContents.toggleDevTools();
        break;
      case "RESET":
        mainWindow.unmaximize();
        break;
    }
  });

  ipcMainOn("startOverlay", () => {
    showOverlay();
  });

  ipcMainOn("overlay:start", (config: Partial<OverlayConfig>) => {
    if (config) {
      setOverlayConfig(config);
    }
    showOverlay();
  });

  ipcMainOn("overlay:stop", () => {
    hideOverlay();
  });

  ipcMainOn("overlay:setConfig", (config: Partial<OverlayConfig>) => {
    setOverlayConfig(config);
  });

  ipcMainHandle("overlay:getStatus", () => getCurrentOverlayStatus());

  ipcMainHandle("overlay:getDisplays", () => listDisplays());

  ipcMainOn("openExternalLink", (url) => {
    shell.openExternal(url);
  });

  ipcMainOn("openHudsDirectory", () => {
    openHudsDirectory();
  });

  ipcMainOn("openHudAssetsDirectory", () => {
    openHudAssetsDirectory();
  });

  ipcMainOn("app:setZoom", (zoomFactor: number) => {
    const clamped = Math.min(3, Math.max(0.5, zoomFactor));
    mainWindow.webContents.setZoomFactor(clamped);
  });

  onOverlayStatusChange(() => {
    mainWindow.webContents.send("overlay:status", getCurrentOverlayStatus());
  });
}
