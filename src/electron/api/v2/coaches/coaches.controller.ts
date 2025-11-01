import { Request, Response } from "express";
import * as CoachService from "./coaches.service.js";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { getCoachPicturesPath, getPlayerPicturesPath } from "../../../helpers/pathResolver.js";
import * as PlayerService from "../players/players.service.js";
import type { CoachRecord } from "./coaches.data.js";

const normalize = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    value = value[0];
  }
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const buildCoachPayload = (req: Request, avatarFilename?: string | null): CoachRecord => {
  const steamid = normalize(req.body.steamid) ?? "";
  const username = normalize(req.body.username);
  const firstName = normalize(req.body.firstName);
  const lastName = normalize(req.body.lastName);
  const manualName = normalize(req.body.name);
  const country = normalize(req.body.country);
  const team = normalize(req.body.team);

  const combinedName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const displayName = combinedName || manualName || username || steamid;

  return {
    steamid,
    username,
    firstName,
    lastName,
    name: displayName || undefined,
    avatar: avatarFilename ?? normalize(req.body.avatar),
    country,
    team,
  };
};

const removeCoachAvatarFile = (filename?: string | null) => {
  if (!filename) return;
  const avatarPath = path.join(getCoachPicturesPath(), filename);
  if (fs.existsSync(avatarPath)) {
    fs.unlinkSync(avatarPath);
  }
};

/**
 * Controller for getting multiple/all coaches depending on steamid query.
 * @returns An array of coaches
 */
export const getAllCoachesHandler = async (req: Request, res: Response) => {
  try {
      const allCoaches = await CoachService.getAllCoaches();
      res.status(200).json(allCoaches);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};

/**
 * Controller for getting one coach by steamid.
 * @returns A single coach
 */
export const getCoachBySteamIDHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const coach = await CoachService.getCoachBySteamID(req.params.steamid);
    if (!coach) {
      res.sendStatus(404);
      return;
    }
    res.status(200).json(coach);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};

/**
 * Controller for getting multiple/all coaches depending on steamid query.
 * @returns An array of coaches
 */
export const getAllSteamIDsHandler = async (req: Request, res: Response) => {
  try {
      const allSteamIDs = await CoachService.getAllSteamIds();
      res.status(200).json(allSteamIDs);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};

/**
 * Controller for creating a coach.
 * @returns The steamid of the newly created coach
 */
export const createCoachHandler = async (req: Request, res: Response) => {
  try {
    const payload = buildCoachPayload(req, req.file?.filename ?? null);
    if (!payload.steamid) {
      res.status(422).json({ error: "steamid is required" });
      return;
    }
    const createdCoachID = await CoachService.createCoach(payload);
    res.status(201).json(createdCoachID);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "steamid already exists") {
      res.status(409).json({ error: err.message });
    } else if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};


/**
 * Controller for removing a coach.
 * @returns The steamid of the removed coach
 */
export const removeCoachHandler = async (req: Request, res: Response) => {
  try {
    const coach = await CoachService.getCoachBySteamID(req.params.steamid);
    if (!coach) {
      res.sendStatus(404);
      return;
    }
    removeCoachAvatarFile(coach.avatar);
    const removedCoachID = await CoachService.removeCoach(req.params.steamid);
    res.status(201).json(removedCoachID);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};

/**
 * Controller for updating a coach.
 * @returns The steamid of the updated coach
 */
export const updateCoachHandler = async (req: Request, res: Response) => {
  try {
    const currentSteamid = req.params.steamid;
    const existingCoach = await CoachService.getCoachBySteamID(currentSteamid);
    if (!existingCoach) {
      res.sendStatus(404);
      return;
    }

    let avatarFilename = existingCoach.avatar ?? null;
    if (req.file?.filename) {
      removeCoachAvatarFile(existingCoach.avatar);
      avatarFilename = req.file.filename;
    }

    const payload = buildCoachPayload(req, avatarFilename);
    if (!payload.steamid) {
      res.status(422).json({ error: "steamid is required" });
      return;
    }

    const updatedCoachID = await CoachService.updateCoach(
      currentSteamid,
      payload,
    );
    res.status(200).json(updatedCoachID);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "steamid already exists") {
      res.status(409).json({ error: err.message });
    } else if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};

/**
 * Controller for returning the coach avatar file by steamid.
 */
export const getCoachAvatarFileHandler = async (
  req: Request,
  res: Response,
) => {
  const steamid = req.params.steamid;
  if (!steamid) {
    res.sendStatus(422);
    return;
  }

  try {
    const coach = await CoachService.getCoachBySteamID(steamid);
    if (!coach || !coach.avatar) {
      res.sendStatus(404);
      return;
    }

    const avatarPath = path.join(getCoachPicturesPath(), coach.avatar);
    if (!fs.existsSync(avatarPath)) {
      res.sendStatus(404);
      return;
    }

    res.sendFile(avatarPath);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};

/**
 * Controller for converting a coach to a player.
 * @returns The _id of the newly created player
 */
export const convertToPlayerHandler = async (req: Request, res: Response) => {
  console.log("convertToPlayerHandler called with steamid:", req.params.steamid);
  try {
    const coach = await CoachService.getCoachBySteamID(req.params.steamid);
    if (!coach) {
      res.sendStatus(404);
      return;
    }

    const player: Player = {
      _id: uuidv4(),
      steamid: coach.steamid,
      username: coach.username || '',
      firstName: coach.firstName || '',
      lastName: coach.lastName || '',
      avatar: coach.avatar || '',
      country: coach.country || '',
      team: coach.team || '',
      extra: {},
    };

    const newPlayer = await PlayerService.createPlayer(player);

    if (coach.avatar) {
      const oldAvatarPath = path.join(
        getCoachPicturesPath(),
        coach.avatar
      );
      const newAvatarPath = path.join(
        getPlayerPicturesPath(),
        coach.avatar
      );
      if (fs.existsSync(oldAvatarPath)) {
        fs.renameSync(oldAvatarPath, newAvatarPath);
      }
    }

    await CoachService.removeCoach(coach.steamid);

    res.status(201).json(newPlayer);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};

