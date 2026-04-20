import { createClient } from '@supabase/supabase-js'

export default async function handler(req: any, res: any) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token" })
    }

    const token = authHeader.split(" ")[1]

    // ✅ CREATE CLIENT WITH USER TOKEN (CRITICAL FIX)
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // ✅ Get authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log("CREATING STATE AS:", userData?.user?.email)

    console.log("AUTH USER ID:", userData?.user?.id);
    console.log("AUTH EMAIL:", userData?.user?.email);

    if (userError || !userData.user) {
      return res.status(401).json({ message: "Invalid user" })
    }

    console.log("CREATING STATE AS:", userData.user.email)

    // ✅ Fetch from DB (RLS now works)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('supabase_id', userData.user.id)
      .maybeSingle();

    if (error) {
      console.error("DB ERROR:", error);
      return res.status(500).json({ message: "Database error" });
    }

    if (!user) {
      console.log("NO USER FOUND IN DB");
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      email: user.email,
      role: user.role
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" })
  }
}
