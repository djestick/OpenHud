import { Router } from "express";
import * as CoachesController from "./coaches.controller.js";

export const coachRoutes = Router();

/* ================== GETs ===================== */
coachRoutes.get("/", CoachesController.getAllCoachesHandler);

/* ================== POSTs ===================== */
coachRoutes.post("/", CoachesController.createCoachHandler);

/* ================== PUTs ===================== */

/* ================== DELETESs ===================== */
coachRoutes.delete("/:steamid", CoachesController.removeCoachHandler);



