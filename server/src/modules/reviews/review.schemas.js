import { z } from "zod";
export const createReviewSchema = z.object({ body: z.object({ orderId: z.string().regex(/^[a-f\d]{24}$/i), rating: z.coerce.number().int().min(1).max(5), foodRating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().min(5).max(500) }), params: z.object({}), query: z.object({}) });
