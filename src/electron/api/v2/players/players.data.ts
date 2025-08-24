import { database } from "../../../configs/database.js";

/* ====================== Notes: ======================*/
// Parameterbinding to stop SQL injection
// Try to return a unique identifier when inserting/updating/deleting

/**
 * Model for selecting all players in the players table.
 * @returns An array of players
 */
export const selectAll = (): Promise<Player[]> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM players";
    database.all(statement, [], (error: Error, players: Player[]) => {
      if (error) {
        console.error("Error getting all players:", error);
        reject(error);
      } else resolve(players);
    });
  });
};

/**
 * Model for selecting a player in the players table by their _id
 * @param id - The _id of the player to select
 * @returns A single player
 */
export const selectByID = (id: string): Promise<Player> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM players WHERE _id = ?";
    database.get(statement, [id], (error: Error, player: Player) => {
      if (error) {
        console.error(`Error finding player with id: ${id}`, error);
        reject(error);
      } else resolve(player);
    });
  });
};

/**
 * Model for selecting a player in the players table by their steamid
 * @param steamid - The steamid of the player to select
 * @returns A single player
 */
export const selectBySteamID = (steamid: string): Promise<Player> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM players WHERE steamid = ?";
    database.get(statement, [steamid], (error: Error, player: Player) => {
      if (error) {
        console.error(`Error finding player with steamid: ${steamid}`, error);
        reject(error);
      } else resolve(player);
    });
  });
};

/**
 * Model for selecting multple players in the players table by their steamids
 * @param steamids - An array of steamids of players to select
 * @returns An array of players (or an empty array if steamids is empty)
 */
export const selectMultipleBySteamID = (
  steamids: string[]
): Promise<Player[]> => {
  return new Promise((resolve, reject) => {
    if (steamids.length === 0) return resolve([]);

    // Map a questionmark for each steamid in the given array into a comma separated string: e.g (?, ?, ?)
    const parameters = steamids.map(() => "?").join(", ");
    const statement = `SELECT * FROM players WHERE steamid IN (${parameters})`;
    database.all(statement, steamids, (error: Error, players: Player[]) => {
      if (error) {
        console.error(
          `Error finding players with steamids: ${steamids}`,
          error
        );
        reject(error);
      } else resolve(players);
    });
  });
};

/**
 * Model for selecting a players avatarURL
 * @param steamid - The steamid of the player whose avatarURL you want to select
 * @returns string path to a specifc image save in player_pictures
 */
export const selectAvatarURL = (steamid: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT avatar FROM players WHERE steamid = ?";
    database.get(statement, [steamid], (error: Error, avatarURL: string) => {
      if (error) {
        console.error("Error getting player avatarURL");
        reject(error);
      } else resolve(avatarURL);
    });
  });
};

/**
 * Model for inserting player into the players table.
 * @param player - The player to be created
 * @returns The _id of the newly created player
 */
export const insert = (player: Player) => {
  return new Promise((resolve, reject) => {
    const statement = `INSERT INTO players (_id, firstName, lastName, username, avatar, country, steamid, team, extra)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    database.run(
      statement,
      [
        player._id,
        player.firstName,
        player.lastName,
        player.username,
        player.avatar,
        player.country,
        player.steamid,
        player.team || null, // Convert empty string to null for foreign key
        player.extra,
      ],
      (error: Error) => {
        if (error) {
          console.error("Error creating player:", error);
          reject(error);
        } else {
          resolve(player._id);
        }
      }
    );
  });
};

/**
 * Model for updating a player in the players table.
 * @param player - The player to be updated
 * @returns The _id of the updated player
 */
export const update = (player: Player) => {
  return new Promise((resolve, reject) => {
    const statement =
      "UPDATE players SET firstName = ?, lastName = ?, username = ?, avatar = ?, country = ?, steamid = ?, team = ?, extra = ? WHERE _id = ?";
    database.run(
      statement,
      [
        player.firstName,
        player.lastName,
        player.username,
        player.avatar,
        player.country,
        player.steamid,
        player.team || null, // Convert empty string to null for foreign key
        player.extra,
        player._id,
      ],
      (error: Error) => {
        if (error) {
          console.error("Error updating player:", error);
          reject(error);
        } else {
          resolve(player._id);
        }
      }
    );
  });
};

/**
 * Model for removing a player in the players table.
 * @param id - The id of the player to be remove
 * @returns The id of the removed player
 */
export const remove = (id: string) => {
  return new Promise((resolve, reject) => {
    const statement = "DELETE FROM players WHERE _id = ?";
    database.run(statement, [id], (error: Error) => {
      if (error) {
        console.error("Error removing player:", error);
        reject(error);
      } else {
        resolve(id);
      }
    });
  });
};
