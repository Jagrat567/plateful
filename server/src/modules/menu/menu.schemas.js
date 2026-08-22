import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const empty = z.object({});
export const createCategorySchema = z.object({ body: z.object({ name: z.string().trim().min(2).max(50), displayOrder: z.coerce.number().int().min(0).default(0) }), params: empty, query: empty });
export const categoryParamsSchema = z.object({ body: empty, params: z.object({ categoryId: objectId }), query: empty });
export const createItemSchema = z.object({ body: z.object({ categoryId: objectId, name: z.string().trim().min(2).max(80), description: z.string().trim().min(5).max(300), price: z.coerce.number().positive().max(100000), imageUrl: z.union([z.literal(""), z.url()]).default(""), imagePublicId: z.string().max(200).default(""), foodType: z.enum(["veg", "nonVeg", "vegan"]), isAvailable: z.boolean().default(true) }), params: empty, query: empty });
export const itemParamsSchema = z.object({ body: empty, params: z.object({ itemId: objectId }), query: empty });
export const updateItemSchema = z.object({ body: z.object({ categoryId: objectId.optional(), name: z.string().trim().min(2).max(80).optional(), description: z.string().trim().min(5).max(300).optional(), price: z.coerce.number().positive().max(100000).optional(), imageUrl: z.union([z.literal(""), z.url()]).optional(), imagePublicId: z.string().max(200).optional(), foodType: z.enum(["veg", "nonVeg", "vegan"]).optional(), isAvailable: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, "Provide at least one field"), params: z.object({ itemId: objectId }), query: empty });
