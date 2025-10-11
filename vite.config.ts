import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  /* Fixes index.html loading relative path */
  base: "./",
  /* Where we output the react build */
  build: {
    outDir: "dist-react",
  },
  server: {
    port: 5123,
    /* Will only work if the above port is open */
    strictPort: true,
  },
});
