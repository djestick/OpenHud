import { BrowserWindow, shell } from "electron";
import {
  ipcMainHandle,
  ipcMainOn,
  openHudsDirectory,
  openHudAssetsDirectory,
} from "../helpers/index.js";
import { createHudWindow } from "../hudWindow.js";
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
    const hudWindow = createHudWindow();
    hudWindow.show();
  });

  ipcMainOn("openExternalLink", (url) => {
    shell.openExternal(url);
  });

  ipcMainOn("openHudsDirectory", () => {
    openHudsDirectory();
  });

  ipcMainOn("openHudAssetsDirectory", () => {
    openHudAssetsDirectory();
  });
}
