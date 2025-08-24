import { database } from "../../../configs/database.js";

/* ====================== Notes: ======================*/
// Parameterbinding to stop SQL injection
// Try to return a unique identifier when inserting/updating/deleting


/**
 * Model for selecting all coaches in the coaches table.
 * @returns An array of coaches
 */
export const selectAll = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM coaches";
    database.all(statement, [], (error: Error, coaches: string[]) => {
      if (error) {
        console.error("Error getting all coaches:", error);
        reject(error);
      } else resolve(coaches);
    });
  });
};

/**
 * Model for selecting a coach in the coaches table by their steamid
 * @param steamid - The steamid of the coach to select
 * @returns A single coach
 */
export const selectBySteamID = (steamid: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM coaches WHERE steamid = ?";
    database.get(statement, [steamid], (error: Error, coach: string) => {
      if (error) {
        console.error(`Error finding coach with steamid: ${steamid}`, error);
        reject(error);
      } else resolve(coach);
    });
  });
};

/**
 * Model for inserting a coach into the coaches table.
 * @param steamid - The steamid of the coach to be created
 * @returns The steamid of the newly created coach
 */
export const insert = (steamid: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const statement = "INSERT INTO coaches (steamid) VALUES (?)";
    database.run(statement, [steamid], (error: Error) => {
      if (error) {
        console.error("Error creating coach:", error);
        reject(error);
      } else resolve(steamid);
    });
  });
};

/**
 * Model for removing a coach in the coaches table.
 * @param steamid - The steamid of the coach to be removed
 * @returns The steamid of the removed coach
 */
export const remove = (steamid: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const statement = "DELETE FROM coaches WHERE steamid = ?";
    database.run(statement, [steamid], (error: Error) => {
      if (error) {
        console.error("Error removing coach:", error);
        reject(error);
      } else resolve(steamid);
    });
  });
};