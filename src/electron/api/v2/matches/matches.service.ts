import { run_transaction } from "../helpers/utilities.js";
import * as MatchData from "./matches.data.js";
import { v4 as uuidv4 } from "uuid";

/* ====================== Notes: ======================*/
// Use the run_transaction function for inserts/updates (future proofing and looks more uniform)

/**
 * Service for selecting all matches.
 * @returns An array of matches
 */
export const getAllMatches = async (): Promise<Match[]> => {
  return await MatchData.selectAll();
};

/**
 * Service for selecting a match by their id.
 * @returns A single match
 */
export const getMatchByID = async (id: string): Promise<Match> => {
  return await MatchData.selectByID(id);
};

/**
 * Service for creating a match
 * @returns The id of newly created match
 */
export const createMatch = async (match: Match): Promise<string> => {
  const newmatch: Match = {
    ...match,
    id: uuidv4(),
  };
  return run_transaction(async () => {
    return await MatchData.insert(newmatch);
  });
};

/**
 * Service for updating a match
 * @returns The id of newly created match
 */
export const updateMatch = (match: Match) => {
  return run_transaction(async () => {
    return await MatchData.update(match);
  });
};

/**
 * Service getting the current match. 
 * @returns A single match or null
 */
export const getCurrentMatch = async (): Promise<Match | null> => {
  return await MatchData.selectCurrent();
};

/**
 * Service setting the current match.
 * @returns Id of the updated match
 */
export const setCurrentMatch = async (id: string, current: boolean): Promise<string> => {
  return await MatchData.setCurrent(id, current);
};

/**
 * Service for removing a match
 * @returns The id of the removed match
 */
export const removeMatch = (id: string) => {
  return run_transaction(async () => {
    return await MatchData.remove(id);
  });
};
