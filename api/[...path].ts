import express from "express";
import { createServer } from "http";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let initPromise: Promise<void> | undefined;

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase server configuration is missing");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function handleStates(req: any, res: any) {
  const supabase = getSupabaseAdmin();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("states")
      .select("*")
      .neq("is_active", false)
      .order("name");
    if (error) {
      console.error("[vercel-api:states:get]", error.message);
      return res.status(500).json({ message: "Failed to load states" });
    }
    return res.status(200).json(data || []);
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authorization = req.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authorization.slice("Bearer ".length).trim();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return res.status(401).json({ message: "Invalid authentication token" });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("supabase_id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[vercel-api:states:role]", profileError.message);
    return res.status(500).json({ message: "Could not verify account role" });
  }
  if (!profile || !["admin", "superadmin"].includes(profile.role)) {
    return res.status(403).json({ message: "Only admins and superadmins can create states" });
  }

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    return res.status(400).json({ message: "State name is required" });
  }

  const { data: state, error } = await supabase
    .from("states")
    .insert({ name })
    .select("*")
    .single();

  if (error) {
    console.error("[vercel-api:states:create]", error.message);
    return res.status(500).json({ message: "Failed to create state" });
  }
  return res.status(201).json(state);
}

async function initializeOtherRoutes() {
  if (!initPromise) {
    initPromise = (async () => {
      const { registerRoutes } = await import("../server/routes");
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
    const path = typeof req.url === "string" ? req.url.split("?")[0] : "";
    const normalizedPath = path.startsWith("/api/") ? path.slice(4) : path;
    if (normalizedPath === "/states" || normalizedPath === "/states/") {
      return await handleStates(req, res);
    }

    await initializeOtherRoutes();
    if (typeof req.url === "string" && !req.url.startsWith("/api/") && req.url !== "/api") {
      req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }
    return app(req, res);
  } catch (err: any) {
    console.error("[vercel-api] Request failed:", err?.message || err);
    return res.status(500).json({ message: "API request failed" });
  }
}
