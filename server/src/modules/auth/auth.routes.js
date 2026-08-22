import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { forgotPassword, getMe, login, logout, refresh, register, resetPassword } from "./auth.controller.js";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./auth.schemas.js";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, message: "Too many attempts. Please try again later." } });
export const authRouter = Router();
authRouter.post("/register", authLimiter, validate(registerSchema), register);
authRouter.post("/login", authLimiter, validate(loginSchema), login);
authRouter.post("/refresh", authLimiter, refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticate, getMe);
authRouter.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword);
