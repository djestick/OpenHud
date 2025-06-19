import * as express from "express";

export const DevRouter = express.Router();

/* Route to redirect back the local vite server for hud development */
DevRouter.get("/", (_req, res) => {
  res.redirect(301, "http://localhost:3500/dev/");
});

/* Look into proxies in the future */

// import { createProxyMiddleware } from "http-proxy-middleware";
// const proxyMiddleware = createProxyMiddleware<Request, Response>({
//   target: "http://localhost:3500",
//   ws: true,
//   changeOrigin: true,
// });

// DevRouter.use("/", proxyMiddleware);
