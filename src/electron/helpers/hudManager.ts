import { app } from "electron";
import fs from "fs";
import path from "path";
import { getCustomHudPath, getDefaultHUDPath } from "./pathResolver.js";

type HudType = "builtin" | "custom";

interface HudMetadata {
  name?: string;
  version?: string;
  author?: string;
  [key: string]: unknown;
}

export interface HudInfo {
  id: string;
  name: string;
  type: HudType;
  folder: string;
  path: string;
  version?: string;
  author?: string;
  thumbnailDataUri: string | null;
  metadata: HudMetadata;
  isActive: boolean;
}

interface HudEntry extends Omit<HudInfo, "isActive"> {}

interface HudSelectionFile {
  id: string;
}

const HUD_JSON_FILENAME = "hud.json";
const HUD_INDEX_FILENAME = "index.html";
const HUD_SELECTION_FILENAME = "selected-hud.json";
const HUD_THUMBNAIL_CANDIDATES = [
  "thumb.png",
  "thumb.jpg",
  "thumb.jpeg",
  "thumb.webp",
  "thumbnail.png",
  "thumbnail.jpg",
];

const selectionFilePath = path.join(app.getPath("userData"), HUD_SELECTION_FILENAME);

function normalize(p: string) {
  return path.normalize(p);
}

function readHudMetadata(directory: string): HudMetadata {
  const hudJsonPath = path.join(directory, HUD_JSON_FILENAME);
  if (!fs.existsSync(hudJsonPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(hudJsonPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as HudMetadata;
    }
  } catch (error) {
    console.warn(`Failed to parse HUD metadata at ${hudJsonPath}:`, error);
  }
  return {};
}

function toDataUri(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function getThumbnailDataUri(directory: string): string | null {
  for (const candidate of HUD_THUMBNAIL_CANDIDATES) {
    const candidatePath = path.join(directory, candidate);
    if (fs.existsSync(candidatePath)) {
      try {
        return toDataUri(candidatePath);
      } catch (error) {
        console.warn(`Failed to read HUD thumbnail at ${candidatePath}:`, error);
      }
    }
  }
  return null;
}

function buildHudEntry(
  directory: string,
  folder: string,
  type: HudType,
  fallbackName?: string,
): HudEntry | null {
  if (!fs.existsSync(path.join(directory, HUD_INDEX_FILENAME))) {
    return null;
  }

  const metadata = readHudMetadata(directory);
  const name =
    (typeof metadata.name === "string" && metadata.name.trim().length > 0
      ? metadata.name.trim()
      : undefined) ?? fallbackName ?? folder;

  const version =
    typeof metadata.version === "string" && metadata.version.trim().length > 0
      ? metadata.version.trim()
      : undefined;

  const author =
    typeof metadata.author === "string" && metadata.author.trim().length > 0
      ? metadata.author.trim()
      : undefined;

  return {
    id: `${type}:${folder}`,
    name,
    type,
    folder,
    path: directory,
    version,
    author,
    thumbnailDataUri: getThumbnailDataUri(directory),
    metadata,
  };
}

function resolveHudRoots(): string[] {
  const appPath = app.getAppPath();
  const resourcesPath = process.resourcesPath ?? appPath;
  const candidates = [
    path.resolve(appPath, "src", "assets"),
    path.resolve(appPath, "..", "src", "assets"),
    path.resolve(resourcesPath, "src", "assets"),
  ];

  const unique = new Set<string>();
  candidates.forEach((candidate) => {
    if (fs.existsSync(candidate)) {
      unique.add(normalize(candidate));
    }
  });

  return Array.from(unique);
}

function gatherBuiltinHudEntries(): HudEntry[] {
  const seenPaths = new Set<string>();
  const entries: HudEntry[] = [];

  for (const root of resolveHudRoots()) {
    const dirents = fs.readdirSync(root, { withFileTypes: true });
    dirents
      .filter((dirent) => dirent.isDirectory())
      .forEach((dirent) => {
        const hudPath = normalize(path.join(root, dirent.name));
        if (seenPaths.has(hudPath)) {
          return;
        }
        const entry = buildHudEntry(hudPath, dirent.name, "builtin");
        if (entry) {
          entries.push(entry);
          seenPaths.add(hudPath);
        }
      });
  }

  const defaultHudPath = normalize(getDefaultHUDPath());
  if (!seenPaths.has(defaultHudPath)) {
    const defaultEntry = buildHudEntry(
      defaultHudPath,
      path.basename(defaultHudPath),
      "builtin",
    );
    if (defaultEntry) {
      entries.push(defaultEntry);
      seenPaths.add(defaultHudPath);
    }
  }

  return entries;
}

function gatherCustomHudEntry(): HudEntry | null {
  const customPath = normalize(getCustomHudPath());
  if (fs.existsSync(path.join(customPath, HUD_INDEX_FILENAME))) {
    return (
      buildHudEntry(customPath, "custom", "custom", "Custom HUD") ?? {
        id: "custom:custom",
        name: "Custom HUD",
        type: "custom",
        folder: "custom",
        path: customPath,
        thumbnailDataUri: getThumbnailDataUri(customPath),
        metadata: {},
        version: undefined,
        author: undefined,
      }
    );
  }
  return null;
}

function gatherHudEntries(): HudEntry[] {
  const builtin = gatherBuiltinHudEntries();
  const custom = gatherCustomHudEntry();
  if (custom) {
    builtin.unshift(custom);
  }
  return builtin;
}

function loadSelection(): HudSelectionFile | null {
  if (!fs.existsSync(selectionFilePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(selectionFilePath, "utf-8");
    const parsed = JSON.parse(raw) as HudSelectionFile;
    if (parsed && typeof parsed.id === "string") {
      return parsed;
    }
  } catch (error) {
    console.warn(`Failed to read HUD selection file at ${selectionFilePath}:`, error);
  }
  return null;
}

function persistSelection(selection: HudSelectionFile) {
  try {
    fs.writeFileSync(selectionFilePath, JSON.stringify(selection, null, 2), "utf-8");
  } catch (error) {
    console.warn(`Failed to write HUD selection file at ${selectionFilePath}:`, error);
  }
}

function resolveActiveEntry(entries: HudEntry[]): HudEntry {
  if (entries.length === 0) {
    throw new Error("No HUDs available to select.");
  }

  const selection = loadSelection();
  if (selection) {
    const match = entries.find((entry) => entry.id === selection.id);
    if (match) {
      return match;
    }
  }

  const fallback =
    entries.find((entry) => entry.type === "custom") ??
    entries.find((entry) => entry.folder === "defaultHudv2") ??
    entries[0];

  persistSelection({ id: fallback.id });
  return fallback;
}

export function getHudPath(): string {
  const entries = gatherHudEntries();
  const active = resolveActiveEntry(entries);
  return active.path;
}

export function getSelectedHud(): HudInfo {
  const entries = gatherHudEntries();
  const active = resolveActiveEntry(entries);
  return entries.map((entry) => ({
    ...entry,
    isActive: entry.id === active.id,
  })).find((entry) => entry.id === active.id)!;
}

export function listAvailableHuds(): HudInfo[] {
  const entries = gatherHudEntries();
  const active = resolveActiveEntry(entries);
  return entries
    .map((entry) => ({
      ...entry,
      isActive: entry.id === active.id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function selectHud(id: string): HudInfo {
  const entries = gatherHudEntries();
  const match = entries.find((entry) => entry.id === id);
  if (!match) {
    throw new Error(`HUD with id "${id}" was not found.`);
  }
  persistSelection({ id: match.id });
  return {
    ...match,
    isActive: true,
  };
}
