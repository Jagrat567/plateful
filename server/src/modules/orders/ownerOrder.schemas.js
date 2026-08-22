import { z } from "zod";
export const ownerOrderParamsSchema = z.object({ body: z.object({}), params: z.object({ orderId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid order identifier") }), query: z.object({}) });
export const ownerOrderStatusSchema = z.object({ body: z.object({ status: z.enum(["confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "cancelled"]), reason: z.string().trim().max(300).default("") }), params: z.object({ orderId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid order identifier") }), query: z.object({}) });
