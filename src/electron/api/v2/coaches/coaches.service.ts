import { run_transaction } from "../helpers/utilities.js";
import * as CoachModel from "./coaches.data.js";

/* ====================== Notes: ======================*/
// Use the run_transaction function for inserts/updates (future proofing and looks more uniform)

/**
 * Service for selecting all coaches.
 * @returns An array of coaches
 */
export const getAllCoaches = async (): Promise<string[]> => {
  return await CoachModel.selectAll();
};

/**
 * Service for selecting a coach by their steamid.
 * @returns A single coach
 */
export const getCoachBySteamID = async (steamid: string): Promise<string> => {
  return await CoachModel.selectBySteamID(steamid);
};

/**
 * Service for creating a coach
 * @returns The _id of newly created coach
 */
export const createCoach = async (coach: string): Promise<string> => {
  return run_transaction(async () => {
    return await CoachModel.insert(coach);
  });
};


/**
 * Service for removing a coach
 * @returns The id of the removed coach
 */
export const removeCoach = (id: string) => {
  return run_transaction(async () => {
    return await CoachModel.remove(id);
  });
};
