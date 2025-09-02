import { Request, Response } from "express";
import * as CoachService from "./coaches.service.js";

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
 * Controller for getting one coach by steamid.
 * @returns A single coach
 */
export const getCoachBySteamIDHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const coach = await CoachService.getCoachBySteamID(req.params.steamid);
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
 * Controller for creating a coach.
 * @returns The steamid of the newly created coach
 */
export const createCoachHandler = async (req: Request, res: Response) => {
  try {
    console.log("Creating coach:", req.body);
    const createdCoachID = await CoachService.createCoach(
      req.body.steamid,
      req.body.name || "",
      req.body.team || ""
    );
    res.status(201).json(createdCoachID);
  } catch (err: unknown) {
    if (err instanceof Error) {
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
    const updatedCoachID = await CoachService.updateCoach(
      req.params.steamid,
      req.body.name,
      req.body.team
    );
    res.status(200).json(updatedCoachID);
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
};
