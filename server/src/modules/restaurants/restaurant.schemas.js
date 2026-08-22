import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm time format");
const fields = {
  name: z.string().trim().min(2).max(100), description: z.string().trim().min(20).max(500),
  cuisines: z.array(z.string().trim().min(2).max(40)).min(1).max(8),
  contactPhone: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, "Enter a valid phone number"),
  address: z.object({ line1: z.string().trim().min(3).max(120), area: z.string().trim().min(2).max(80), city: z.string().trim().min(2).max(60), state: z.string().trim().min(2).max(60), postalCode: z.string().trim().min(4).max(10) }),
  openingTime: time, closingTime: time,
  coverImageUrl: z.union([z.literal(""), z.url()]).optional(), coverImagePublicId: z.string().max(200).optional(),
  deliveryFee: z.coerce.number().min(0).max(10000).optional(), minimumOrder: z.coerce.number().min(0).max(100000).optional(), estimatedDeliveryMinutes: z.coerce.number().int().min(10).max(180).optional(), isAcceptingOrders: z.boolean().optional(),
  orderMode: z.enum(["simulated", "manual"]).optional(),
};
export const createRestaurantSchema = z.object({ body: z.object(fields), params: z.object({}), query: z.object({}) });
export const updateRestaurantSchema = z.object({ body: z.object(fields).partial().refine((value) => Object.keys(value).length > 0, "Provide at least one field"), params: z.object({}), query: z.object({}) });
