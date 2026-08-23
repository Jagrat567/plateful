import { z } from "zod";

export const checkoutSchema = z.object({ body: z.object({ addressId: z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid address"), idempotencyKey: z.uuid("Invalid checkout request"), deliveryDistanceKm: z.coerce.number().min(0.1).max(50) }), params: z.object({}), query: z.object({}) });
export const orderParamsSchema = z.object({ body: z.object({}), params: z.object({ orderId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid order identifier") }), query: z.object({}) });
export const cancelOrderSchema = z.object({ body: z.object({ reason: z.string().trim().min(5, "Provide a cancellation reason").max(300) }), params: z.object({ orderId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid order identifier") }), query: z.object({}) });
export const reorderSchema = z.object({ body: z.object({ replaceCart: z.boolean().default(false) }), params: z.object({ orderId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid order identifier") }), query: z.object({}) });
