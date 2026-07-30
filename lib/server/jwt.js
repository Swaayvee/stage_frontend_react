import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const encoder = new TextEncoder();

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET est obligatoire en production.");
  }
  return value || "relayflow-local-development-secret-change-me";
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(unsignedToken) {
  return createHmac("sha256", secret()).update(unsignedToken).digest("base64url");
}

export function createAccessToken({ sub, role }) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub, role, iat: now, exp: now + 15 * 60 });
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken)}`;
}

export function verifyAccessToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const unsignedToken = `${parts[0]}.${parts[1]}`;
  const expected = encoder.encode(sign(unsignedToken));
  const received = encoder.encode(parts[2]);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload.sub || !payload.role || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
