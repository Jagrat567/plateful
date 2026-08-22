import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid address identifier");
const fields = { label: z.enum(["home", "work", "other"]), recipientName: z.string().trim().min(2).max(60), phone: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, "Enter a valid phone number"), line1: z.string().trim().min(3).max(120), area: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(60), state: z.string().trim().min(2).max(60), postalCode: z.string().trim().min(4).max(10), instructions: z.string().trim().max(200).default(""), isDefault: z.boolean().default(false) };
export const createAddressSchema = z.object({ body: z.object(fields), params: z.object({}), query: z.object({}) });
export const updateAddressSchema = z.object({ body: z.object(fields).partial().refine((value) => Object.keys(value).length, "Provide at least one field"), params: z.object({ addressId: objectId }), query: z.object({}) });
export const addressParamsSchema = z.object({ body: z.object({}), params: z.object({ addressId: objectId }), query: z.object({}) });
