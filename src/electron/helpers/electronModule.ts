import { createRequire } from "module";

const require = createRequire(import.meta.url);

const electron = require("electron") as typeof import("electron");

export default electron;
