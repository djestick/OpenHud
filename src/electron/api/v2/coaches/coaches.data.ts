import { database } from "../../../configs/database.js";

/* ====================== Notes: ======================*/
// Parameterbinding to stop SQL injection
// Try to return a unique identifier when inserting/updating/deleting

export interface CoachRecord {
  steamid: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  avatar?: string | null;
  country?: string | null;
  team?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Model for selecting all coaches in the coaches table.
 * @returns An array of coaches
 */
export const selectAll = (): Promise<CoachRecord[]> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM coaches";
    database.all(statement, [], (error: Error, coaches: CoachRecord[]) => {
      if (error) {
        console.error("Error getting all coaches:", error);
        reject(error);
      } else resolve(coaches);
    });
  });
};

/**
 * Model for selecting all steamids from the coaches table.
 * @returns An array of steamid strings
 */
export const selectAllSteamids = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT steamid FROM coaches";
    database.all(statement, [], (error: Error, rows: { steamid: string }[]) => {
      if (error) {
        console.error("Error getting coach steamids:", error);
        return reject(error);
      }

      const steamids = (rows || []).map((r) => r.steamid);
      resolve(steamids);
    });
  });
};

/**
 * Model for selecting a coach in the coaches table by their steamid
 * @param steamid - The steamid of the coach to select
 * @returns A single coach
 */
export const selectBySteamID = (steamid: string): Promise<CoachRecord | undefined> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM coaches WHERE steamid = ?";
    database.get(statement, [steamid], (error: Error, coach: CoachRecord | undefined) => {
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
 * @param name - The new name
 * @param team - The new team
 * @returns The steamid of the newly created coach
 */
export const insert = (coach: CoachRecord): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!coach.steamid) return reject(new Error("steamid is required"));

    try {
      database.serialize(async () => {
        try {
          // ensure steamid is unique
          const existing = await selectBySteamID(coach.steamid).catch(() => undefined);
          if (existing) return reject(new Error("steamid already exists"));

          const statement =
            "INSERT INTO coaches (steamid, username, firstName, lastName, name, avatar, country, team) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
          database.run(
            statement,
            [
              coach.steamid,
              coach.username || null,
              coach.firstName || null,
              coach.lastName || null,
              coach.name || null,
              coach.avatar || null,
              coach.country || null,
              coach.team ? coach.team : null,
            ],
            (error: Error) => {
            if (error) {
              console.error("Error creating coach:", error);
              return reject(error);
            }
            resolve(coach.steamid);
          },
          );
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
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

/**
 * Model for updating a coach in the coaches table.
 * @param steamid - The steamid of the coach to update
 * @param coach - The updated coach payload
 * @returns The steamid of the updated coach
 */
export const update = (currentSteamid: string, coach: CoachRecord): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!currentSteamid) return reject(new Error("steamid is required to update coach"));
    if (!coach.steamid) return reject(new Error("steamid is required for coach payload"));

    database.serialize(async () => {
      try {
        if (coach.steamid !== currentSteamid) {
          const existing = await selectBySteamID(coach.steamid).catch(() => undefined);
          if (existing) return reject(new Error("steamid already exists"));
        }

        const statement =
          "UPDATE coaches SET steamid = ?, username = ?, firstName = ?, lastName = ?, name = ?, avatar = ?, country = ?, team = ? WHERE steamid = ?";
        database.run(
          statement,
          [
            coach.steamid,
            coach.username || null,
            coach.firstName || null,
            coach.lastName || null,
            coach.name || null,
            coach.avatar || null,
            coach.country || null,
            coach.team ? coach.team : null,
            currentSteamid,
          ],
          (error: Error) => {
            if (error) {
              console.error("Error updating coach:", error);
              return reject(error);
            }
            resolve(coach.steamid);
          },
        );
      } catch (err) {
        reject(err);
      }
    });
  });
};
