import { Router } from "express";
import * as CoachesController from "./coaches.controller.js";
import { coachPictureStorage } from "../../../configs/multer.js";

export const coachRoutes = Router();

/* ================== GETs ===================== */
coachRoutes.get("/", CoachesController.getAllCoachesHandler);
coachRoutes.get("/steamids", CoachesController.getAllSteamIDsHandler);
coachRoutes.get("/avatar/:steamid", CoachesController.getCoachAvatarFileHandler);
coachRoutes.get("/:steamid", CoachesController.getCoachBySteamIDHandler);

/* ================== POSTs ===================== */
coachRoutes.post(
  "/",
  coachPictureStorage.single("avatar"),
  CoachesController.createCoachHandler,
);

/* ================== PUTs ===================== */
coachRoutes.put(
  "/:steamid",
  coachPictureStorage.single("avatar"),
  CoachesController.updateCoachHandler,
);

/* ================== DELETESs ===================== */
coachRoutes.delete("/:steamid", CoachesController.removeCoachHandler);



