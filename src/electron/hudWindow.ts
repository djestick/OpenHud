import { BrowserWindow } from "electron";
import { getPreloadPath } from "./helpers/index.js";
import { apiUrl } from "./index.js";
import { createMenu } from "./menu.js";

const hudWindows: BrowserWindow[] = [];

export const closeAllWindows = () => {
  [...hudWindows].forEach((window) => {
    window.close();
  });
};

export function createHudWindow() {
  let hudWindow: BrowserWindow | null = new BrowserWindow({
    fullscreen: true,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    focusable: true,
    frame: false,
    webPreferences: {
      preload: getPreloadPath(),
      backgroundThrottling: false,
    },
  });

  createMenu(hudWindow);

  // Note: The HUD window is always loaded from localhost to avoid CORS issues with local files.
  hudWindow.loadURL("http://" + apiUrl + "/api/hud");
  hudWindow.setIgnoreMouseEvents(true);

  // Focus the HUD window a short time after it's shown to ensure it goes on top.
  hudWindow.on("show", () => {
    setTimeout(() => {
      hudWindow?.focus();
    }, 200);
  });

  hudWindows.push(hudWindow);

  hudWindow.on("closed", () => {
    const index = hudWindows.indexOf(hudWindow as BrowserWindow);
    if (index > -1) {
      hudWindows.splice(index, 1);
    }
    hudWindow = null;
  });

  return hudWindow;
}

