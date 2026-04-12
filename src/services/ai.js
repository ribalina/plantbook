const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

export async function claudeJSON(prompt) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await r.json();
  const txt = d.content?.find((b) => b.type === "text")?.text || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
}

export async function claudeVision(base64, mediaType) {
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: 'Identify this plant. Return ONLY JSON (no markdown) with keys: name, latin, watering (e.g. "Weekly"), light (e.g. "Bright indirect"), humidity, soil, notes (2–3 care sentences), wateringDetail (one sentence), emoji (single relevant plant emoji). If unidentifiable use "Unknown Plant".',
            },
          ],
        },
      ],
    }),
  });
  const d = await r.json();
  const txt = d.content?.find((b) => b.type === "text")?.text || "";
  return JSON.parse(txt.replace(/```json|```/g, "").trim());
}
