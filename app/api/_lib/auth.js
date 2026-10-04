import crypto from "node:crypto";

const COOKIE_NAME = "founder_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getSecret() {
  const secret = process.env.FOUNDER_AUTH_SECRET;
  if (!secret || secret.length < 24) {
    const error = new Error("FOUNDER_AUTH_SECRET must be configured and be at least 24 characters.");
    error.code = "MISSING_AUTH_SECRET";
    throw error;
  }
  return secret;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function makeToken() {
  const payload = JSON.stringify({
    sub: "founder",
    iat: Math.floor(Date.now() / 1000)
  });
  const encoded = base64url(payload);
  return `${encoded}.${sign(encoded)}`;
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function verifyFounderKey(key) {
  if (typeof key !== "string" || !key) return false;
  const secret = getSecret();
  return safeEqual(key, secret);
}

export function createSessionCookie() {
  const token = makeToken();
  return `${COOKIE_NAME}=${token}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function isAuthenticated(req) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return false;

    const [encoded, signature] = token.split(".");
    if (!encoded || !signature || !safeEqual(signature, sign(encoded))) return false;

    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    const age = Math.floor(Date.now() / 1000) - Number(payload.iat);
    return payload.sub === "founder" && Number.isFinite(age) && age >= 0 && age <= SESSION_TTL_SECONDS;
  } catch {
    return false;
  }
}

export function requireAuth(req) {
  if (!isAuthenticated(req)) {
    const error = new Error("Founder authentication required.");
    error.code = "UNAUTHORIZED";
    throw error;
  }
}
