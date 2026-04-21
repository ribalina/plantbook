import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  try {
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    // 1. Find plants due today or overdue
    const { data: plants, error: plantsErr } = await supabase
      .from("plants")
      .select("id, name, next_watering_at")
      .lte("next_watering_at", new Date().toISOString());

    if (plantsErr) {
      console.error("Plants query error:", plantsErr);
      return res.status(500).json({ error: "Failed to query plants" });
    }

    const dueCount = plants?.length || 0;

    // Nothing due — skip notifications
    if (dueCount === 0) {
      return res.status(200).json({ sent: 0, reason: "No plants due today" });
    }

    // 2. Build notification payload
    let body;
    if (dueCount === 1) {
      body = `${plants[0].name} needs water today`;
    } else {
      body = `${dueCount} plants need to be watered today`;
    }

    const payload = JSON.stringify({
      title: "🌿 Watering Reminder",
      body,
    });

    // 3. Get subscriptions not yet notified today
    const { data: subs, error: subsErr } = await supabase
      .from("push_subscriptions")
      .select("*")
      .or(`last_notified_at.is.null,last_notified_at.neq.${today}`);

    if (subsErr) {
      console.error("Subscriptions query error:", subsErr);
      return res.status(500).json({ error: "Failed to query subscriptions" });
    }

    if (!subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, reason: "No subscriptions to notify" });
    }

    // 4. Send push to each subscription
    let sent = 0;
    const staleEndpoints = [];

    for (const sub of subs) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, payload);
        sent++;
      } catch (err) {
        console.error(`Push failed for ${sub.endpoint}:`, err.statusCode);
        // 404 or 410 = subscription expired, clean up
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    }

    // 5. Mark all sent subscriptions as notified today
    if (sent > 0) {
      const sentEndpoints = subs
        .filter((s) => !staleEndpoints.includes(s.endpoint))
        .map((s) => s.endpoint);

      await supabase
        .from("push_subscriptions")
        .update({ last_notified_at: today })
        .in("endpoint", sentEndpoints);
    }

    // 6. Remove stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
    }

    return res.status(200).json({ sent, staleRemoved: staleEndpoints.length });
  } catch (err) {
    console.error("Cron notify error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
