import { BrowserWindow } from "electron";
import { getPreloadPath } from "./helpers/index.js";
import { checkDirectories } from "./helpers/util.js";
import { apiUrl } from "./index.js";
import { createMenu } from "./menu.js";

export let hudWindoow: BrowserWindow | null = null;

export function createHudWindow() {
  hudWindoow = new BrowserWindow({
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

  createMenu(hudWindoow);
  checkDirectories();
  // In development load from the dev server so changes are live.
  // In non-dev load from the local API endpoint which serves the HUD HTML.
  // Note: The HUD window is always loaded from localhost to avoid CORS issues with local files.
  hudWindoow.loadURL("http://" + apiUrl + "/hud");
  hudWindoow.setIgnoreMouseEvents(true);

  hudWindoow.on("closed", () => {
    hudWindoow = null;
  });

  return hudWindoow;
}
