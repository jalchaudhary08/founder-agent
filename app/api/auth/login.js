import { createSessionCookie, verifyFounderKey } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  try {
    const key = typeof req.body?.key === "string" ? req.body.key : "";
    if (!key) {
      res.status(400).json({ ok: false, error: "Founder key is required." });
      return;
    }

    if (!verifyFounderKey(key)) {
      res.status(401).json({ ok: false, error: "Invalid founder key." });
      return;
    }

    res.setHeader("Set-Cookie", createSessionCookie());
    res.status(200).json({ ok: true, authenticated: true });
  } catch (error) {
    const missing = error?.code === "MISSING_AUTH_SECRET";
    res.status(missing ? 503 : 500).json({
      ok: false,
      error: error?.message || "Authentication configuration error."
    });
  }
}
