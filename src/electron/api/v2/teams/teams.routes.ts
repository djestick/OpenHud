import { Router } from "express";
import * as TeamsController from "./teams.controller.js";
import { teamLogoStorage } from "../../../configs/multer.js";

export const teamsRoutes = Router();

/* ================== GETs ===================== */
teamsRoutes.get("/", TeamsController.getAllTeamsHandler);
teamsRoutes.get("/logo/:id", TeamsController.getTeamLogoHandler);
teamsRoutes.get("/:id", TeamsController.getTeamByIDHandler);

/* ================== POSTs ===================== */
teamsRoutes.post(
  "/",
  teamLogoStorage.single("logo"),
  TeamsController.createTeamHandler
);

/* ================== PUTs ===================== */
teamsRoutes.put(
  "/:id",
  teamLogoStorage.single("logo"),
  TeamsController.updateTeamHandler
);


/* ================== DELETESs ===================== */
teamsRoutes.delete("/:id", TeamsController.removeTeamHandler);
