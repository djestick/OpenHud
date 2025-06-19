import { Router, static as static_ } from "express";
import path from "path";
import { getDefaultHudPath } from "../helpers/paths.js";
export const HudRoutes = Router();

/* ================== GETs ===================== */
HudRoutes.use(static_(getDefaultHudPath()));

HudRoutes.get("/", (__req, res) => {
  res.status(200).sendFile(path.join(getDefaultHudPath(), "index.html"));
});

/* ================== POSTs ===================== */

/* ================== PUTs ===================== */
