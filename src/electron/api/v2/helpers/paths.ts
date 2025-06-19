import path from "path";
import { fileURLToPath } from "url";
import { isDev } from "./utilities.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default HUD path
export function getDefaultHudPath(): string {
  return path.join(__dirname, "../../../assets/defaultHud");
}

// Path for uploads folder
export function getUploadsPath() {
  return path.join(__dirname, "../../../../uploads");
}
