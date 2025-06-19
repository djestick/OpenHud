import path from "path";
import { database } from "../../../configs/index.js";
import { getUploadsPath } from "./paths.js";
import fs from "fs";

export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Wraps a set of database operations in a transaction with commit and rollback.
 */
export const run_transaction = (
  operations: () => Promise<any>
): Promise<any> => {
  return new Promise((resolve, reject) => {
    database.serialize(() => {
      database.run("BEGIN TRANSACTION", (beginErr) => {
        if (beginErr) {
          console.error("Failed to begin transaction:", beginErr);
          return reject(beginErr);
        }

        operations()
          .then((result) => {
            database.run("COMMIT", (commitErr) => {
              if (commitErr) {
                console.error("Failed to commit transaction:", commitErr);
                return reject(commitErr);
              }
              resolve(result);
            });
          })
          .catch((err) => {
            console.error("Transaction operation failed, rolling back:", err);
            database.run("ROLLBACK", (rollbackErr) => {
              if (rollbackErr) {
                console.error("Failed to rollback transaction:", rollbackErr);
              }
              reject(err);
            });
          });
      });
    });
  });
};

/* === Ensure directories exist for uploaded pictures === */
export function checkDirectories() {
  const uploadsDir = getUploadsPath();
  const playerPicturesDir = path.join(uploadsDir, "player_pictures");
  const teamLogosDir = path.join(uploadsDir, "team_logos");

  [uploadsDir, playerPicturesDir, teamLogosDir].forEach(createMissingDir);
}

function createMissingDir(directory: string) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}
/* ======================================================= */
