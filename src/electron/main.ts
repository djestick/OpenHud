import { app, BrowserWindow } from "electron";
import {
  checkDirectories,
  isDev,
  getPreloadPath,
  getUIPath,
} from "./helpers/index.js";
import { createTray } from "./tray.js";
import { createMenu } from "./menu.js";
import { ipcMainEvents } from "./ipcEvents/index.js";
import { startServer } from "./index.js";

let mainWindow: BrowserWindow;

app.on("ready", () => {
  mainWindow = createMainWindow();
  createMenu(mainWindow);
  checkDirectories();
  startServer();
  createTray();
  createMenu(mainWindow);
  ipcMainEvents(mainWindow);
});

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    minWidth: 800,
    height: 700,
    minHeight: 513,
    frame: false,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(getUIPath());
  }

  return mainWindow;
}
