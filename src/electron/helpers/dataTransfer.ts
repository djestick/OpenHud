import sqlite3 from "sqlite3";
import { promises as fsPromises } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import AdmZip from "adm-zip";
import { database, TABLE_COLUMNS } from "../configs/database.js";

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

const PRIMARY_KEYS: Record<TableKey, string> = {
  teams: "_id",
  players: "_id",
  coaches: "steamid",
  matches: "id",
};

type ExportColumn<T extends Record<string, unknown>> = {
  header: string;
  key: string;
  width?: number;
  hidden?: boolean;
  value: (record: T) => unknown;
};

const toNodeBuffer = (payload: Buffer | ArrayBuffer): Buffer =>
  Buffer.isBuffer(payload) ? payload : Buffer.from(payload);

const sanitizeExportValue = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("toString" in value) {
      const toStringResult = (value as { toString: () => string }).toString();
      if (toStringResult !== "[object Object]") return toStringResult;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return value;
};

const createWorkbookBuffer = async <T extends Record<string, unknown>>(
  sheetName: string,
  columns: ExportColumn<T>[],
  records: T[],
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const now = new Date();
  workbook.created = now;
  workbook.modified = now;

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = columns.map(({ header, key, width }) => ({
    header,
    key,
    width,
  }));

  columns.forEach((column, index) => {
    if (column.hidden) {
      worksheet.getColumn(index + 1).hidden = true;
    }
  });

  records.forEach((record) => {
    const row: Record<string, unknown> = {};
    columns.forEach((column) => {
      row[column.key] = sanitizeExportValue(column.value(record));
    });
    worksheet.addRow(row);
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };

  if (columns.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return toNodeBuffer(buffer);
};

type HeaderMap = Map<string, number>;

const normaliseHeaderKey = (value: unknown) =>
  String(value ?? "").trim().toLowerCase();

const buildHeaderMap = (worksheet: ExcelJS.Worksheet): HeaderMap => {
  const headerRow = worksheet.getRow(1);
  const map: HeaderMap = new Map();
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const key = normaliseHeaderKey(cell.value);
    if (key.length > 0) {
      map.set(key, colNumber);
    }
  });
  return map;
};

const ensureHeader = (headerMap: HeaderMap, header: string, sheet: string) => {
  if (!headerMap.has(normaliseHeaderKey(header))) {
    throw new Error(`${sheet} is missing required column '${header}'.`);
  }
};

const extractPlainCellValue = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString();

  if (typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.text === "string") return candidate.text;
    if (Array.isArray(candidate.richText)) {
      const richTextSegments = candidate.richText as Array<{ text?: string }>;
      return richTextSegments.map((segment) => segment?.text ?? "").join("");
    }
    if (candidate.result !== undefined && candidate.result !== null) {
      return candidate.result;
    }
    if (typeof candidate.hyperlink === "string" && candidate.text) {
      return candidate.text;
    }
    try {
      return JSON.stringify(candidate);
    } catch {
      return String(candidate);
    }
  }

  return value;
};

const readCellValue = (
  row: ExcelJS.Row,
  headerMap: HeaderMap,
  header: string,
) => {
  const columnIndex = headerMap.get(normaliseHeaderKey(header));
  if (!columnIndex) return undefined;
  const cell = row.getCell(columnIndex);
  return extractPlainCellValue(cell.value);
};

const readStringCell = (
  row: ExcelJS.Row,
  headerMap: HeaderMap,
  header: string,
) => {
  const raw = readCellValue(row, headerMap, header);
  if (raw === undefined || raw === null) return undefined;
  const text = String(raw).trim();
  return text.length > 0 ? text : undefined;
};

const readNumberCell = (
  row: ExcelJS.Row,
  headerMap: HeaderMap,
  header: string,
) => {
  const raw = readCellValue(row, headerMap, header);
  if (raw === undefined || raw === null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

type WorksheetRowParser<T> = (
  row: ExcelJS.Row,
  headerMap: HeaderMap,
  rowNumber: number,
) => T | null;

const parseWorksheetRecords = async <T>(
  buffer: Buffer,
  sheetLabel: string,
  parser: WorksheetRowParser<T>,
  prepare?: (headerMap: HeaderMap) => void,
): Promise<T[]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error(`${sheetLabel} does not contain any worksheets.`);
  }

  const headerMap = buildHeaderMap(worksheet);
  if (prepare) {
    prepare(headerMap);
  }
  const records: T[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1 || !row.hasValues) return;
    const parsed = parser(row, headerMap, rowNumber);
    if (parsed) records.push(parsed);
  });

  return records;
};

const assignOptional = (
  target: Record<string, unknown>,
  key: string,
  value: unknown,
) => {
  if (value !== undefined) {
    target[key] = value;
  }
};

const parseTeamsWorkbook = (buffer: Buffer): Promise<DatabaseTeamRow[]> =>
  parseWorksheetRecords(
    buffer,
    "teams.xlsx",
    (row, headerMap) => {
      const id =
        readStringCell(row, headerMap, "Team ID") ??
        readStringCell(row, headerMap, "Team name");
      if (!id) {
        return null;
      }

      const team: DatabaseTeamRow = {
        _id: id,
        name: readStringCell(row, headerMap, "Team name") ?? undefined,
        shortName: readStringCell(row, headerMap, "Short name") ?? undefined,
        country: readStringCell(row, headerMap, "Country Code") ?? undefined,
        logo: readStringCell(row, headerMap, "Logo") ?? undefined,
      };

      assignOptional(
        team as Record<string, unknown>,
        "extra",
        readStringCell(row, headerMap, "Extra"),
      );
      assignOptional(
        team as Record<string, unknown>,
        "createdAt",
        readStringCell(row, headerMap, "Created At"),
      );
      assignOptional(
        team as Record<string, unknown>,
        "updatedAt",
        readStringCell(row, headerMap, "Updated At"),
      );

      return team;
    },
    (headerMap) => {
      ensureHeader(headerMap, "Team name", "teams.xlsx");
    },
  );

type ResolveTeamId = (name: string | undefined) => string | undefined;

const buildTeamNameResolver = (teams: DatabaseTeamRow[]): ResolveTeamId => {
  const map = new Map<string, string>();
  teams.forEach((team) => {
    const id = team._id ? String(team._id) : undefined;
    if (!id) return;
    if (team.name) {
      map.set(team.name.trim().toLowerCase(), id);
    }
    if (team.shortName) {
      map.set(team.shortName.trim().toLowerCase(), id);
    }
  });

  return (name) => {
    if (!name) return undefined;
    return map.get(name.trim().toLowerCase());
  };
};

const parsePlayersWorkbook = (
  buffer: Buffer,
  resolveTeamId: ResolveTeamId,
): Promise<DatabasePlayerRow[]> =>
  parseWorksheetRecords(
    buffer,
    "players.xlsx",
    (row, headerMap, rowNumber) => {
      const steamId =
        readStringCell(row, headerMap, "SteamID") ??
        readStringCell(row, headerMap, "Steam Id");
      if (!steamId) {
        throw new Error(
          `players.xlsx row ${rowNumber} is missing a SteamID value.`,
        );
      }

      const preferredId =
        readStringCell(row, headerMap, "Player ID") ??
        readStringCell(row, headerMap, "ID") ??
        steamId ??
        readStringCell(row, headerMap, "Username");
      if (!preferredId) {
        throw new Error(
          `players.xlsx row ${rowNumber} is missing both Player ID and Username.`,
        );
      }

      const teamName = readStringCell(row, headerMap, "Team Name");
      const teamId =
        readStringCell(row, headerMap, "Team ID") ?? resolveTeamId(teamName);

      const player: DatabasePlayerRow = {
        _id: preferredId,
        username: readStringCell(row, headerMap, "Username") ?? undefined,
        firstName: readStringCell(row, headerMap, "First Name") ?? undefined,
        lastName: readStringCell(row, headerMap, "Last Name") ?? undefined,
        country: readStringCell(row, headerMap, "Country Code") ?? undefined,
        steamid: steamId,
        team: teamId ?? undefined,
        avatar: readStringCell(row, headerMap, "Avatar") ?? undefined,
      };

      assignOptional(
        player as Record<string, unknown>,
        "extra",
        readStringCell(row, headerMap, "Extra"),
      );
      assignOptional(
        player as Record<string, unknown>,
        "createdAt",
        readStringCell(row, headerMap, "Created At"),
      );
      assignOptional(
        player as Record<string, unknown>,
        "updatedAt",
        readStringCell(row, headerMap, "Updated At"),
      );

      return player;
    },
    (headerMap) => {
      ensureHeader(headerMap, "SteamID", "players.xlsx");
      ensureHeader(headerMap, "Username", "players.xlsx");
    },
  );

const parseCoachesWorkbook = (
  buffer: Buffer,
  resolveTeamId: ResolveTeamId,
): Promise<DatabaseCoachRow[]> =>
  parseWorksheetRecords(
    buffer,
    "coaches.xlsx",
    (row, headerMap, rowNumber) => {
      const steamId =
        readStringCell(row, headerMap, "SteamID") ??
        readStringCell(row, headerMap, "Steam Id");
      if (!steamId) {
        throw new Error(
          `coaches.xlsx row ${rowNumber} is missing a SteamID value.`,
        );
      }

      const teamName = readStringCell(row, headerMap, "Team Name");
      const teamId =
        readStringCell(row, headerMap, "Team ID") ?? resolveTeamId(teamName);

      const coach: DatabaseCoachRow = {
        steamid: steamId,
        username: readStringCell(row, headerMap, "Username") ?? undefined,
        firstName: readStringCell(row, headerMap, "First Name") ?? undefined,
        lastName: readStringCell(row, headerMap, "Last Name") ?? undefined,
        name: readStringCell(row, headerMap, "Display Name") ?? undefined,
        avatar: readStringCell(row, headerMap, "Avatar") ?? undefined,
        country: readStringCell(row, headerMap, "Country Code") ?? undefined,
        team: teamId ?? undefined,
      };

      assignOptional(
        coach as Record<string, unknown>,
        "createdAt",
        readStringCell(row, headerMap, "Created At"),
      );
      assignOptional(
        coach as Record<string, unknown>,
        "updatedAt",
        readStringCell(row, headerMap, "Updated At"),
      );

      return coach;
    },
    (headerMap) => {
      ensureHeader(headerMap, "SteamID", "coaches.xlsx");
    },
  );

const parseMatchesWorkbook = (
  buffer: Buffer,
  resolveTeamId: ResolveTeamId,
): Promise<DatabaseMatchRow[]> =>
  parseWorksheetRecords(
    buffer,
    "matches.xlsx",
    (row, headerMap, rowNumber) => {
      const matchId =
        readStringCell(row, headerMap, "Match ID") ??
        readStringCell(row, headerMap, "ID");
      if (!matchId) {
        throw new Error(
          `matches.xlsx row ${rowNumber} is missing a Match ID value.`,
        );
      }

      const leftTeamName = readStringCell(row, headerMap, "Left Team Name");
      const rightTeamName = readStringCell(row, headerMap, "Right Team Name");

      const leftTeamId =
        readStringCell(row, headerMap, "Left Team ID") ??
        resolveTeamId(leftTeamName);
      const rightTeamId =
        readStringCell(row, headerMap, "Right Team ID") ??
        resolveTeamId(rightTeamName);

      const current =
        readNumberCell(row, headerMap, "Current") ??
        readNumberCell(row, headerMap, "Is Current") ??
        0;

      const leftWins =
        readNumberCell(row, headerMap, "Left Wins") ??
        readNumberCell(row, headerMap, "Left Score") ??
        0;
      const rightWins =
        readNumberCell(row, headerMap, "Right Wins") ??
        readNumberCell(row, headerMap, "Right Score") ??
        0;

      const matchType =
        readStringCell(row, headerMap, "Match Type") ?? "bo1";
      const vetos =
        readStringCell(row, headerMap, "Vetos") ??
        readStringCell(row, headerMap, "Vetoes") ??
        "[]";

      const match: DatabaseMatchRow = {
        id: matchId,
        current: Number(current) ? 1 : 0,
        left_id: leftTeamId ?? undefined,
        right_id: rightTeamId ?? undefined,
        matchType,
      };

      const matchRecord = match as Record<string, unknown>;
      matchRecord.left_wins = Number(leftWins);
      matchRecord.right_wins = Number(rightWins);
      matchRecord.vetos = vetos;

      assignOptional(
        matchRecord,
        "createdAt",
        readStringCell(row, headerMap, "Created At"),
      );
      assignOptional(
        matchRecord,
        "updatedAt",
        readStringCell(row, headerMap, "Updated At"),
      );

      return match;
    },
    (headerMap) => {
      ensureHeader(headerMap, "Match ID", "matches.xlsx");
    },
  );

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

const buildInsertStatement = (table: TableKey, mode: "insert" | "upsert") => {
  const columns = TABLE_COLUMNS[table];
  const placeholders = columns.map(() => "?").join(", ");
  const prefix = mode === "upsert" ? "INSERT OR REPLACE" : "INSERT";
  return {
    sql: `${prefix} INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    columns,
  };
};

const normalizeRowValue = (
  table: TableKey,
  column: string,
  value: unknown,
) => {
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
  rows: Array<Record<string, unknown>>,
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

export const loadDatabaseSnapshot = async (
  sourcePath: string,
): Promise<DatabaseSnapshot> => {
  if (typeof sourcePath !== "string" || sourcePath.length === 0) {
    throw new TypeError("A valid source path must be provided for database import.");
  }

  const absoluteSource = path.resolve(sourcePath);
  let zip: AdmZip;
  try {
    zip = new AdmZip(absoluteSource);
  } catch (error) {
    throw new Error(
      `Failed to read archive: ${(error as Error).message}`,
    );
  }

  const entries: AdmZip.IZipEntry[] = zip.getEntries();
  if (!entries || entries.length === 0) {
    throw new Error("Archive is empty or unreadable.");
  }

  const resolveEntryBuffer = (fileName: string) => {
    const target = fileName.toLowerCase();
    const entry = entries.find(
      (candidate: AdmZip.IZipEntry) =>
        !candidate.isDirectory &&
        candidate.entryName.toLowerCase().endsWith(target),
    );
    if (!entry) {
      throw new Error(`Archive is missing required file '${fileName}'.`);
    }
    return entry.getData();
  };

  const teams = await parseTeamsWorkbook(resolveEntryBuffer("teams.xlsx"));
  const resolveTeamId = buildTeamNameResolver(teams);

  const [players, coaches, matches] = await Promise.all([
    parsePlayersWorkbook(resolveEntryBuffer("players.xlsx"), resolveTeamId),
    parseCoachesWorkbook(resolveEntryBuffer("coaches.xlsx"), resolveTeamId),
    parseMatchesWorkbook(resolveEntryBuffer("matches.xlsx"), resolveTeamId),
  ]);

  return { teams, players, coaches, matches };
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

export const importDatabaseSelection = async (
  sourcePath: string,
  selection: DataExportSelection,
): Promise<ImportDataResult> => {
  const snapshot = await loadDatabaseSnapshot(sourcePath);
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

  return {
    success: true,
    message: "Import completed successfully.",
    counts,
    autoIncludedTeams: filtered.autoIncludedTeams,
  };
};

const fetchRowsBySelection = async (
  table: TableKey,
  selection: DataSelection,
) => {
  if (selection.includeAll) {
    return allAsync<Record<string, unknown>>(database, `SELECT * FROM ${table}`);
  }

  if (selection.ids.length === 0) {
    return [];
  }

  const key = PRIMARY_KEYS[table];
  const placeholders = selection.ids.map(() => "?").join(", ");
  return allAsync<Record<string, unknown>>(
    database,
    `SELECT * FROM ${table} WHERE ${key} IN (${placeholders})`,
    selection.ids,
  );
};

export const exportDatabaseSnapshot = async (
  targetPath: string,
  selection: DataExportSelection,
): Promise<ExportDataResult> => {
  const players = (await fetchRowsBySelection(
    "players",
    selection.players,
  )) as DatabasePlayerRow[];
  const coaches = (await fetchRowsBySelection(
    "coaches",
    selection.coaches,
  )) as DatabaseCoachRow[];
  const matches = (await fetchRowsBySelection(
    "matches",
    selection.matches,
  )) as DatabaseMatchRow[];

  const teamIds = new Set(
    selection.teams.includeAll
      ? []
      : selection.teams.ids.map((id) => String(id)),
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

  const teams = (selection.teams.includeAll
    ? await allAsync<Record<string, unknown>>(database, "SELECT * FROM teams")
    : teamIds.size > 0
      ? await allAsync<Record<string, unknown>>(
          database,
          `SELECT * FROM teams WHERE _id IN (${Array.from(teamIds)
            .map(() => "?")
            .join(", ")})`,
          Array.from(teamIds),
        )
      : []) as DatabaseTeamRow[];

  const counts: DataTransferCounts = {
    teams: teams.length,
    players: players.length,
    coaches: coaches.length,
    matches: matches.length,
  };

  const teamById = new Map<string, DatabaseTeamRow>();
  teams.forEach((team) => {
    if (team?._id) {
      teamById.set(String(team._id), team);
    }
  });

  const resolveTeamName = (id: unknown) => {
    if (id === null || id === undefined) return undefined;
    const team = teamById.get(String(id));
    return team?.name ?? undefined;
  };

  const playerColumns: ExportColumn<DatabasePlayerRow>[] = [
    {
      header: "Player ID",
      key: "playerId",
      hidden: true,
      value: (player) => player._id ?? undefined,
    },
    {
      header: "Username",
      key: "username",
      width: 24,
      value: (player) => player.username ?? undefined,
    },
    {
      header: "SteamID",
      key: "steamId",
      width: 24,
      value: (player) => player.steamid ?? undefined,
    },
    {
      header: "First Name",
      key: "firstName",
      width: 18,
      value: (player) => player.firstName ?? undefined,
    },
    {
      header: "Last Name",
      key: "lastName",
      width: 18,
      value: (player) => player.lastName ?? undefined,
    },
    {
      header: "Country Code",
      key: "country",
      width: 14,
      value: (player) => player.country ?? undefined,
    },
    {
      header: "Team ID",
      key: "teamId",
      hidden: true,
      value: (player) => player.team ?? undefined,
    },
    {
      header: "Team Name",
      key: "teamName",
      width: 26,
      value: (player) => resolveTeamName(player.team),
    },
    {
      header: "Avatar",
      key: "avatar",
      width: 36,
      value: (player) => player.avatar ?? undefined,
    },
    {
      header: "Extra",
      key: "extra",
      hidden: true,
      value: (player) => (player as Record<string, unknown>).extra ?? undefined,
    },
    {
      header: "Created At",
      key: "createdAt",
      hidden: true,
      value: (player) =>
        (player as Record<string, unknown>).createdAt ?? undefined,
    },
    {
      header: "Updated At",
      key: "updatedAt",
      hidden: true,
      value: (player) =>
        (player as Record<string, unknown>).updatedAt ?? undefined,
    },
  ];

  const teamColumns: ExportColumn<DatabaseTeamRow>[] = [
    {
      header: "Team ID",
      key: "teamId",
      hidden: true,
      value: (team) => team._id ?? undefined,
    },
    {
      header: "Team name",
      key: "teamName",
      width: 28,
      value: (team) => team.name ?? undefined,
    },
    {
      header: "Short name",
      key: "shortName",
      width: 18,
      value: (team) => team.shortName ?? undefined,
    },
    {
      header: "Country Code",
      key: "country",
      width: 14,
      value: (team) => team.country ?? undefined,
    },
    {
      header: "Logo",
      key: "logo",
      width: 36,
      value: (team) => team.logo ?? undefined,
    },
    {
      header: "Extra",
      key: "extra",
      hidden: true,
      value: (team) => (team as Record<string, unknown>).extra ?? undefined,
    },
    {
      header: "Created At",
      key: "createdAt",
      hidden: true,
      value: (team) =>
        (team as Record<string, unknown>).createdAt ?? undefined,
    },
    {
      header: "Updated At",
      key: "updatedAt",
      hidden: true,
      value: (team) =>
        (team as Record<string, unknown>).updatedAt ?? undefined,
    },
  ];

  const coachColumns: ExportColumn<DatabaseCoachRow>[] = [
    {
      header: "SteamID",
      key: "steamId",
      width: 24,
      value: (coach) => coach.steamid ?? undefined,
    },
    {
      header: "Username",
      key: "username",
      width: 24,
      value: (coach) => coach.username ?? undefined,
    },
    {
      header: "First Name",
      key: "firstName",
      width: 18,
      value: (coach) => coach.firstName ?? undefined,
    },
    {
      header: "Last Name",
      key: "lastName",
      width: 18,
      value: (coach) => coach.lastName ?? undefined,
    },
    {
      header: "Display Name",
      key: "displayName",
      width: 24,
      value: (coach) => coach.name ?? undefined,
    },
    {
      header: "Country Code",
      key: "country",
      width: 14,
      value: (coach) => coach.country ?? undefined,
    },
    {
      header: "Team ID",
      key: "teamId",
      hidden: true,
      value: (coach) => coach.team ?? undefined,
    },
    {
      header: "Team Name",
      key: "teamName",
      width: 26,
      value: (coach) => resolveTeamName(coach.team),
    },
    {
      header: "Avatar",
      key: "avatar",
      width: 36,
      value: (coach) => coach.avatar ?? undefined,
    },
    {
      header: "Created At",
      key: "createdAt",
      hidden: true,
      value: (coach) =>
        (coach as Record<string, unknown>).createdAt ?? undefined,
    },
    {
      header: "Updated At",
      key: "updatedAt",
      hidden: true,
      value: (coach) =>
        (coach as Record<string, unknown>).updatedAt ?? undefined,
    },
  ];

  const matchColumns: ExportColumn<DatabaseMatchRow>[] = [
    {
      header: "Match ID",
      key: "matchId",
      width: 28,
      value: (match) => match.id ?? undefined,
    },
    {
      header: "Current",
      key: "current",
      width: 10,
      value: (match) => (Number(match.current) ? 1 : 0),
    },
    {
      header: "Left Team ID",
      key: "leftTeamId",
      width: 24,
      value: (match) => match.left_id ?? undefined,
    },
    {
      header: "Left Team Name",
      key: "leftTeamName",
      width: 26,
      value: (match) => resolveTeamName(match.left_id),
    },
    {
      header: "Left Wins",
      key: "leftWins",
      width: 12,
      value: (match) =>
        match.left_wins !== undefined ? Number(match.left_wins) : 0,
    },
    {
      header: "Right Team ID",
      key: "rightTeamId",
      width: 24,
      value: (match) => match.right_id ?? undefined,
    },
    {
      header: "Right Team Name",
      key: "rightTeamName",
      width: 26,
      value: (match) => resolveTeamName(match.right_id),
    },
    {
      header: "Right Wins",
      key: "rightWins",
      width: 12,
      value: (match) =>
        match.right_wins !== undefined ? Number(match.right_wins) : 0,
    },
    {
      header: "Match Type",
      key: "matchType",
      width: 12,
      value: (match) => match.matchType ?? undefined,
    },
    {
      header: "Vetos",
      key: "vetos",
      width: 80,
      value: (match) => match.vetos ?? undefined,
    },
    {
      header: "Created At",
      key: "createdAt",
      hidden: true,
      value: (match) =>
        (match as Record<string, unknown>).createdAt ?? undefined,
    },
    {
      header: "Updated At",
      key: "updatedAt",
      hidden: true,
      value: (match) =>
        (match as Record<string, unknown>).updatedAt ?? undefined,
    },
  ];

  const [playersBuffer, teamsBuffer, coachesBuffer, matchesBuffer] =
    await Promise.all([
      createWorkbookBuffer("Players", playerColumns, players),
      createWorkbookBuffer("Teams", teamColumns, teams),
      createWorkbookBuffer("Coaches", coachColumns, coaches),
      createWorkbookBuffer("Matches", matchColumns, matches),
    ]);

  const zip = new AdmZip();
  zip.addFile("players.xlsx", playersBuffer);
  zip.addFile("teams.xlsx", teamsBuffer);
  zip.addFile("coaches.xlsx", coachesBuffer);
  zip.addFile("matches.xlsx", matchesBuffer);

  await fsPromises.mkdir(path.dirname(targetPath), { recursive: true });
  await fsPromises.writeFile(targetPath, zip.toBuffer());

  return {
    success: true,
    message: "Data exported successfully.",
    counts,
    filePath: targetPath,
    autoIncludedTeams,
  };
};
