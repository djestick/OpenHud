import { run_transaction } from "../helpers/utilities.js";
import * as TeamData from "./teams.data.js";
import { v4 as uuidv4 } from "uuid";

/* ====================== Notes: ======================*/
// Use the run_transaction function for inserts/updates (future proofing and looks more uniform)

/**
 * Service for selecting all teams.
 * @returns An array of teams
 */
export const getAllTeams = async (): Promise<Team[]> => {
  return await TeamData.selectAll();
};

/**
 * Service for selecting a team by their _id.
 * @returns A single team
 */
export const getTeamByID = async (id: string): Promise<Team> => {
  return await TeamData.selectByID(id);
};

/**
 * Service for selecting team logo path by its _id
 * @returns A path string to the teams logo
 */
export const getTeamLogo = async (id: string): Promise<string> => {
  return await TeamData.selectLogoURL(id);
};

/**
 * Service for creating a team
 * @returns The _id of newly created team
 */
export const createTeam = async (team: Team): Promise<string> => {
  const newTeam: Team = {
    ...team,
    _id: uuidv4(),
  };
  return run_transaction(async () => {
    return await TeamData.insert(newTeam);
  });
};

/**
 * Service for updating a team
 * @returns The _id of newly created team
 */
export const updateTeam = (team: Team) => {
  return run_transaction(async () => {
    return await TeamData.update(team);
  });
};

/**
 * Service for removing a team
 * @returns The id of the removed team
 */
export const removeTeam = (id: string) => {
  return run_transaction(async () => {
    return await TeamData.remove(id);
  });
};


