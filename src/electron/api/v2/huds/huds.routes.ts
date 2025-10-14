/* eslint-disable react-hooks/rules-of-hooks */
import { Router, static as static_ } from "express";
import path from "path";
import {
  getHudPath,
  getSelectedHud,
  listAvailableHuds,
  selectHud,
} from "../../../helpers/hudManager.js";

export const HudRoutes = Router();

/* ================== GETs ===================== */
HudRoutes.get("/available", (_req, res) => {
  res.status(200).json(listAvailableHuds());
});

HudRoutes.get("/selected", (_req, res) => {
  res.status(200).json(getSelectedHud());
});

HudRoutes.get("/", (_req, res) => {
  res.status(200).sendFile(path.join(getHudPath(), "index.html"));
});

/* ================== POSTs ===================== */
HudRoutes.post("/select", (req, res) => {
  const { id } = req.body ?? {};
  if (typeof id !== "string" || id.trim().length === 0) {
    res.status(400).json({ message: "A valid HUD id is required." });
    return;
  }

  try {
    const selection = selectHud(id.trim());
    res.status(200).json(selection);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to select HUD.";
    res.status(400).json({ message });
  }
});

/* ================== STATIC ===================== */
HudRoutes.use((req, res, next) => {
  const middleware = static_(getHudPath());
  return middleware(req, res, next);
});
