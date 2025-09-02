import { Router } from "express";
import * as CoachesController from "./coaches.controller.js";

export const coachRoutes = Router();

/* ================== GETs ===================== */
coachRoutes.get("/", CoachesController.getAllCoachesHandler);
coachRoutes.get("/steamids", CoachesController.getAllSteamIDsHandler);

/* ================== POSTs ===================== */
coachRoutes.post("/", CoachesController.createCoachHandler);

/* ================== PUTs ===================== */
coachRoutes.put("/:steamid", CoachesController.updateCoachHandler);

/* ================== DELETESs ===================== */
coachRoutes.delete("/:steamid", CoachesController.removeCoachHandler);



