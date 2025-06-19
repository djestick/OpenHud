import { Request, Response } from "express";
import { CSGOGSI, CSGORaw } from "csgogsi";
import { io } from "../sockets/sockets.js";

export const GSI = new CSGOGSI();
GSI.regulationMR = 12;
GSI.overtimeMR = 3;

export const readGameData = async (req: Request, res: Response) => {
  const data: CSGORaw = req.body;
  fixGSIData(data);
  GSI.digest(data);
  io.emit("update", data);
  res.sendStatus(200);
};

const fixGSIData = (data: CSGORaw) => {
  if (data.player) {
    data.player.observer_slot =
      data.player.observer_slot !== undefined && data.player.observer_slot === 9
        ? 0
        : (data.player.observer_slot || 0) + 1;
  }

  if (data.allplayers) {
    Object.entries(data.allplayers).forEach(([id, player]) => {
      if (player) {
        player.observer_slot =
          player.observer_slot === 9 ? 0 : (player.observer_slot || 0) + 1;
      } else {
        if (data.allplayers) {
          delete data.allplayers[id];
        }
      }
    });
  }
};
