import { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'
import { storage } from '../../server/storage'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const token = authHeader.split(" ")[1]
    const decoded: any = jwt.decode(token)

    if (!decoded?.sub) {
      return res.status(401).json({ message: "Invalid token" })
    }

    const user = await storage.getUserBySupabaseId(decoded.sub)

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    return res.json(user)
  } catch (err) {
    return res.status(500).json({ message: "Server error" })
  }
}
