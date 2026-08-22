import { User } from "../users/user.model.js";
import { AppError } from "../../utils/AppError.js";
import { createAccessToken, createRefreshToken, hashToken, refreshCookieName, refreshCookieOptions, verifyRefreshToken } from "./auth.tokens.js";
import { randomBytes } from "node:crypto";
import { env } from "../../config/env.js";
import { sendEmail, welcomeEmail } from "../../services/email.service.js";

async function establishSession(user, res) {
  const refreshToken = createRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateModifiedOnly: true });
  res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);
  return createAccessToken(user);
}

export async function register(req, res) {
  const { name, email, phone, password } = req.validated.body;
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) throw new AppError(409, "An account with that email or phone already exists");

  const user = new User({ name, email, phone });
  await user.setPassword(password);
  await user.save();
  const accessToken = await establishSession(user, res);
  welcomeEmail(user).catch((error) => console.error("Welcome email failed", error));
  res.status(201).json({ success: true, data: { user: user.toPublicJSON(), accessToken } });
}

export async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select("+passwordHash +refreshTokenHash");
  if (!user || !(await user.verifyPassword(password))) throw new AppError(401, "Invalid email or password");
  if (user.status !== "active") throw new AppError(403, "This account is unavailable");

  const accessToken = await establishSession(user, res);
  res.json({ success: true, data: { user: user.toPublicJSON(), accessToken } });
}

export async function refresh(req, res) {
  const token = req.cookies[refreshCookieName];
  if (!token) throw new AppError(401, "Your session has expired");

  let payload;
  try { payload = verifyRefreshToken(token); } catch { throw new AppError(401, "Your session has expired"); }
  const user = await User.findById(payload.sub).select("+refreshTokenHash");
  if (!user || user.status !== "active" || user.refreshTokenHash !== hashToken(token)) {
    res.clearCookie(refreshCookieName, refreshCookieOptions);
    throw new AppError(401, "Your session has expired");
  }

  const accessToken = await establishSession(user, res);
  res.json({ success: true, data: { user: user.toPublicJSON(), accessToken } });
}

export async function logout(req, res) {
  const token = req.cookies[refreshCookieName];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.findByIdAndUpdate(payload.sub, { $set: { refreshTokenHash: null } });
    } catch { /* An invalid cookie is cleared below. */ }
  }
  res.clearCookie(refreshCookieName, refreshCookieOptions);
  res.status(204).send();
}

export function getMe(req, res) {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
}

export async function forgotPassword(req, res) {
  const user = await User.findOne({ email: req.validated.body.email }).select("+passwordResetTokenHash +passwordResetExpiresAt");
  if (user) {
    const token = randomBytes(32).toString("hex");
    user.passwordResetTokenHash = hashToken(token); user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save({ validateModifiedOnly: true });
    sendEmail({ to: user.email, subject: "Reset your Plateful password", html: `<h1>Reset your password</h1><p>This link expires in 30 minutes.</p><p><a href="${env.APP_URL}/reset-password?token=${token}">Reset password</a></p>` }).catch((error) => console.error("Password reset email failed", error));
  }
  res.json({ success: true, message: "If that account exists, a reset link has been sent" });
}

export async function resetPassword(req, res) {
  const user = await User.findOne({ passwordResetTokenHash: hashToken(req.validated.body.token), passwordResetExpiresAt: { $gt: new Date() } }).select("+passwordHash +passwordResetTokenHash +passwordResetExpiresAt");
  if (!user) throw new AppError(400, "This reset link is invalid or expired");
  await user.setPassword(req.validated.body.password); user.passwordResetTokenHash = null; user.passwordResetExpiresAt = null; user.refreshTokenHash = null;
  await user.save();
  res.json({ success: true, message: "Password updated successfully" });
}
