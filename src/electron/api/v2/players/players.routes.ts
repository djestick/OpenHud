import { Router } from "express";
import * as PlayersController from "./players.controller.js";
import { playerPictureStorage } from "../../../configs/multer.js";

export const playersRoutes = Router();

/* ================== GETs ===================== */
playersRoutes.get("/", PlayersController.getAllPlayersHandler);

// /:steamid overwrites :_id
playersRoutes.get("/:id", PlayersController.getPlayerByIDHandler);

playersRoutes.get("/:steamid", PlayersController.getPlayerBySteamIDHandler);
playersRoutes.get(
  "/avatar/steamid/:steamid",
  PlayersController.getPlayerAvatarHandler,
);
playersRoutes.get("/avatar/:id", PlayersController.getPlayerAvatarFileHandler);

/* ================== POSTs ===================== */
playersRoutes.post(
  "/",
  playerPictureStorage.single("avatar"),
  PlayersController.createPlayerHandler,
);

/* ================== PUTs ===================== */
playersRoutes.put(
  "/:id",
  playerPictureStorage.single("avatar"),
  PlayersController.updatePlayerHandler,
);

/* ================== DELETESs ===================== */
playersRoutes.delete("/:id", PlayersController.removePlayerHandler);
