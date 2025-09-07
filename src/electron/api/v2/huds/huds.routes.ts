/* eslint-disable react-hooks/rules-of-hooks */
import { Router, static as static_ } from "express";
import path from "path";
import { getDefaultHUDPath, getHudPath } from "../../../helpers/pathResolver.js";
export const HudRoutes = Router();

/* ================== GETs ===================== */
HudRoutes.use(static_(getHudPath()));

HudRoutes.get("/", (__req, res) => {
  res.status(200).sendFile(path.join(getHudPath(), "index.html"));
});

/* ================== POSTs ===================== */

/* ================== PUTs ===================== */
