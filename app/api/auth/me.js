import { isAuthenticated } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  res.status(200).json({ ok: true, authenticated: isAuthenticated(req) });
}
