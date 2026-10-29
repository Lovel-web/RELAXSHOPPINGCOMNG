import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let initPromise: Promise<void> | undefined;

async function initialize() {
  if (!initPromise) {
    initPromise = (async () => {
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);
      app.use((err: any, _req: any, res: any, _next: any) => {
        console.error("[vercel-api] Unhandled API error:", err);
        if (!res.headersSent) {
          res.status(err?.status || err?.statusCode || 500).json({
            message: err?.message || "Internal Server Error",
          });
        }
      });
    })();
  }
  return initPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initialize();
    // Vercel may pass the catch-all function path with or without the /api prefix.
    if (req.url?.startsWith("/api/")) {
      req.url = req.url.slice(4);
    }
    return app(req as any, res as any);
  } catch (err) {
    console.error("[vercel-api] Initialization failed:", err);
    return res.status(500).json({ message: "API initialization failed" });
  }
}
