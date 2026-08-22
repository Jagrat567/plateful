import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const refreshCookieName = "plateful_refresh";

export function createAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL });
}

export function createRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: "refresh" }, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_TTL });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
