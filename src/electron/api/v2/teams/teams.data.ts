import { database } from "../../../configs/database.js";

/* ====================== Notes: ======================*/
// Parameterbinding to stop SQL injection
// Try to return a unique identifier when inserting/updating/deleting

/**
 * Model for selecting all teams in the teams table.
 * @returns An array of teams
 */
export const selectAll = (): Promise<Team[]> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM teams";
    database.all(statement, [], (error: Error, teams: Team[]) => {
      if (error) {
        console.error("Error getting all teams:", error);
        reject(error);
      } else resolve(teams);
    });
  });
};

/**
 * Model for selecting a team in the teams table by their _id
 * @param id - The _id of the team to select
 * @returns A single team
 */
export const selectByID = (id: string): Promise<Team> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT * FROM teams WHERE _id = ?";
    database.get(statement, [id], (error: Error, row: any) => {
      if (error) {
        console.error(`Error finding team with id: ${id}`, error);
        reject(error);
      } else if (!row) {
        const notFoundError = new Error(`No team found with id: ${id}`);
        reject(notFoundError);
      } else {
        resolve({
          _id: id,
          name: row.name,
          country: row.country,
          shortName: row.shortName,
          logo: row.logo,
          extra: JSON.parse(row.extra)
        });
      }
    });
  });
};

/**
 * Model for selecting a teams logoURL
 * @param id - The _id of the team whose logoURL you want to select
 * @returns string path to a specifc image save in team_logos
 */
export const selectLogoURL = (id: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const statement = "SELECT logo FROM teams WHERE _id = ?";
    database.get(statement, [id], (error: Error, logoURL: string) => {
      if (error) {
        console.error("Error getting team logoURL");
        reject(error);
      } else resolve(logoURL);
    });
  });
};

/**
 * Model for inserting team into the teams table.
 * @param team - The team to be created
 * @returns The _id of the newly created team
 */
export const insert = (team: Team) => {
  return new Promise((resolve, reject) => {
    const statement = `INSERT INTO teams (_id, name, country, shortName, logo, extra)
       VALUES (?, ?, ?, ?, ?, ?)`;
    database.run(
      statement,
      [
        team._id,
        team.name,
        team.country,
        team.shortName,
        team.logo,
        JSON.stringify(team.extra)
      ],
      (error: Error) => {
        if (error) {
          console.error("Error creating team:", error);
          reject(error);
        } else {
          resolve(team._id);
        }
      }
    );
  });
};

/**
 * Model for updating a team in the teams table.
 * @param team - The team to be updated
 * @returns The _id of the updated team
 */
export const update = (team: Team) => {
  return new Promise((resolve, reject) => {
    const statement =
      "UPDATE teams SET name = ?, country = ?, shortName = ?, logo = ?, extra = ? WHERE _id = ?";
    database.run(
      statement,
      [
        team.name,
        team.country,
        team.shortName,
        team.logo,
        team.extra,
        team._id,
      ],
      (error: Error) => {
        if (error) {
          console.error("Error updating team:", error);
          reject(error);
        } else {
          resolve(team._id);
        }
      }
    );
  });
};

/**
 * Model for removing a team in the teams table.
 * @param id - The id of the team to be remove
 * @returns The id of the removed team
 */
export const remove = (id: string) => {
  return new Promise((resolve, reject) => {
    const statement = "DELETE FROM teams WHERE _id = ?";
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
