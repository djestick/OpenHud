import { app, BrowserWindow, Menu } from "electron";
import { isDev } from "./helpers/util.js";
// import { hudWindowRef } from "./hudWindow.js";

export function createMenu(mainWindow: BrowserWindow) {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        // MacOS makes first option a default name
        label: process.platform === "darwin" ? undefined : "OpenHud",
        type: "submenu",
        submenu: [
          {
            label: "Quit",
            click: app.quit,
          },
        ],
      },
      {
        label: "DevTools",
        click: () => {
          // Prefer opening DevTools for the HUD overlay when it's present
          // if (hudWindowRef) {
          //   hudWindowRef.webContents.openDevTools();
          // } else {
          //   mainWindow.webContents.openDevTools();
          // }
          mainWindow.webContents.openDevTools();
        },
        visible: isDev(),
      },
    ]),
  );
}
