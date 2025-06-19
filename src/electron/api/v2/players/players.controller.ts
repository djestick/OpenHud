import { Request, Response } from "express";
import * as PlayerService from "./players.service.js";
import { getUploadsPath } from "../helpers/paths.js";
import path from "path";
import fs from "fs";

/**
 * Controller for getting multiple/all players depending on steamid query.
 * @returns An array of players
 */
export const getAllPlayersHandler = async (req: Request, res: Response) => {
  try {
    // If steamids provided, map to comma separate string array, return players by string of steamids
    const { steamids } = req.query;
    if (steamids) {
      const ids = Array.isArray(steamids)
        ? steamids.map((id) => String(id))
        : (steamids as string).split(";");
      const multiplePlayers = await PlayerService.getPlayersBySteamID(ids);
      res.status(200).json(multiplePlayers);
    } else {
      // If no steamids provided, return all players
      const allPlayers = await PlayerService.getAllPlayers();
      res.status(200).json(allPlayers);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Controller for getting one player by _id.
 * @returns A single player
 */
export const getPlayerByIDHandler = async (req: Request, res: Response) => {
  try {
    const player = await PlayerService.getPlayerByID(req.params.id);
    res.status(200).json(player);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for getting one player by steamid.
 * @returns A single player
 */
export const getPlayerBySteamIDHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const player = await PlayerService.getPlayerBySteamID(req.params.steamid);
    res.status(200).json(player);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for getting mutiple players by steamids.
 * @returns An array of players
 */
export const getPlayersBySteamIDHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const players = await PlayerService.getPlayersBySteamID(req.body);
    res.status(200).json(players);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for getting a player avatar by their steamid.
 * Makes another API call to getPlayerAvatarFileHandler route
 * (Not my prefered way of doing this but is required for the lexohud)
 * @returns Player avatar/player picture
 */
export const getPlayerAvatarHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  const steamid = req.params.steamid;
  if (!steamid) {
    return res.sendStatus(422);
  }

  const response = {
    custom: "",
    steam: "",
  };

  try {
    const player = await PlayerService.getPlayerBySteamID(steamid);
    if (player && player.avatar && player._id) {
      response.custom = `http://localhost:1349/api/players/avatar/${player._id}`;
    }

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: "Failed to load avatar info" });
  }
};

/**
 * Controller for getting a players actual image file based on their player _id
 * @returns Actual image file
 */
export const getPlayerAvatarFileHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  const playerId = req.params.id;
  if (!playerId) {
    return res.sendStatus(422);
  }

  try {
    const player = await PlayerService.getPlayerByID(playerId);
    if (!player || !player.avatar) {
      return res.sendStatus(404);
    }

    const avatarPath = path.join(
      getUploadsPath(),
      "player_pictures",
      player.avatar
    );
    if (!fs.existsSync(avatarPath)) {
      return res.sendStatus(404);
    }

    return res.sendFile(avatarPath);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Controller for creating a player.
 * @returns The _id of the newly created player
 */
export const createPlayerHandler = async (req: Request, res: Response) => {
  try {
    const creadtedPlayerID = await PlayerService.createPlayer({
      ...req.body,
      avatar: req.file?.filename,
    });
    res.status(201).json(creadtedPlayerID);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for updating a player.
 * @returns The _id of the updated player
 */
export const updatePlayerHandler = async (req: Request, res: Response) => {
  try {
    const updatedPlayerID = await PlayerService.createPlayer(req.body);
    res.status(201).json(updatedPlayerID);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for removing a player.
 * @returns The _id of the updated player
 */
export const removePlayerHandler = async (req: Request, res: Response) => {
  try {
    const removedPlayerID = await PlayerService.removePlayer(req.params.id);
    res.status(201).json(removedPlayerID);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
