import { ipcMain, WebContents, WebFrameMain, Notification } from "electron";
import { getAssetPath, getExportsPath, getUIPath } from "./pathResolver.js";
import { pathToFileURL } from "url";
import { app, shell } from "electron";
import path from "path";
import fs from "fs";

export let userHasCustomHud: boolean;

/* Tells our electron script if we are in development mode or not */
export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}
// Using generics to set the type of key which determines the handler type
export function ipcMainHandle<
  Key extends keyof EventPayloadMapping,
  Payload = void,
>(
  key: Key,
  handler: (
    payload: Payload,
  ) =>
    | EventPayloadMapping[Key]
    | Promise<EventPayloadMapping[Key]>,
) {
  ipcMain.handle(key, (event, payload: Payload) => {
    // Verify the url the user is accessing the fil from
    if (event.senderFrame) {
      validateEventFrame(event.senderFrame);
    }
    return handler(payload);
  });
}
export function ipcMainOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (payload: EventPayloadMapping[Key]) => void,
) {
  ipcMain.on(key, (event, payload) => {
    // Verify the url the user is accessing the fil from
    if (event.senderFrame) {
      validateEventFrame(event.senderFrame);
    }
    return handler(payload);
  });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key],
) {
  webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain) {
  // verify when in dev mode
  if (isDev() && new URL(frame.url).host === "localhost:5123") {
    return;
  }

  // if request comes from something other than our index.html file
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error("Frame URL Error: possible malicious event");
  }
}

export function ensureDirectory(directory: string) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Ensure we have a userData folder and a Huds folder to store custom built huds
export function checkDirectories() {
  const userData = app.getPath("userData");
  const customHudDir = path.join(app.getPath("home"), "OpenHud-Huds");
  const uploadsDir = path.join(userData, "uploads");
  const playerPicturesDir = path.join(uploadsDir, "player_pictures");
  const coachPicturesDir = path.join(uploadsDir, "coach_pictures");
  const teamLogosDir = path.join(uploadsDir, "team_logos");

  [customHudDir, userData, uploadsDir, playerPicturesDir, coachPicturesDir, teamLogosDir].forEach(
    ensureDirectory,
  );

  /* Check to see if the user has a custom hud loaded */
  const customHudData = path.join(
    app.getPath("home"),
    "OpenHud-Huds/build/index.html",
  );

  if (fs.existsSync(customHudData)) {
    userHasCustomHud = true;
  } else {
    userHasCustomHud = false;
  }
}

export function showNotification(body: string) {
  new Notification({
    title: "OpenHud:",
    body,
  }).show();
}

export function openHudsDirectory() {
  const customHudDir = path.join(app.getPath("home"), "OpenHud-Huds");
  shell.openPath(customHudDir);
}

export function openHudAssetsDirectory() {
  const assetsPath = getAssetPath();
  shell.openPath(assetsPath);
}

export function openExportsDirectory() {
  const exportsPath = getExportsPath();
  ensureDirectory(exportsPath);
  shell.openPath(exportsPath);
}
