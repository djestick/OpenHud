import sqlite3 from "sqlite3";
import { promises as fsPromises } from "node:fs";
import path from "node:path";
// import AdmZip from "adm-zip";
import { getUploadsPath } from "./pathResolver.js";
import {
  applyDatabaseSchema,
  database,
  TABLE_COLUMNS,
} from "../configs/database.js";

export type DataSelection = {
  includeAll: boolean;
  ids: string[];
};

export type DataExportSelection = {
  players: DataSelection;
  teams: DataSelection;
  coaches: DataSelection;
  matches: DataSelection;
};

export type DataTransferCounts = Record<
  "teams" | "players" | "coaches" | "matches",
  number
>;

export type ImportDataResult = {
  success: boolean;
  message: string;
  counts?: DataTransferCounts;
  cancelled?: boolean;
  autoIncludedTeams?: string[];
};

export type ExportDataResult = {
  success: boolean;
  message: string;
  counts?: DataTransferCounts;
  filePath?: string;
  autoIncludedTeams?: string[];
  cancelled?: boolean;
};

type TableKey = keyof typeof TABLE_COLUMNS;

const TABLE_ORDER: TableKey[] = ["teams", "players", "coaches", "matches"];

const PRIMARY_KEYS: Record<TableKey, string> = {
  teams: "_id",
  players: "_id",
  coaches: "steamid",
  matches: "id",
};

const runAsync = (
  db: sqlite3.Database,
  sql: string,
  params: unknown[] = [],
) =>
  new Promise<void>((resolve, reject) => {
    db.run(sql, params, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

const allAsync = <T>(
  db: sqlite3.Database,
  sql: string,
  params: unknown[] = [],
) =>
  new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (error, rows: T[]) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });

const closeAsync = (db: sqlite3.Database) =>
  new Promise<void>((resolve, reject) => {
    db.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

const openDatabase = (
  filePath: string,
  mode: number = sqlite3.OPEN_READONLY,
) =>
  new Promise<sqlite3.Database>((resolve, reject) => {
    const db = new sqlite3.Database(filePath, mode, (error) => {
      if (error) reject(error);
      else resolve(db);
    });
  });

const buildInsertStatement = (table: TableKey, mode: "insert" | "upsert") => {
  const columns = TABLE_COLUMNS[table];
  const placeholders = columns.map(() => "?").join(", ");
  const prefix = mode === "upsert" ? "INSERT OR REPLACE" : "INSERT";
  return {
    sql: `${prefix} INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    columns,
  };
};

const normalizeRowValue = (table: TableKey, column: string, value: any) => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (table === "matches" && column === "current") {
    return Number(value) ? 1 : 0;
  }
  return value;
};

const insertRows = async (
  db: sqlite3.Database,
  table: TableKey,
  rows: Record<string, any>[],
  mode: "insert" | "upsert" = "insert",
) => {
  if (rows.length === 0) return;
  const { sql, columns } = buildInsertStatement(table, mode);
  for (const row of rows) {
    const values = columns.map((column) =>
      normalizeRowValue(table, column, row[column]),
    );
    await runAsync(db, sql, values);
  }
};

export type DatabaseSnapshot = {
  teams: DatabaseTeamRow[];
  players: DatabasePlayerRow[];
  coaches: DatabaseCoachRow[];
  matches: DatabaseMatchRow[];
};

const readSnapshot = async (
  db: sqlite3.Database,
): Promise<DatabaseSnapshot> => {
  const [teams, players, coaches, matches] = await Promise.all([
    allAsync<DatabaseTeamRow>(db, "SELECT * FROM teams"),
    allAsync<DatabasePlayerRow>(db, "SELECT * FROM players"),
    allAsync<DatabaseCoachRow>(db, "SELECT * FROM coaches"),
    allAsync<DatabaseMatchRow>(db, "SELECT * FROM matches"),
  ]);

  return { teams, players, coaches, matches };
};

export const loadDatabaseSnapshot = async (
  sourcePath: string,
): Promise<DatabaseSnapshot> => {
  const absoluteSource = path.resolve(sourcePath);
  const sourceDb = await openDatabase(absoluteSource, sqlite3.OPEN_READONLY);
  try {
    return await readSnapshot(sourceDb);
  } finally {
    await closeAsync(sourceDb);
  }
};

type FilteredSnapshot = DatabaseSnapshot & {
  autoIncludedTeams: string[];
};

const filterSnapshotBySelection = (
  snapshot: DatabaseSnapshot,
  selection: DataExportSelection,
): FilteredSnapshot => {
  const selectedPlayers = selection.players.includeAll
    ? snapshot.players
    : snapshot.players.filter((player) =>
        selection.players.ids.includes(String(player._id)),
      );

  const selectedCoaches = selection.coaches.includeAll
    ? snapshot.coaches
    : snapshot.coaches.filter((coach) =>
        selection.coaches.ids.includes(String(coach.steamid)),
      );

  const selectedMatches = selection.matches.includeAll
    ? snapshot.matches
    : snapshot.matches.filter((match) =>
        selection.matches.ids.includes(String(match.id)),
      );

  const baseTeamIds = selection.teams.includeAll
    ? new Set(snapshot.teams.map((team) => String(team._id)))
    : new Set(selection.teams.ids.map((id) => String(id)));

  const autoIncluded = new Set<string>();

  const registerTeam = (id: unknown) => {
    if (id === null || id === undefined) return;
    const key = String(id);
    if (key.length === 0) return;
    if (!baseTeamIds.has(key)) {
      baseTeamIds.add(key);
      autoIncluded.add(key);
    }
  };

  selectedPlayers.forEach((player) => registerTeam(player.team));
  selectedCoaches.forEach((coach) => registerTeam(coach.team));
  selectedMatches.forEach((match) => {
    registerTeam(match.left_id);
    registerTeam(match.right_id);
  });

  const selectedTeams = selection.teams.includeAll
    ? snapshot.teams
    : snapshot.teams.filter((team) => baseTeamIds.has(String(team._id)));

  return {
    teams: selectedTeams,
    players: selectedPlayers,
    coaches: selectedCoaches,
    matches: selectedMatches,
    autoIncludedTeams: Array.from(autoIncluded),
  };
};

/*
export const importSelectionFromFile = async (
  sourcePath: string,
  selection: DataExportSelection,
): Promise<ImportDataResult> => {
  const zip = new AdmZip(sourcePath);
  const tempDir = path.join(getUploadsPath(), "..", "temp-import");
  await fsPromises.rm(tempDir, { recursive: true, force: true });
  zip.extractAllTo(tempDir, true);

  const dbPath = path.join(tempDir, "database.db");
  const snapshot = await loadDatabaseSnapshot(dbPath);
  const filtered = filterSnapshotBySelection(snapshot, selection);

  const counts: DataTransferCounts = {
    teams: filtered.teams.length,
    players: filtered.players.length,
    coaches: filtered.coaches.length,
    matches: filtered.matches.length,
  };

  await runAsync(database, "PRAGMA foreign_keys = OFF");
  await runAsync(database, "BEGIN IMMEDIATE TRANSACTION");

  try {
    await insertRows(database, "teams", filtered.teams, "upsert");
    await insertRows(database, "players", filtered.players, "upsert");
    await insertRows(database, "coaches", filtered.coaches, "upsert");
    await insertRows(database, "matches", filtered.matches, "upsert");

    await runAsync(database, "COMMIT");
  } catch (error) {
    await runAsync(database, "ROLLBACK");
    throw error;
  } finally {
    await runAsync(database, "PRAGMA foreign_keys = ON");
  }

  const uploadsPath = getUploadsPath();
  const importUploadsPath = path.join(tempDir, "uploads");

  try {
    await fsPromises.access(importUploadsPath);
    console.log(`Found uploads folder in import: ${importUploadsPath}`);
    // copy all files from importUploadsPath to uploadsPath recursively
    const copyDir = async (src: string, dest: string) => {
      await fsPromises.mkdir(dest, { recursive: true });
      const entries = await fsPromises.readdir(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          await copyDir(srcPath, destPath);
        } else {
          console.log(`Copying ${srcPath} to ${destPath}`);
          await fsPromises.copyFile(srcPath, destPath);
        }
      }
    };
    await copyDir(importUploadsPath, uploadsPath);
  } catch (error) {
    console.error(`Could not process uploads from import:`, error);
  }

  await fsPromises.rm(tempDir, { recursive: true, force: true });

  return {
    success: true,
    message: "Import completed successfully.",
    counts,
    autoIncludedTeams: filtered.autoIncludedTeams,
  };
};*/

const fetchRowsBySelection = async (
  table: TableKey,
  selection: DataSelection,
) => {
  if (selection.includeAll) {
    return allAsync<Record<string, any>>(database, `SELECT * FROM ${table}`);
  }

  if (selection.ids.length === 0) {
    return [];
  }

  const key = PRIMARY_KEYS[table];
  const placeholders = selection.ids.map(() => "?").join(", ");
  return allAsync<Record<string, any>>(
    database,
    `SELECT * FROM ${table} WHERE ${key} IN (${placeholders})`,
    selection.ids,
  );
};

/*
export const exportDatabaseSelection = async (
  targetPath: string,
  selection: DataExportSelection,
): Promise<ExportDataResult> => {
  const players = await fetchRowsBySelection("players", selection.players);
  const coaches = await fetchRowsBySelection("coaches", selection.coaches);
  const matches = await fetchRowsBySelection("matches", selection.matches);

  const teamIds = new Set(
    selection.teams.includeAll ? [] : selection.teams.ids.map((id) => String(id)),
  );
  const autoIncludedTeams: string[] = [];

  if (!selection.teams.includeAll) {
    const registerTeam = (id: unknown) => {
      if (id === null || id === undefined) return;
      const key = String(id);
      if (key.length === 0 || teamIds.has(key)) return;
      teamIds.add(key);
      autoIncludedTeams.push(key);
    };

    players.forEach((player) => registerTeam(player.team));
    coaches.forEach((coach) => registerTeam(coach.team));
    matches.forEach((match) => {
      registerTeam(match.left_id);
      registerTeam(match.right_id);
    });
  }

  const teams = selection.teams.includeAll
    ? await allAsync<Record<string, any>>(database, "SELECT * FROM teams")
    : teamIds.size > 0
      ? await allAsync<Record<string, any>>(
          database,
          `SELECT * FROM teams WHERE _id IN (${Array.from(teamIds)
            .map(() => "?")
            .join(", ")})`,
          Array.from(teamIds),
        )
      : [];

  const counts: DataTransferCounts = {
    teams: teams.length,
    players: players.length,
    coaches: coaches.length,
    matches: matches.length,
  };

  const zip = new AdmZip();

  const tempDbPath = path.join(getUploadsPath(), "..", "temp-export.db");
  await fsPromises.rm(tempDbPath, { force: true });

  const exportDb = await openDatabase(
    tempDbPath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  );

  try {
    applyDatabaseSchema(exportDb);
    await runAsync(exportDb, "PRAGMA foreign_keys = OFF");
    await runAsync(exportDb, "BEGIN IMMEDIATE TRANSACTION");

    try {
      await insertRows(exportDb, "teams", teams);
      await insertRows(exportDb, "players", players);
      await insertRows(exportDb, "coaches", coaches);
      await insertRows(exportDb, "matches", matches);
      await runAsync(exportDb, "COMMIT");
    } catch (error) {
      await runAsync(exportDb, "ROLLBACK");
      throw error;
    } finally {
      await runAsync(exportDb, "PRAGMA foreign_keys = ON");
    }
  } finally {
    await closeAsync(exportDb);
  }

  zip.addLocalFile(tempDbPath, "", "database.db");
  await fsPromises.rm(tempDbPath, { force: true });

  const uploadsPath = getUploadsPath();

  const addFileToZip = async (filePath: string, zipPath: string) => {
    try {
      await fsPromises.access(filePath);
      console.log(`Adding ${filePath} to zip at ${zipPath}`);
      zip.addLocalFile(filePath, path.dirname(zipPath));
    } catch (error) {
      console.error(`Could not add ${filePath} to zip:`, error);
    }
  };

  for (const player of players) {
    if (player.avatar) {
      const avatarPath = path.join(uploadsPath, "player_pictures", player.avatar);
      await addFileToZip(avatarPath, `uploads/player_pictures/${player.avatar}`);
    }
  }

  for (const coach of coaches) {
    if (coach.avatar) {
      const avatarPath = path.join(uploadsPath, "coach_pictures", coach.avatar);
      await addFileToZip(avatarPath, `uploads/coach_pictures/${coach.avatar}`);
    }
  }

  for (const team of teams) {
    if (team.logo) {
      const logoPath = path.join(uploadsPath, "team_logos", team.logo);
      await addFileToZip(logoPath, `uploads/team_logos/${team.logo}`);
    }
  }

  zip.writeZip(targetPath);

  return {
    success: true,
    message: "Data exported successfully.",
    counts,
    filePath: targetPath,
    autoIncludedTeams,
  };
};*/
