import { BrowserWindow, screen } from "electron";
import { getPreloadPath } from "./helpers/index.js";
import { apiUrl } from "./index.js";
import { createMenu } from "./menu.js";

const hudWindows: BrowserWindow[] = [];
type OverlayConfig = {
  displayId: number | null;
  scale: number;
};

type OverlayStatus = {
  isVisible: boolean;
  config: OverlayConfig;
};

type OverlayListener = (status: OverlayStatus) => void;

let overlayConfig: OverlayConfig = {
  displayId: null,
  scale: 100,
};

const overlayListeners = new Set<OverlayListener>();

const resolveDisplay = (displayId: number | null) => {
  const displays = screen.getAllDisplays();
  if (displayId == null) return screen.getPrimaryDisplay();
  return (
    displays.find((display) => display.id === displayId) ||
    screen.getPrimaryDisplay()
  );
};

const applyScaleToWindow = (window: BrowserWindow, scalePercent: number) => {
  if (window.isDestroyed()) return;
  const factor = Math.max(scalePercent, 1) / 100;
  const script = `
    (() => {
      const factor = ${factor};
      document.documentElement.style.zoom = factor;
      document.body && (document.body.style.zoom = factor);
    })();
  `;
  window.webContents
    .executeJavaScript(script, true)
    .catch((error) =>
      console.error("Failed to apply overlay scale", error),
    );
};

const applyZoomFactor = (scale: number) => {
  hudWindows.forEach((window) => {
    applyScaleToWindow(window, scale);
  });
};

const getOverlayStatus = (): OverlayStatus => ({
  isVisible: hudWindows.length > 0,
  config: overlayConfig,
});

const notifyOverlayStatus = () => {
  const status = getOverlayStatus();
  overlayListeners.forEach((listener) => listener(status));
};

export const onOverlayStatusChange = (listener: OverlayListener) => {
  overlayListeners.add(listener);
  return () => overlayListeners.delete(listener);
};

export const closeAllWindows = () => {
  [...hudWindows].forEach((window) => {
    window.close();
  });
};

export const isOverlayVisible = () => hudWindows.length > 0;

export const getOverlayConfig = () => overlayConfig;

export const setOverlayConfig = (config: Partial<OverlayConfig>) => {
  overlayConfig = { ...overlayConfig, ...config };
  if (config.scale !== undefined) {
    applyZoomFactor(overlayConfig.scale);
  }

  if (config.displayId !== undefined && isOverlayVisible()) {
    closeAllWindows();
    // Allow windows to close before spawning a new one
    setTimeout(() => {
      createHudWindow();
    }, 50);
    return;
  }

  notifyOverlayStatus();
};

export const showOverlay = () => {
  if (isOverlayVisible()) {
    return hudWindows[0];
  }
  return createHudWindow();
};

export const hideOverlay = () => {
  if (!isOverlayVisible()) return;
  closeAllWindows();
};

export const listDisplays = () =>
  screen.getAllDisplays().map((display, index) => ({
    id: display.id,
    label:
      (display as any).label ||
      (display as any).name ||
      `Display ${index + 1}`,
  }));

export function createHudWindow() {
  const display = resolveDisplay(overlayConfig.displayId);
  const { bounds } = display;

  let hudWindow: BrowserWindow | null = new BrowserWindow({
    x: bounds?.x ?? 0,
    y: bounds?.y ?? 0,
    width: bounds?.width ?? undefined,
    height: bounds?.height ?? undefined,
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

  hudWindow.webContents.on("did-finish-load", () => {
    if (hudWindow) {
      applyScaleToWindow(hudWindow, overlayConfig.scale);
    }
  });

  // Focus the HUD window a short time after it's shown to ensure it goes on top.
  hudWindow.on("show", () => {
    setTimeout(() => {
      hudWindow?.focus();
    }, 200);
  });

  hudWindows.push(hudWindow);
  notifyOverlayStatus();

  hudWindow.on("closed", () => {
    const index = hudWindows.indexOf(hudWindow as BrowserWindow);
    if (index > -1) {
      hudWindows.splice(index, 1);
    }
    hudWindow = null;
    notifyOverlayStatus();
  });

  hudWindow.show();

  return hudWindow;
}

export const getCurrentOverlayStatus = () => ({
  ...getOverlayStatus(),
  displays: listDisplays(),
});


