export default async function handler(req, res) {
  // Prevent any caching of API responses
  res.setHeader("Cache-Control", "no-store, max-age=0");

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

  // Safely parse body if it arrives as a raw string
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

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  // STRICT VALIDATION: Matches frontend regex exactly
  if (!/^[\p{L}\p{N}_ -]{2,24}$/u.test(username)) {
    return res.status(400).json({ error: "Username must be 2–24 letters, numbers, spaces, hyphens, or underscores." });
  }

  if (content.length < 1 || content.length > 1000) {
    return res.status(400).json({ error: "Message must be 1–1000 characters." });
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/rest/v1/messages`, {
      method: "POST",
      headers: {
        // CRITICAL: Use Bearer token for service_role (secret) key
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({ username, content })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Supabase insert error:", response.status, errorData);
      return res.status(502).json({ error: "Could not send message" });
    }

    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Message service error:", error);
    return res.status(502).json({ error: "Message service unavailable" });
  }
}