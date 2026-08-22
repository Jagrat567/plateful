import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const password = z.string().min(8, "Password must be at least 8 characters").max(72).regex(/[A-Z]/, "Password needs an uppercase letter").regex(/[a-z]/, "Password needs a lowercase letter").regex(/[0-9]/, "Password needs a number");

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
    email,
    phone: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, "Enter a valid phone number"),
    password,
  }),
  params: z.object({}), query: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({ email, password: z.string().min(1, "Password is required") }),
  params: z.object({}), query: z.object({}),
});
export const forgotPasswordSchema = z.object({ body: z.object({ email }), params: z.object({}), query: z.object({}) });
export const resetPasswordSchema = z.object({ body: z.object({ token: z.string().min(20), password }), params: z.object({}), query: z.object({}) });
