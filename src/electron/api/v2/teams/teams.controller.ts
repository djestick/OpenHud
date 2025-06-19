import { Request, Response } from "express";
import * as TeamsServices from "./teams.service.js";
import path from "path";
import { getUploadsPath } from "../helpers/paths.js";
import fs from "fs";

/**
 * Controller for getting all teams.
 * @returns An array of teams
 */
export const getAllTeamsHandler = async (_req: Request, res: Response) => {
  try {
    // If no steamids provided, return all teams
    const allTeams = await TeamsServices.getAllTeams();
    res.status(200).json(allTeams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Controller for getting one team by _id.
 * @returns A single team
 */
export const getTeamByIDHandler = async (req: Request, res: Response) => {
  try {
    const team = await TeamsServices.getTeamByID(req.params.id);
    res.status(200).json(team);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for getting a teams teams logo by its _id.
 * @returns Actual image file for team logo
 */
export const getTeamLogoHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  const teamID = req.params.id;
  if (!teamID) {
    return res.sendStatus(422);
  }

  try {
    const team = await TeamsServices.getTeamByID(teamID);
    if (!team || !team.logo) {
      return res.sendStatus(404);
    }

    const logoPath = path.join(getUploadsPath(), "team_logos", team.logo);
    if (!fs.existsSync(logoPath)) {
      return res.sendStatus(404);
    }

    return res.sendFile(logoPath);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Controller for creating a team.
 * @returns The _id of the newly created team
 */
export const createTeamHandler = async (req: Request, res: Response) => {
  try {
    const createdTeamID = await TeamsServices.createTeam({
      ...req.body,
      logo: req.file?.filename,
    });
    res.status(201).json(createdTeamID);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for updating a team.
 * @returns The _id of the updated team
 */
export const updateTeamHandler = async (req: Request, res: Response) => {
  try {
    const updatedTeamID = await TeamsServices.createTeam(req.body);
    res.status(201).json(updatedTeamID);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for removing a team.
 * @returns The _id of the updated team
 */
export const removeTeamHandler = async (req: Request, res: Response) => {
  try {
    const removedPlayerID = await TeamsServices.removeTeam(req.params.id);
    res.status(201).json(removedPlayerID);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
