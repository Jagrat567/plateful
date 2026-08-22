import { User } from "../modules/users/user.model.js";
import { verifyAccessToken } from "../modules/auth/auth.tokens.js";
import { AppError } from "../utils/AppError.js";

export async function authenticate(req, _res, next) {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) return next(new AppError(401, "Authentication required"));

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user || user.status !== "active") return next(new AppError(401, "Authentication required"));
    req.user = user;
    next();
  } catch {
    next(new AppError(401, "Authentication required"));
  }
}

export function authorize(...roles) {
  return (req, _res, next) => roles.includes(req.user.role) ? next() : next(new AppError(403, "You do not have permission to perform this action"));
}
