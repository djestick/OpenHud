import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  getCoachPicturesPath,
  getPlayerPicturesPath,
  getTeamLogosPath,
} from "../helpers/index.js";


// Player avatar storage
export const playerPictureStorage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, getPlayerPicturesPath());
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Coach avatar storage
export const coachPictureStorage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, getCoachPicturesPath());
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Team logo storage
export const teamLogoStorage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, getTeamLogosPath());
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});
