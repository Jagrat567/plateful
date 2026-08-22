import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const addCartItemSchema = z.object({ body: z.object({ menuItemId: objectId, quantity: z.coerce.number().int().min(1).max(20).default(1), replaceCart: z.boolean().default(false) }), params: z.object({}), query: z.object({}) });
export const updateCartItemSchema = z.object({ body: z.object({ quantity: z.coerce.number().int().min(1).max(20) }), params: z.object({ cartItemId: objectId }), query: z.object({}) });
export const cartItemParamsSchema = z.object({ body: z.object({}), params: z.object({ cartItemId: objectId }), query: z.object({}) });
