import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { key } = req.body;

    if (!key || typeof key !== "string") {
      return res.status(400).json({ valid: false });
    }

    const { data, error } = await supabase
      .from("api_keys")
      .select("id")
      .eq("key", key.trim())
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Supabase query error:", error);
      return res.status(500).json({ error: "Internal error" });
    }

    return res.status(200).json({ valid: !!data });
  } catch (err) {
    console.error("Validate key error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
