import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import api from "./routes/api.js";
import { config } from "./config.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, "../../client/dist");

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", rateLimit({ windowMs: 60_000, limit: 300 }));

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api", api);
  app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(clientDist, "index.html")));
  }

  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Malformed JSON" });
    if (err.type === "entity.too.large") return res.status(413).json({ error: "Request too large" });
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  });

  return app;
}
