import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

export default async function handler(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token" })
    }

    const token = authHeader.split(" ")[1]

    // Get user from Supabase
    const { data: userData, error: userError } = await supabase.auth.getUser(token)

    console.log("AUTH USER ID:", userData?.user?.id);
    console.log("AUTH EMAIL:", userData?.user?.email);

    if (userError || !userData.user) {
      return res.status(401).json({ message: "Invalid user" })
    }

    // Fetch profile from your DB
    const { data: profile, error: profileError } = await supabase
      .from('users') // or profiles if that's your table
      .select('*')
      .eq('supabase_id', userData.user.id)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ message: "User not found" })
    }

    return res.status(200).json(profile)

  } catch (err) {
    return res.status(500).json({ message: "Server error" })
  }
}
