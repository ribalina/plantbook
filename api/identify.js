export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data required" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
              },
              {
                type: "input_text",
                text: `You are a plant identification expert. Identify the plant in this image and return ONLY valid JSON with these exact keys:
{
  "recognized": true,
  "confidence": 0.0,
  "name": "",
  "latin": "",
  "watering": "",
  "light": "",
  "humidity": "",
  "soil": "",
  "notes": "",
  "wateringDetail": "",
  "emoji": ""
}

Rules:
- "recognized": true if you can identify the plant, false if not
- "confidence": number between 0 and 1
- "name": common name of the plant
- "latin": scientific/latin name
- "watering": short frequency like "Every 7 day/s" or "Every 3 day/s"
- "light": short description like "Bright indirect"
- "humidity": one of "Low", "Medium", "High"
- "soil": short description like "Well-draining"
- "notes": 1-2 short care sentences
- "wateringDetail": 1 short sentence about watering schedule
- "emoji": single relevant plant emoji
- If you cannot identify the plant, set recognized to false, name to "Unknown Plant", and leave other fields with sensible defaults
- Return JSON only, no markdown, no explanation`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.output?.[0]?.content?.[0]?.text;

    if (!text) {
      return res.status(200).json({
        recognized: false,
        confidence: 0,
        name: "Unknown Plant",
        latin: "",
        watering: "Every 7 day/s",
        light: "",
        humidity: "Medium",
        soil: "",
        notes: "",
        wateringDetail: "",
        emoji: "🌿",
      });
    }

    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Identify error:", err);
    return res.status(500).json({ error: "AI identification failed" });
  }
}
