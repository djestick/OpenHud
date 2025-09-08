import { BrowserWindow } from "electron";
import { getPreloadPath } from "./helpers/index.js";
import { checkDirectories } from "./helpers/util.js";
import { apiUrl } from "./index.js";
import { createMenu } from "./menu.js";

export let hudWindow: BrowserWindow | null = null;

export function createHudWindow() {
  hudWindow = new BrowserWindow({
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
  checkDirectories();
  
  // Note: The HUD window is always loaded from localhost to avoid CORS issues with local files.
  hudWindow.loadURL("http://" + apiUrl + "/hud");
  hudWindow.setIgnoreMouseEvents(true);

  // Focus the HUD window a short time after it's shown to ensure it goes on top.
    hudWindow.on("show", () => {
    setTimeout(() => {
      hudWindow?.focus();
    }, 200);
  });

  hudWindow.on("closed", () => {
    hudWindow = null;
  });

  return hudWindow;
}
