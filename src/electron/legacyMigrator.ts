import { app } from "electron";
import path from "node:path";
import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
import http from "node:http";
import https from "node:https";
import { randomUUID } from "node:crypto";
import sqlite3Init from "sqlite3";
import {
  getPlayerPicturesPath,
  getTeamLogosPath,
} from "./helpers/pathResolver.js";
import { database as appDatabase } from "./configs/database.js";

const sqlite3 = sqlite3Init.verbose();

type Database = sqlite3Init.Database;

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_REDIRECTS = 5;

const timestamp = () => {
  const iso = new Date().toISOString();
  return iso.replace("T", " ").split(".")[0];
};

const cleanExtraField = (value: unknown) => {
  if (value === null || value === undefined) {
    return "{}";
  }

  const asString = String(value).trim();
  if (
    !asString ||
    asString.toLowerCase() === "[object object]" ||
    asString.toLowerCase() === "undefined"
  ) {
    return "{}";
  }

  try {
    JSON.parse(asString);
    return asString;
  } catch {
    return "{}";
  }
};

const openDatabase = (filePath: string, mode: number) =>
  new Promise<Database>((resolve, reject) => {
    const db = new sqlite3.Database(filePath, mode, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });

const run = (db: Database, sql: string, params: unknown[] = []) =>
  new Promise<number>((resolve, reject) => {
    db.run(
      sql,
      params,
      function (this: sqlite3Init.RunResult, err: Error | null) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes ?? 0);
        }
      },
    );
  });

const all = <T = Record<string, unknown>>(
  db: Database,
  sql: string,
  params: unknown[] = [],
) =>
  new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });

const getRow = <T = Record<string, unknown>>(
  db: Database,
  sql: string,
  params: unknown[] = [],
) =>
  new Promise<T | undefined>((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve((row as T) ?? undefined);
      }
    });
  });

const close = (db: Database | null) =>
  new Promise<void>((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

const ensureDir = async (dir: string) => {
  await fsPromises.mkdir(dir, { recursive: true });
};

const recordExists = async (
  db: Database,
  table: "players" | "teams" | "coaches" | "matches",
  column: string,
  value: unknown,
) => {
  if (value === undefined || value === null || value === "") {
    return false;
  }

  const row = await getRow<{ present: number }>(
    db,
    `SELECT 1 as present FROM ${table} WHERE ${column} = ? LIMIT 1`,
    [value],
  );
  return Boolean(row);
};

const findLegacyDatabase = () => {
  const candidates = new Set<string>();
  const addCandidates = (basePath?: string) => {
    if (!basePath) return;
    ["openhud", "OpenHud", "OpenHUD"].forEach((folder) => {
      candidates.add(path.join(basePath, folder));
    });
  };

  addCandidates(app.getPath("appData"));
  if (process.platform === "win32") {
    const localAppData = path.join(app.getPath("home"), "AppData", "Local");
    addCandidates(localAppData);
    const roamingAppData = path.join(app.getPath("home"), "AppData", "Roaming");
    addCandidates(roamingAppData);
  }
  addCandidates(path.dirname(app.getPath("userData")));

  for (const candidate of candidates) {
    const dbPath = path.join(candidate, "database.db");
    if (fs.existsSync(dbPath)) {
      return { root: candidate, dbPath };
    }
  }

  return null;
};

const downloadFromUrl = (
  url: string,
  redirectCount = 0,
): Promise<{ buffer: Buffer; contentType?: string }> =>
  new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const request = client.get(
      url,
      { headers: HEADERS },
      (response: http.IncomingMessage) => {
        const statusCode = response.statusCode ?? 500;

        if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
          if (redirectCount >= MAX_REDIRECTS) {
            reject(new Error("Too many redirects while downloading asset."));
            response.resume();
            return;
          }
          const nextUrl = new URL(response.headers.location, url).toString();
          response.resume();
          resolve(downloadFromUrl(nextUrl, redirectCount + 1));
          return;
        }

        if (statusCode >= 400) {
          reject(
            new Error(
              `Request for ${url} failed with status ${statusCode}.`,
            ),
          );
          response.resume();
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", (chunk) => {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        });
        response.on("end", () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: response.headers["content-type"] as string | undefined,
          });
        });
      },
    );

    request.on("error", reject);
  });

const resolveExtension = (rawPath: string, contentType?: string | null) => {
  const ext = path.extname(rawPath).toLowerCase();
  if (ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return ext;
  }

  if (contentType?.includes("jpeg")) return ".jpg";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("png")) return ".png";
  return ".jpg";
};

const saveRemoteAsset = async (
  url: string,
  destinationFolder: string,
): Promise<string | null> => {
  try {
    const { buffer, contentType } = await downloadFromUrl(url);
    const fileExt = resolveExtension(new URL(url).pathname, contentType);
    const fileName = `${randomUUID()}${fileExt}`;
    await fsPromises.writeFile(path.join(destinationFolder, fileName), buffer);
    return fileName;
  } catch {
    return null;
  }
};

const saveLocalAsset = async (
  filePath: string,
  destinationFolder: string,
): Promise<string | null> => {
  try {
    const fileExt = path.extname(filePath) || ".png";
    const fileName = `${randomUUID()}${fileExt}`;
    await fsPromises.copyFile(filePath, path.join(destinationFolder, fileName));
    return fileName;
  } catch {
    return null;
  }
};

const migratePlayers = async (
  oldDb: Database,
  newDb: Database,
  folders: { players: string },
  logs: string[],
) => {
  await ensureDir(folders.players);
  const players = await all<Record<string, unknown>>(oldDb, "SELECT * FROM players");
  let migrated = 0;

  for (const player of players) {
    const username = String(player.username ?? "N/A");
    const playerId = String(player._id ?? "").trim();
    if (!playerId) {
      logs.push(`Skipped player without _id (username: ${username}).`);
      continue;
    }

    const exists = await recordExists(newDb, "players", "_id", playerId);
    if (exists) {
      logs.push(`Player already exists, skipping: ${username} (${playerId}).`);
      continue;
    }

    const avatarSource = player.avatar as string | null | undefined;
    let avatarFile: string | null = null;

    if (avatarSource) {
      const trimmed = avatarSource.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        avatarFile = await saveRemoteAsset(trimmed, folders.players);
        if (!avatarFile) {
          logs.push(
            `Failed to download avatar for ${username} from ${trimmed}.`,
          );
        }
      } else if (fs.existsSync(trimmed)) {
        avatarFile = await saveLocalAsset(trimmed, folders.players);
        if (!avatarFile) {
          logs.push(`Failed to copy avatar for ${username} from ${trimmed}.`);
        }
      }
    }

    const now = timestamp();
    const payload = [
      playerId,
      player.firstName,
      player.lastName,
      username,
      avatarFile,
      player.country,
      player.steamid,
      player.team,
      cleanExtraField(player.extra),
      now,
      now,
    ];

    try {
      await run(
        newDb,
        `INSERT INTO players (
          _id, firstName, lastName, username, avatar, country, steamid, team, extra, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        payload,
      );
      migrated += 1;
    } catch (error) {
      logs.push(
        `Failed to insert player ${username}: ${(error as Error).message}`,
      );
    }
  }

  return migrated;
};

const migrateTeams = async (
  oldDb: Database,
  newDb: Database,
  folders: { teams: string },
  logs: string[],
) => {
  await ensureDir(folders.teams);
  const teams = await all<Record<string, unknown>>(oldDb, "SELECT * FROM teams");
  let migrated = 0;

  for (const team of teams) {
    const name = String(team.name ?? "N/A");
    const teamId = String(team._id ?? "").trim();
    if (!teamId) {
      logs.push(`Skipped team without _id (name: ${name}).`);
      continue;
    }

    const exists = await recordExists(newDb, "teams", "_id", teamId);
    if (exists) {
      logs.push(`Team already exists, skipping: ${name} (${teamId}).`);
      continue;
    }

    const logoSource = team.logo as string | null | undefined;
    let logoFile: string | null = null;

    if (logoSource) {
      const trimmed = logoSource.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        logoFile = await saveRemoteAsset(trimmed, folders.teams);
        if (!logoFile) {
          logs.push(`Failed to download logo for ${name} from ${trimmed}.`);
        }
      } else if (fs.existsSync(trimmed)) {
        logoFile = await saveLocalAsset(trimmed, folders.teams);
        if (!logoFile) {
          logs.push(`Failed to copy logo for ${name} from ${trimmed}.`);
        }
      }
    }

    const now = timestamp();
    const payload = [
      teamId,
      name,
      team.country,
      team.shortName,
      logoFile,
      cleanExtraField(team.extra),
      now,
      now,
    ];

    try {
      await run(
        newDb,
        `INSERT INTO teams (
          _id, name, country, shortName, logo, extra, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        payload,
      );
      migrated += 1;
    } catch (error) {
      logs.push(
        `Failed to insert team ${name}: ${(error as Error).message}`,
      );
    }
  }

  return migrated;
};

const migrateCoaches = async (
  oldDb: Database,
  newDb: Database,
  logs: string[],
) => {
  let coaches: Record<string, unknown>[];
  try {
    coaches = await all<Record<string, unknown>>(
      oldDb,
      "SELECT steamid FROM coaches",
    );
  } catch (error) {
    logs.push(
      `Coaches table missing in legacy database: ${(error as Error).message}`,
    );
    return 0;
  }

  const now = timestamp();
  let migrated = 0;

  for (const coach of coaches) {
    const steamid = coach.steamid as string | undefined;
    if (!steamid) {
      logs.push("Skipped coach with missing steamid.");
      continue;
    }

    const exists = await recordExists(newDb, "coaches", "steamid", steamid);
    if (exists) {
      logs.push(`Coach already exists, skipping: ${steamid}.`);
      continue;
    }

    const payload = [steamid, null, null, now, now];

    try {
      await run(
        newDb,
        `INSERT INTO coaches (
          steamid, name, team, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?)`,
        payload,
      );
      migrated += 1;
    } catch (error) {
      logs.push(
        `Failed to insert coach ${steamid}: ${(error as Error).message}`,
      );
    }
  }

  return migrated;
};

const migrateMatches = async (
  oldDb: Database,
  newDb: Database,
  logs: string[],
) => {
  let matches: Record<string, unknown>[];
  try {
    matches = await all<Record<string, unknown>>(
      oldDb,
      "SELECT id, current, left_id, left_wins, right_id, right_wins, matchType, vetos FROM matches",
    );
  } catch (error) {
    logs.push(
      `Failed to read matches from legacy database: ${(error as Error).message}`,
    );
    return 0;
  }

  const now = timestamp();
  let migrated = 0;

  for (const match of matches) {
    const matchId = String(match.id ?? "").trim();
    if (!matchId) {
      logs.push("Skipped match with missing id.");
      continue;
    }

    const exists = await recordExists(newDb, "matches", "id", matchId);
    if (exists) {
      logs.push(`Match already exists, skipping: ${matchId}.`);
      continue;
    }

    const currentStatus =
      match.current === 1 ||
      match.current === "1" ||
      match.current === true ||
      match.current === "true" ||
      match.current === "True"
        ? 1
        : 0;

    const payload = [
      matchId,
      currentStatus,
      match.left_id,
      match.left_wins ?? 0,
      match.right_id,
      match.right_wins ?? 0,
      match.matchType ?? "Legacy",
      cleanExtraField(match.vetos),
      now,
      now,
    ];

    try {
      await run(
        newDb,
        `INSERT INTO matches (
          id, current, left_id, left_wins, right_id, right_wins, matchType, vetos, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        payload,
      );
      migrated += 1;
    } catch (error) {
      logs.push(
        `Failed to insert match ${matchId}: ${(error as Error).message}`,
      );
    }
  }

  return migrated;
};

const createSchema = async (db: Database) => {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS players (
      _id TEXT PRIMARY KEY NOT NULL UNIQUE,
      firstName TEXT,
      lastName TEXT,
      username TEXT NOT NULL UNIQUE,
      avatar TEXT,
      country TEXT,
      steamid TEXT UNIQUE,
      team TEXT,
      extra TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS teams (
      _id TEXT PRIMARY KEY NOT NULL UNIQUE,
      name TEXT,
      country TEXT,
      shortName TEXT,
      logo TEXT,
      extra TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS coaches (
      steamid TEXT PRIMARY KEY NOT NULL UNIQUE,
      name TEXT,
      team TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team) REFERENCES teams(_id) ON DELETE SET NULL
    )`,
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY NOT NULL UNIQUE,
      current INTEGER DEFAULT 0,
      left_id TEXT,
      left_wins INTEGER DEFAULT 0,
      right_id TEXT,
      right_wins INTEGER DEFAULT 0,
      matchType TEXT,
      vetos TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  await run(
    db,
    `CREATE TRIGGER IF NOT EXISTS update_players_updatedAt
     AFTER UPDATE ON players
     FOR EACH ROW
     BEGIN
       UPDATE players SET updatedAt = CURRENT_TIMESTAMP WHERE _id = OLD._id;
     END`,
  );

  await run(
    db,
    `CREATE TRIGGER IF NOT EXISTS update_teams_updatedAt
     AFTER UPDATE ON teams
     FOR EACH ROW
     BEGIN
       UPDATE teams SET updatedAt = CURRENT_TIMESTAMP WHERE _id = OLD._id;
     END`,
  );

  await run(
    db,
    `CREATE TRIGGER IF NOT EXISTS update_coaches_updatedAt
     AFTER UPDATE ON coaches
     FOR EACH ROW
     BEGIN
       UPDATE coaches SET updatedAt = CURRENT_TIMESTAMP WHERE steamid = OLD.steamid;
     END`,
  );

  await run(
    db,
    `CREATE TRIGGER IF NOT EXISTS update_matches_updatedAt
     AFTER UPDATE ON matches
     FOR EACH ROW
     BEGIN
       UPDATE matches SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
     END`,
  );
};

export const runLegacyImport = async (): Promise<LegacyImportResult> => {
  const logs: string[] = [];
  let oldDb: Database | null = null;
  const newDb = appDatabase as Database;
  let transactionStarted = false;

  try {
    const legacyInfo = findLegacyDatabase();
    if (!legacyInfo) {
      return {
        success: false,
        message:
          "Legacy database not found in either Roaming or Local AppData under an openhud folder.",
        players: 0,
        teams: 0,
        coaches: 0,
        matches: 0,
        logs,
      };
    }

    const { dbPath: oldDbPath } = legacyInfo;
    logs.push(`Using legacy database at ${oldDbPath}`);

    oldDb = await openDatabase(oldDbPath, sqlite3.OPEN_READONLY);

    await createSchema(newDb);

    const playersDir = getPlayerPicturesPath();
    const teamsDir = getTeamLogosPath();
    await ensureDir(playersDir);
    await ensureDir(teamsDir);

    const folders = {
      players: playersDir,
      teams: teamsDir,
    };

    await run(newDb, "BEGIN IMMEDIATE TRANSACTION");
    transactionStarted = true;

    const players = await migratePlayers(oldDb, newDb, folders, logs);
    const teams = await migrateTeams(oldDb, newDb, folders, logs);
    const coaches = await migrateCoaches(oldDb, newDb, logs);
    const matches = await migrateMatches(oldDb, newDb, logs);

    await run(newDb, "COMMIT");
    transactionStarted = false;

    return {
      success: true,
      message: "Legacy data import completed.",
      players,
      teams,
      coaches,
      matches,
      logs,
    };
  } catch (error) {
    logs.push(`Legacy import failed: ${(error as Error).message}`);
    return {
      success: false,
      message: (error as Error).message,
      players: 0,
      teams: 0,
      coaches: 0,
      matches: 0,
      logs,
    };
  } finally {
    await close(oldDb).catch((error) =>
      logs.push(`Failed closing legacy DB: ${(error as Error).message}`),
    );
    if (transactionStarted) {
      await run(newDb, "ROLLBACK").catch(() => {
        logs.push("Failed to rollback transaction after error.");
      });
    }
  }
};
