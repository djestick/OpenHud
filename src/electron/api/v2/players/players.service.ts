import { run_transaction } from "../helpers/utilities.js";
import * as PlayerModel from "./players.data.js";
import { v4 as uuidv4 } from "uuid";

/* ====================== Notes: ======================*/
// Use the run_transaction function for inserts/updates (future proofing and looks more uniform)

/**
 * Service for selecting all players.
 * @returns An array of players
 */
export const getAllPlayers = async (): Promise<Player[]> => {
  return await PlayerModel.selectAll();
};

/**
 * Service for selecting a player by their _id.
 * @returns A single player
 */
export const getPlayerByID = async (id: string): Promise<Player> => {
  return await PlayerModel.selectByID(id);
};

/**
 * Service for selecting a player by their steamid.
 * @returns A single player
 */
export const getPlayerBySteamID = async (steamid: string): Promise<Player> => {
  return await PlayerModel.selectBySteamID(steamid);
};

/**
 * Service for selecting multple players by their steamids.
 * @returns An array of players, or empty array if steamids is null
 */
export const getPlayersBySteamID = async (steamids: string[]) => {
  return await PlayerModel.selectMultipleBySteamID(steamids);
};

/**
 * Service for selecting players avatar/player picture path by their steamid
 * @returns A path string to the users avatar
 */
export const getPlayerAvatar = async (steamid: string): Promise<string> => {
  return await PlayerModel.selectAvatarURL(steamid);
};

/**
 * Service for creating a player
 * @returns The _id of newly created player
 */
export const createPlayer = async (player: Player): Promise<string> => {
  const newPlayer: Player = {
    ...player,
    _id: uuidv4(),
  };
  return run_transaction(async () => {
    return await PlayerModel.insert(newPlayer);
  });
};

/**
 * Service for updating a player
 * @returns The _id of newly created player
 */
export const updatePlayer = (player: Player) => {
  return run_transaction(async () => {
    return await PlayerModel.update(player);
  });
};

/**
 * Service for removing a player
 * @returns The id of the removed player
 */
export const removePlayer = (id: string) => {
  return run_transaction(async () => {
    return await PlayerModel.remove(id);
  });
};
