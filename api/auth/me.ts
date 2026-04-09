import { storage } from "../../server/storage";

export default async function handler(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];

    // Decode token
    const decoded: any = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    if (!decoded?.sub) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Get user from DB
    const user = await storage.getUserBySupabaseId(decoded.sub);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
