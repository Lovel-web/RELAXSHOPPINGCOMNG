import express from "express";
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

export default async function handler(req: any, res: any) {
  try {
    await initialize();
    // Preserve Express route prefixes whether Vercel passes the original URL or a stripped catch-all path.
    if (typeof req.url === "string" && !req.url.startsWith("/api/") && req.url !== "/api") {
      req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }
    return app(req, res);
  } catch (err) {
    console.error("[vercel-api] Initialization failed:", err);
    return res.status(500).json({ message: "API initialization failed" });
  }
}
