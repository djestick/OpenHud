import { BrowserWindow, shell, dialog, ipcMain } from "electron";
import path from "node:path";
import { promises as fsPromises } from "node:fs";
import {
  ipcMainHandle,
  ipcMainOn,
  openHudsDirectory,
  openHudAssetsDirectory,
  openExportsDirectory,
  getAssetPath,
  getExportsPath,
  ensureDirectory,
} from "../helpers/index.js";
import {
  showOverlay,
  hideOverlay,
  getCurrentOverlayStatus,
  onOverlayStatusChange,
  setOverlayConfig,
  listDisplays,
} from "../hudWindow.js";
import { runLegacyImport } from "../legacyMigrator.js";
import * as PlayersModel from "../api/v2/players/players.data.js";
import {
  loadDatabaseSnapshot,
  importSelectionFromFile,
  exportDatabaseSelection,
} from "../helpers/dataTransfer.js";
import type {
  DataExportSelection,
  ExportDataResult,
  ImportDataResult,
} from "../helpers/dataTransfer.js";
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

  // WebM overlay controls
  ipcMainOn("overlay:webm:show", (cfg: any) => {
    // Lazy import to avoid circular types
    const { showWebmOverlay } = require("../hudWindow.js");
    showWebmOverlay(cfg);
  });

  ipcMainOn("overlay:webm:hide", () => {
    const { hideWebmOverlay } = require("../hudWindow.js");
    hideWebmOverlay();
  });

  ipcMainHandle("window:getBounds", () => mainWindow.getBounds());

  ipcMain.on(
    "window:setBounds",
    (_event, bounds: Partial<WindowBounds>) => {
      const current = mainWindow.getBounds();
      const nextBounds = {
        x: bounds.x ?? current.x,
        y: bounds.y ?? current.y,
        width: bounds.width ?? current.width,
        height: bounds.height ?? current.height,
      };
      mainWindow.setBounds(nextBounds);
    },
  );

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

  ipcMainHandle("legacy:import", async () => {
    const result = await runLegacyImport();
    return result;
  });

  ipcMainHandle("data:selectImportSource", async () => {
    const selection = await dialog.showOpenDialog(mainWindow, {
      title: "Select OpenHUD database file",
      buttonLabel: "Choose",
      properties: ["openFile"],
      filters: [{ name: "OpenHUD backup", extensions: ["zip"] }],
    });

    if (selection.canceled || selection.filePaths.length === 0) {
      return { cancelled: true };
    }

    const filePath = selection.filePaths[0];

    try {
      const snapshot = await loadDatabaseSnapshot(filePath);
      return {
        cancelled: false,
        filePath,
        snapshot,
      };
    } catch (error) {
      return {
        cancelled: false,
        error: `Failed to read database: ${(error as Error).message}`,
      };
    }
  });

  ipcMainHandle(
    "data:import",
    async ({
      sourcePath,
      selection,
    }: {
      sourcePath: string;
      selection: DataExportSelection;
    }): Promise<ImportDataResult> => {
      try {
        return await importSelectionFromFile(sourcePath, selection);
      } catch (error) {
        return {
          success: false,
          message: `Failed to import database: ${(error as Error).message}`,
        };
      }
    },
  );

  ipcMainHandle(
    "data:export",
    async (payload: DataExportSelection): Promise<ExportDataResult> => {
      const exportsPath = getExportsPath();
      ensureDirectory(exportsPath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filePath = path.join(exportsPath, `openhud-export-${timestamp}.zip`);

      try {
        return await exportDatabaseSelection(filePath, payload);
      } catch (error) {
        return {
          success: false,
          message: `Failed to export data: ${(error as Error).message}`,
        };
      }
    },
  );

  ipcMainOn("exports:open", () => {
    openExportsDirectory();
  });

  ipcMainHandle("gsi:fix", async () => {
    const sourcePath = path.join(getAssetPath(), "gamestate_integration_openhud.cfg");
    const ensureSource = async () => {
      try {
        await fsPromises.access(sourcePath);
        return true;
      } catch {
        return false;
      }
    };

    if (!(await ensureSource())) {
      return {
        success: false,
        message: "Source config file is missing from assets.",
      } satisfies GSIResult;
    }

    const selection = await dialog.showOpenDialog(mainWindow, {
      title: "Select Counter-Strike 2 folder",
      buttonLabel: "Use this folder",
      properties: ["openDirectory"],
      message:
        "Select the Counter-Strike Global Offensive folder inside your Steam library.",
    });

    if (selection.canceled || selection.filePaths.length === 0) {
      return {
        success: false,
        message: "Folder selection cancelled.",
      } satisfies GSIResult;
    }

    let chosenPath = selection.filePaths[0];

    try {
      const stats = await fsPromises.stat(chosenPath);
      if (stats.isFile()) {
        chosenPath = path.dirname(chosenPath);
      }
    } catch (error) {
      return {
        success: false,
        message: `Unable to inspect selected path: ${(error as Error).message}`,
      } satisfies GSIResult;
    }

    const resolveCfgDirectory = async (start: string) => {
      const normalized = path.resolve(start);
      const bases: string[] = [];
      let current = normalized;
      for (let depth = 0; depth < 6; depth += 1) {
        bases.push(current);
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
      }

      const pathExists = async (candidate: string) => {
        try {
          await fsPromises.access(candidate);
          return true;
        } catch {
          return false;
        }
      };

      for (const base of bases) {
        const csgoBase = path.join(base, "game", "csgo");
        if (await pathExists(csgoBase)) {
          return path.join(csgoBase, "cfg");
        }
      }

      for (const base of bases) {
        const csgoBase = path.join(base, "csgo");
        if (await pathExists(csgoBase)) {
          return path.join(csgoBase, "cfg");
        }
      }

      for (const base of bases) {
        if (path.basename(base).toLowerCase() === "cfg") {
          return base;
        }
        const cfgDir = path.join(base, "cfg");
        if (await pathExists(cfgDir)) {
          return cfgDir;
        }
      }

      return null;
    };

    const cfgDirectory = await resolveCfgDirectory(chosenPath);

    if (!cfgDirectory) {
      return {
        success: false,
        message:
          "Could not locate the game\\csgo folder based on the selected directory. Please choose the Counter-Strike installation folder.",
      } satisfies GSIResult;
    }

    try {
      await fsPromises.mkdir(cfgDirectory, { recursive: true });
      const destination = path.join(cfgDirectory, "gamestate_integration_openhud.cfg");
      await fsPromises.copyFile(sourcePath, destination);
      return {
        success: true,
        message: "GSI configuration copied successfully.",
        targetPath: destination,
      } satisfies GSIResult;
    } catch (error) {
      return {
        success: false,
        message: `Failed to write config: ${(error as Error).message}`,
      } satisfies GSIResult;
    }
  });

  onOverlayStatusChange(() => {
    mainWindow.webContents.send("overlay:status", getCurrentOverlayStatus());
  });
}
