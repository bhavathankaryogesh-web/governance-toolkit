export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { description } = req.body;

  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "Description required" });
  }

  const prompt = `You are an SAP S/4HANA Fiori expert. A user has described a UI customisation requirement. Your job is to check whether a standard SAP Fiori application already covers this need.

User requirement: "${description}"

Respond ONLY with a valid JSON object — no markdown, no backticks, no extra text. Use this exact structure:
{
  "matchLevel": "HIGH" or "MEDIUM" or "LOW",
  "matchedApp": "App name and ID if found, or null",
  "appCovers": "What the standard app covers (2-3 sentences)",
  "remainingGap": "What gap remains if any, or null",
  "recommendation": "One clear sentence recommending action",
  "suggestQ1Yes": true or false
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Matcher unavailable" });
  }
}