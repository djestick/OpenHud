import { Router } from "express";
import { playersRoutes } from "./players/players.routes.js";
import { matchesRoutes } from "./matches/matches.routes.js";
import { teamsRoutes } from "./teams/teams.routes.js";
import { getMapsHandler } from "./matches/matches.controller.js";
import { tournmentRoutes } from "./tournaments/tournaments.routes.js";
import { HudRoutes } from "./huds/huds.routes.js";
import { readGameData } from "./gsi/gsi.js";
import { cameraRoutes } from "./cameras/cameras.routes.js";
import { coachRoutes } from "./coaches/coaches.routes.js";

export const APIRouter = Router();

/* eslint-disable react-hooks/rules-of-hooks */
APIRouter.use("/players", playersRoutes);
APIRouter.use("/teams", teamsRoutes);
APIRouter.use("/match", matchesRoutes);
APIRouter.use("/coach", coachRoutes);
APIRouter.use("/tournament", tournmentRoutes);
APIRouter.use("/camera", cameraRoutes);
APIRouter.get("/radar/maps", getMapsHandler);
APIRouter.use("/hud", HudRoutes);
APIRouter.post("/gsi", readGameData);
