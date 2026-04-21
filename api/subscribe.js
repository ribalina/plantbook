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
    const { endpoint, keys_p256dh, keys_auth } = req.body;

    if (!endpoint || !keys_p256dh || !keys_auth) {
      return res.status(400).json({ error: "Missing subscription fields" });
    }

    const { error } = await supabase.from("push_subscriptions").upsert(
      { endpoint, keys_p256dh, keys_auth },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("Supabase upsert error:", error);
      return res.status(500).json({ error: "Failed to save subscription" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
