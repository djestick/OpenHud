import { Request, Response } from "express";
import * as MatchServices from "./matches.service.js";

export const getMapsHandler = (_req: Request, res: Response) => {
  const defaultMaps = [
    "de_mirage",
    "de_dust2",
    "de_inferno",
    "de_nuke",
    "de_train",
    "de_overpass",
    "de_vertigo",
    "de_ancient",
    "de_anubis",
  ];
  res.json(defaultMaps);
};

/**
 * Controller for getting all matches.
 * @returns An array of matches
 */
export const getAllMatchesHandler = async (_req: Request, res: Response) => {
  try {
    // All matches
    const allmatches = await MatchServices.getAllMatches();
    res.status(200).json(allmatches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Controller for getting one match by id.
 * @returns A single match
 */
export const getMatchByIDHandler = async (req: Request, res: Response) => {
  try {
    const match = await MatchServices.getMatchByID(req.params.id);
    res.status(200).json(match);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for creating a match.
 * @returns The id of the newly created match
 */
export const createMatchHandler = async (req: Request, res: Response) => {
  try {
    const createdmatchID = await MatchServices.createMatch(req.body);
    res.status(201).json(createdmatchID);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for updating a match.
 * @returns The id of the updated match
 */
export const updateMatchHandler = async (req: Request, res: Response) => {
  try {
    const updatedmatchID = await MatchServices.updateMatch(req.body);
    res.status(201).json(updatedmatchID);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Controller for getting the current match.
 * @returns Current match
 */
export const getCurrentMatchHandler = async (req: Request, res: Response) => {
  try {
    const match = await MatchServices.getCurrentMatch();
    match ? res.status(200).json(match) : res.status(204).json(null);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
