import { Router } from "express";

export const cameraRoutes = Router();

/* ================== GETs ===================== */
cameraRoutes.get("/", (req, res) => {
  // Return an empty array of available players to satisfy the hud
  res.send({ availablePlayers: [] });
});

/* ================== POSTs ===================== */

/* ================== PUTs ===================== */
