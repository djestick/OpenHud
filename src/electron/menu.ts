import electron from "electron";
import type { BrowserWindow as BrowserWindowType } from "electron";
import { isDev } from "./helpers/util.js";
// import { hudWindowRef } from "./hudWindow.js";

const { app, Menu } = electron;

export function createMenu(mainWindow: BrowserWindowType) {
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
