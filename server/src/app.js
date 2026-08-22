import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { clientOrigins, env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { ownerRouter } from "./modules/restaurants/owner.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { publicRestaurantRouter } from "./modules/restaurants/public.routes.js";
import { addressRouter } from "./modules/addresses/address.routes.js";
import { cartRouter } from "./modules/cart/cart.routes.js";
import { orderRouter } from "./modules/orders/order.routes.js";
import { reviewRouter } from "./modules/reviews/review.routes.js";
import { favoriteRouter } from "./modules/restaurants/favorites.routes.js";

export const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || clientOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
}));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/owner", ownerRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/restaurants", publicRestaurantRouter);
app.use("/api/v1/addresses", addressRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/favorites", favoriteRouter);
app.use(notFoundHandler);
app.use(errorHandler);
