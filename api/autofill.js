export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Plant name required" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `You are a plant care expert. For the plant "${name}", return ONLY valid JSON with these exact keys:
{
  "latin": "",
  "watering": "",
  "light": "",
  "humidity": "",
  "soil": "",
  "notes": "",
  "wateringDetail": ""
}

Rules:
- Keep watering as one of: Daily, Twice weekly, Weekly, Bi-weekly, Monthly
- Keep light short, for example: Bright indirect
- Keep humidity short, for example: Low, Medium, High
- Keep soil short, for example: Well-draining
- notes should be 1-2 short sentences
- wateringDetail should be 1 short sentence
- Return JSON only, no markdown, no explanation`
      }),
    });

    const data = await response.json();

    const text = data.output?.[0]?.content?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: "No AI text returned" });
    }

    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "AI failed" });
  }
}