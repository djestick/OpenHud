import { Router } from "express";
import * as MatchesController from "./matches.controller.js";

export const matchesRoutes = Router();

/* ================== GETs ===================== */
matchesRoutes.get("/", MatchesController.getAllMatchesHandler);
matchesRoutes.get("/current", MatchesController.getCurrentMatchHandler);
matchesRoutes.get("/radar/maps", MatchesController.getMapsHandler);
matchesRoutes.get("/:id", MatchesController.getMatchByIDHandler);

/* ================== POSTs ===================== */
matchesRoutes.post("/", MatchesController.createMatchHandler);

/* ================== PUTs ===================== */
matchesRoutes.put("/:id", MatchesController.updateMatchHandler);
