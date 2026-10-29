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
  if (!url || !serviceKey) throw new Error("Supabase server configuration is missing");
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function authorizeAdmin(req: any, res: any, supabase: any) {
  const authorization = req.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return false;
  }
  const { data: authData, error: authError } = await supabase.auth.getUser(authorization.slice(7).trim());
  if (authError || !authData.user) {
    res.status(401).json({ message: "Invalid authentication token" });
    return false;
  }
  const { data: profile, error } = await supabase.from("users").select("role")
    .eq("supabase_id", authData.user.id).maybeSingle();
  if (error) {
    console.error("[vercel-api:location:role]", error.message);
    res.status(500).json({ message: "Could not verify account role" });
    return false;
  }
  if (!profile || !["admin", "superadmin"].includes(profile.role)) {
    res.status(403).json({ message: "Only admins and superadmins can manage locations" });
    return false;
  }
  return true;
}

async function handleLocationRoutes(req: any, res: any, path: string) {
  const supabase = getSupabaseAdmin();

  if (path === "/states" || path === "/states/") {
    if (req.method === "GET") {
      const { data, error } = await supabase.from("states").select("*").neq("is_active", false).order("name");
      if (error) {
        console.error("[vercel-api:states:get]", error.message);
        return res.status(500).json({ message: "Failed to load states" });
      }
      return res.status(200).json(data || []);
    }
    if (req.method === "POST") {
      if (!(await authorizeAdmin(req, res, supabase))) return;
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      if (!name) return res.status(400).json({ message: "State name is required" });
      const { data, error } = await supabase.from("states").insert({ name }).select("*").single();
      if (error) {
        console.error("[vercel-api:states:create]", error.message);
        return res.status(500).json({ message: "Failed to create state" });
      }
      return res.status(201).json(data);
    }
  }

  if (path === "/admin/states" && req.method === "GET") {
    if (!(await authorizeAdmin(req, res, supabase))) return;
    const { data, error } = await supabase.from("states").select("*").order("name");
    if (error) {
      console.error("[vercel-api:admin:states:get]", error.message);
      return res.status(500).json({ message: "Failed to load states" });
    }
    return res.status(200).json(data || []);
  }

  const adminStateLgas = path.match(/^\/admin\/states\/([^/]+)\/lgas\/?$/);
  const publicStateLgas = path.match(/^\/states\/([^/]+)\/lgas\/?$/);
  if ((adminStateLgas || publicStateLgas) && req.method === "GET") {
    if (adminStateLgas && !(await authorizeAdmin(req, res, supabase))) return;
    const stateId = (adminStateLgas || publicStateLgas)[1];
    let query = supabase.from("lgas").select("*").eq("state_id", stateId).order("name");
    if (!adminStateLgas) query = query.neq("is_active", false);
    const { data, error } = await query;
    if (error) {
      console.error("[vercel-api:lgas:get]", error.message);
      return res.status(500).json({ message: "Failed to load LGAs" });
    }
    return res.status(200).json(data || []);
  }

  if (path === "/lgas" && req.method === "POST") {
    if (!(await authorizeAdmin(req, res, supabase))) return;
    const stateId = typeof req.body?.stateId === "string" ? req.body.stateId.trim() : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const whatsappLink = typeof req.body?.whatsappLink === "string" ? req.body.whatsappLink.trim() : null;
    if (!stateId || !name) return res.status(400).json({ message: "stateId and name are required" });
    const { data, error } = await supabase.from("lgas")
      .insert({ state_id: stateId, name, whatsapp_link: whatsappLink || null })
      .select("*").single();
    if (error) {
      console.error("[vercel-api:lgas:create]", error.message);
      return res.status(500).json({ message: "Failed to create LGA" });
    }
    return res.status(201).json(data);
  }

  const adminLgaEstates = path.match(/^\/admin\/lgas\/([^/]+)\/estates\/?$/);
  const publicLgaEstates = path.match(/^\/lgas\/([^/]+)\/estates\/?$/);
  if ((adminLgaEstates || publicLgaEstates) && req.method === "GET") {
    if (adminLgaEstates && !(await authorizeAdmin(req, res, supabase))) return;
    const lgaId = (adminLgaEstates || publicLgaEstates)[1];
    let query = supabase.from("estates").select("*").eq("lga_id", lgaId).order("name");
    if (!adminLgaEstates) query = query.neq("is_active", false);
    const { data, error } = await query;
    if (error) {
      console.error("[vercel-api:estates:get]", error.message);
      return res.status(500).json({ message: "Failed to load estates" });
    }
    return res.status(200).json(data || []);
  }

  if (path === "/estates" && req.method === "POST") {
    if (!(await authorizeAdmin(req, res, supabase))) return;
    const lgaId = typeof req.body?.lgaId === "string" ? req.body.lgaId.trim() : "";
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const abbreviation = typeof req.body?.abbreviation === "string" ? req.body.abbreviation.trim() : "";
    if (!lgaId || !name || !abbreviation) {
      return res.status(400).json({ message: "lgaId, name, and abbreviation are required" });
    }
    const { data, error } = await supabase.from("estates")
      .insert({ lga_id: lgaId, name, abbreviation }).select("*").single();
    if (error) {
      console.error("[vercel-api:estates:create]", error.message);
      return res.status(500).json({ message: "Failed to create estate" });
    }
    return res.status(201).json(data);
  }

  const singleLga = path.match(/^\/lgas\/([^/]+)\/?$/);
  if (singleLga && req.method === "GET") {
    const { data: lga, error } = await supabase.from("lgas").select("*")
      .eq("id", singleLga[1]).maybeSingle();
    if (error) {
      console.error("[vercel-api:lga:get]", error.message);
      return res.status(500).json({ message: "Failed to load LGA" });
    }
    if (!lga) return res.status(404).json({ message: "LGA not found" });
    const { data: estates, error: estatesError } = await supabase.from("estates").select("*")
      .eq("lga_id", singleLga[1]).neq("is_active", false).order("name");
    if (estatesError) return res.status(500).json({ message: "Failed to load estates" });
    return res.status(200).json({ ...lga, estates: estates || [] });
  }

  return null;
}

async function initializeOtherRoutes() {
  if (!initPromise) {
    initPromise = (async () => {
      const { registerRoutes } = await import("../server/routes");
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);
      app.use((err: any, _req: any, res: any, _next: any) => {
        console.error("[vercel-api] Unhandled API error:", err);
        if (!res.headersSent) res.status(err?.status || err?.statusCode || 500).json({
          message: err?.message || "Internal Server Error",
        });
      });
    })();
  }
  return initPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const requestPath = typeof req.url === "string" ? req.url.split("?")[0] : "";
    const path = requestPath.startsWith("/api/") ? requestPath.slice(4) : requestPath;
    const locationResponse = await handleLocationRoutes(req, res, path);
    if (locationResponse !== null) return locationResponse;

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
