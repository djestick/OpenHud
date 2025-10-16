import sqlite3 from "sqlite3";
import { getDatabasePath } from "../helpers/pathResolver.js";

export const TABLE_COLUMNS = {
  teams: [
    "_id",
    "name",
    "country",
    "shortName",
    "logo",
    "extra",
    "createdAt",
    "updatedAt",
  ],
  players: [
    "_id",
    "firstName",
    "lastName",
    "username",
    "avatar",
    "country",
    "steamid",
    "team",
    "extra",
    "createdAt",
    "updatedAt",
  ],
  matches: [
    "id",
    "current",
    "left_id",
    "left_wins",
    "right_id",
    "right_wins",
    "matchType",
    "vetos",
    "createdAt",
    "updatedAt",
  ],
  coaches: [
    "steamid",
    "name",
    "team",
    "createdAt",
    "updatedAt",
  ],
} as const;

type SchemaEntry = {
  sql: string;
  onError: (error: Error) => void;
};

const schemaStatements: SchemaEntry[] = [
  {
    sql: `CREATE TABLE IF NOT EXISTS teams (
        _id TEXT PRIMARY KEY NOT NULL UNIQUE,
        name TEXT NOT NULL,
        country TEXT,
        shortName TEXT,
        logo TEXT,
        extra TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    onError: (error) =>
      console.error("Error creating teams table:", error.message),
  },
  {
    sql: `
    CREATE TRIGGER IF NOT EXISTS update_teams_updatedAt
    AFTER UPDATE ON teams
    FOR EACH ROW
    BEGIN
        UPDATE teams SET updatedAt = CURRENT_TIMESTAMP WHERE _id = OLD._id;
    END;
  `,
    onError: (error) =>
      console.error(
        "Error creating update_teams_updatedAt trigger:",
        error.message,
      ),
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS players (
        _id TEXT PRIMARY KEY NOT NULL UNIQUE,
        firstName TEXT,
        lastName TEXT,
        username TEXT NOT NULL,
        avatar TEXT,
        country TEXT,
        steamid TEXT NOT NULL UNIQUE,
        team TEXT,
        extra TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team) REFERENCES teams(_id) ON DELETE SET NULL
      )`,
    onError: (error) =>
      console.error("Error creating players table:", error.message),
  },
  {
    sql: `
    CREATE TRIGGER IF NOT EXISTS update_players_updatedAt
    AFTER UPDATE ON players
    FOR EACH ROW
    BEGIN
        UPDATE players SET updatedAt = CURRENT_TIMESTAMP WHERE _id = OLD._id;
    END;
  `,
    onError: (error) =>
      console.error(
        "Error creating update_players_updatedAt trigger:",
        error.message,
      ),
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY NOT NULL UNIQUE,
        current INTEGER DEFAULT 0 CHECK (current IN (0, 1)),
        left_id TEXT,
        left_wins INTEGER DEFAULT 0 CHECK (left_wins BETWEEN 0 AND 5),
        right_id TEXT,
        right_wins INTEGER DEFAULT 0 CHECK (right_wins BETWEEN 0 AND 5),
        matchType TEXT NOT NULL CHECK (matchType IN ('bo1', 'bo3', 'bo5')),
        vetos TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (left_id) REFERENCES teams(_id) ON DELETE SET NULL,
        FOREIGN KEY (right_id) REFERENCES teams(_id) ON DELETE SET NULL,
        CHECK (left_id != right_id)
      )`,
    onError: (error) =>
      console.error("Error creating matches table:", error.message),
  },
  {
    sql: `
    CREATE TRIGGER IF NOT EXISTS update_matches_updatedAt
    AFTER UPDATE ON matches
    FOR EACH ROW
    BEGIN
        UPDATE matches SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `,
    onError: (error) =>
      console.error(
        "Error creating update_matches_updatedAt trigger:",
        error.message,
      ),
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS coaches (
        steamid TEXT PRIMARY KEY NOT NULL UNIQUE,
        name TEXT,
        team TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team) REFERENCES teams(_id) ON DELETE SET NULL
      )`,
    onError: (error) =>
      console.error("Error creating coaches table:", error.message),
  },
  {
    sql: `
    CREATE TRIGGER IF NOT EXISTS update_coaches_updatedAt
    AFTER UPDATE ON coaches
    FOR EACH ROW
    BEGIN
        UPDATE coaches SET updatedAt = CURRENT_TIMESTAMP WHERE steamid = OLD.steamid;
    END;
  `,
    onError: (error) =>
      console.error(
        "Error creating update_coaches_updatedAt trigger:",
        error.message,
      ),
  },
];

export const applyDatabaseSchema = (db: sqlite3.Database) => {
  db.run("PRAGMA foreign_keys = ON");

  db.serialize(() => {
    schemaStatements.forEach(({ sql, onError }) => {
      db.run(sql, (error) => {
        if (error) {
          onError(error);
        }
      });
    });
  });
};

/* Initialize the SQLite database with tables */
export const database = new sqlite3.Database(getDatabasePath(), (error) => {
  if (error) {
    console.log(error);
  }
  applyDatabaseSchema(database);
});
