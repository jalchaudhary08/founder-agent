import crypto from "node:crypto";

const TTL_SECONDS = 10 * 60;

function getSecret() {
  const secret = process.env.FOUNDER_AUTH_SECRET;
  if (!secret || secret.length < 24) {
    const error = new Error("FOUNDER_AUTH_SECRET must be configured and be at least 24 characters.");
    error.code = "MISSING_AUTH_SECRET";
    throw error;
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createApprovalToken(proposal) {
  const payload = {
    v: 1,
    sub: "founder",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
    proposal
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyApprovalToken(token) {
  if (typeof token !== "string" || !token) throw new Error("Approval token is required.");
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw new Error("Invalid approval token.");

  const expected = sign(encoded);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    throw new Error("Invalid approval token signature.");
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (payload.v !== 1 || payload.sub !== "founder" || !Number.isInteger(payload.exp) || payload.exp < now) {
    throw new Error("Approval token expired or invalid.");
  }

  return payload.proposal;
}
