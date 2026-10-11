
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  let body = req.body;

  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const content =
    typeof body.content === "string" ? body.content.trim() : "";

  if (username.length < 2 || username.length > 24) {
    return res.status(400).json({ error: "Username must be 2–24 characters" });
  }

  if (content.length < 1 || content.length > 1000) {
    return res.status(400).json({ error: "Message must be 1–1000 characters" });
  }

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/messages`,
      {
        method: "POST",
        headers: {
          apikey: secretKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({ username, content })
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: "Could not send message" });
    }

    return res.status(201).json({ ok: true });
  } catch {
    return res.status(502).json({ error: "Message service unavailable" });
  }
}
