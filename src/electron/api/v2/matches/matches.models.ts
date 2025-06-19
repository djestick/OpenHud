import { database } from "../../../configs/database.js";

/* ====================== Notes: ======================*/
// Parameterbinding to stop SQL injection
// Try to return a unique identifier when inserting/updating/deleting

/**
 * Model for selecting all matches in the matches table.
 * @returns An array of matches
 */
export const selectAll = (): Promise<Match[]> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM matches";
    database.all(statement, [], (error: Error, matches: Match[]) => {
      if (error) {
        console.error("Error getting all matches:", error);
        reject(error);
      } else resolve(matches);
    });
  });
};

/**
 * Model for selecting a match in the matches table by their id
 * @param id - The id of the match to select
 * @returns A single match
 */
export const selectByID = (id: string): Promise<Match> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM matches WHERE id = ?";
    database.get(statement, [id], (error: Error, row: any) => {
      if (error) {
        console.error(`Error finding match with id: ${id}`, error);
        reject(error);
      } else if (!row) {
        // No match found
        reject(new Error(`No match found with id: ${id}`));
      } else {
        const selectedMatch: Match = {
          id: row.id,
          current: row.current,
          //   Need to combine columns into a single objet for both left and right
          left: { id: row.left_id, wins: row.left_wins },
          right: { id: row.right_id, wins: row.right_wins },
          matchType: row.matchType,
          vetos: JSON.parse(row.vetos),
        };
        resolve(selectedMatch);
      }
    });
  });
};

/**
 * Model for inserting match into the matches table.
 * @param match - The match to be created
 * @returns The id of the newly created match
 */
export const insert = (match: Match) => {
  return new Promise((resolve, reject) => {
    const statement = `INSERT INTO matches (id, current, left_id, left_wins, right_id, right_wins, matchType, vetos)
  VALUES (?, ?, ?, ?, ?, ?, ? , ?)`;
    database.run(
      statement,
      [
        match.id,
        match.current,
        match.left.id,
        match.left.wins,
        match.right.id,
        match.right.wins,
        match.matchType,
        JSON.stringify(match.vetos),
      ],
      (error: Error) => {
        if (error) {
          console.error("Error creating match:", error);
          reject(error);
        } else {
          resolve(match.id);
        }
      }
    );
  });
};

/**
 * Model for updating a match in the matches table.
 * @param match - The match to be updated
 * @returns The id of the updated match
 */
export const update = (match: Match) => {
  return new Promise((resolve, reject) => {
    const statement =
      "UPDATE matches SET current = ?, left_id = ?, left_wins = ?, right_id = ?, right_wins = ?, matchType = ?, vetos = ? WHERE id = ?";
    database.run(
      statement,
      [
        match.current,
        match.left.id,
        match.left.wins,
        match.right.id,
        match.right.wins,
        match.matchType,
        JSON.stringify(match.vetos),
        match.id,
      ],
      (error: Error) => {
        if (error) {
          console.error("Error updating match:", error);
          reject(error);
        } else {
          resolve(match.id);
        }
      }
    );
  });
};

/**
 * Model for selecting the current match in the matches table.
 * @returns Current Match if there is one, if not return null
 */
export const selectCurrent = (): Promise<Match | null> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM matches WHERE current = 1";
    database.get(statement, [], (error: Error, currentMatchRow: any) => {
      if (error) {
        console.error("Error selecting current match:", error);
        reject(error);
      } else if (!currentMatchRow) {
        resolve(null);
      } else {
        const currentMatch = {
          id: currentMatchRow.id,
          current: currentMatchRow.current,
          left: {
            id: currentMatchRow.left_id,
            wins: currentMatchRow.left_wins,
          },
          right: {
            id: currentMatchRow.right_id,
            wins: currentMatchRow.right_wins,
          },
          matchType: currentMatchRow.matchType,
          vetos: JSON.parse(currentMatchRow.vetos),
        };
        resolve(currentMatch);
      }
    });
  });
};

/**
 * Model for selecting the id of the current match in the matches table.
 * @returns id of current match or null
 */
const selectCurrentID = (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT id FROM matches WHERE current = 1";
    database.get(statement, [], (err, currentID: string) => {
      if (err) return reject(err);
      resolve(currentID || null);
    });
  });
};

/**
 * Model for fully updating the current match in the matches table.
 * @returns id of updated current match
 */
export const updateCurrent = (match: Match) => {
  const sql = `UPDATE matches SET current = ?, left_id = ?, left_wins = ?, right_id = ?, right_wins = ?, matchType = ?, vetos = ? WHERE current = 1`;
  return new Promise((resolve, reject) => {
    const updatedMatch = {
      ...match,
      vetos: JSON.stringify(match.vetos),
    };

    database.run(
      sql,
      [
        updatedMatch.current,
        updatedMatch.left.id,
        updatedMatch.left.wins,
        updatedMatch.right.id,
        updatedMatch.right.wins,
        updatedMatch.matchType,
        updatedMatch.vetos,
      ],
      function (err) {
        if (err) {
          console.error("Error updating current match:", err.message);
          reject(err);
        } else {
          resolve(`Match updated with id: ${updatedMatch.id}`);
        }
      }
    );
  });
};

/**
 * Model for updating the current match by its id () the matches table.
 * @returns id of updated current match
 */
const updateCurrentByID = (id: string, current: boolean): Promise<string> => {
  return new Promise((resolve, reject) => {
    database.run(
      "UPDATE matches SET current = ? WHERE id = ?",
      [current ? 1 : 0, id],
      (err) => {
        if (err) return reject(err);
        resolve(id);
      }
    );
  });
};

/**
 * Model for setting the current match in the matches table.
 * @returns id of newly set current match
 */
export const setCurrent = async (id: string, current: boolean) => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      database.serialize(async () => {
        const currentMatch = await selectCurrentID();
        if (current && currentMatch) {
          return reject("There is already a current match");
        }

        await updateCurrentByID(id, current);
        resolve(id);
      });
    } catch (err) {
      reject(err);
    }
  });
};
