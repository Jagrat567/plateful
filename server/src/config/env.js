import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: z.string().min(1).refine((value) => value.split(",").every((origin) => z.url().safeParse(origin.trim()).success), "CLIENT_ORIGIN must contain one or more comma-separated URLs").default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  ORDER_SIMULATION_ENABLED: z.stringbool().default(true),
  ORDER_STATUS_INTERVAL_MS: z.coerce.number().int().positive().default(60000),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("Plateful <orders@example.com>"),
  APP_URL: z.url().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}
export const env = parsed.data;
export const clientOrigins = env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim());
