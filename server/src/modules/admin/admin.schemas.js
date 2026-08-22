import { z } from "zod";

export const reviewRestaurantSchema = z.object({
  body: z.object({ status: z.enum(["approved", "rejected"]), reason: z.string().trim().max(300).default("") }).superRefine((value, context) => {
    if (value.status === "rejected" && value.reason.length < 5) context.addIssue({ code: "custom", path: ["reason"], message: "Provide a rejection reason" });
  }),
  params: z.object({ restaurantId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid restaurant identifier") }),
  query: z.object({}),
});
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const userStatusSchema = z.object({ body: z.object({ status: z.enum(["active", "suspended"]) }), params: z.object({ userId: objectId }), query: z.object({}) });
export const restaurantOperationSchema = z.object({ body: z.object({ status: z.enum(["approved", "suspended"]) }), params: z.object({ restaurantId: objectId }), query: z.object({}) });
export const reviewModerationSchema = z.object({ body: z.object({ status: z.enum(["visible", "hidden"]) }), params: z.object({ reviewId: objectId }), query: z.object({}) });
