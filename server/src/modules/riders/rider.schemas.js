import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const phone = z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, "Enter a valid phone number");
export const riderApplicationSchema = z.object({
  body: z.object({
    vehicleType: z.enum(["bicycle", "motorcycle", "scooter", "car"]),
    vehicleNumber: z.string().trim().max(30).default(""),
    drivingLicenseNumber: z.string().trim().max(40).default(""),
    city: z.string().trim().min(2).max(60),
    serviceAreas: z.array(z.string().trim().min(2).max(80)).min(1).max(12),
    upiId: z.string().trim().min(3).max(100),
    emergencyContact: phone,
  }).superRefine((value, context) => {
    if (value.vehicleType !== "bicycle" && value.drivingLicenseNumber.length < 5) context.addIssue({ code: "custom", path: ["drivingLicenseNumber"], message: "A driving licence is required for motor vehicles" });
  }), params: z.object({}), query: z.object({}),
});
export const availabilitySchema = z.object({ body: z.object({ isAvailable: z.boolean() }), params: z.object({}), query: z.object({}) });
export const restaurantLeadSchema = z.object({ body: z.object({ restaurantName: z.string().trim().min(2).max(100), ownerName: z.string().trim().min(2).max(60), ownerPhone: phone, ownerEmail: z.email(), city: z.string().trim().min(2).max(60), address: z.string().trim().min(5).max(200), cuisines: z.array(z.string().trim().min(2).max(40)).min(1).max(8), notes: z.string().trim().max(500).default("") }), params: z.object({}), query: z.object({}) });
export const riderOrderParamsSchema = z.object({ body: z.object({}), params: z.object({ orderId: objectId }), query: z.object({}) });
export const riderOrderStatusSchema = z.object({ body: z.object({ status: z.enum(["out_for_delivery", "delivered"]) }), params: z.object({ orderId: objectId }), query: z.object({}) });
export const riderDecisionSchema = z.object({ body: z.object({ status: z.enum(["approved", "rejected", "suspended"]), reason: z.string().trim().max(300).default("") }), params: z.object({ riderId: objectId }), query: z.object({}) });
export const leadDecisionSchema = z.object({ body: z.object({ status: z.enum(["contacted", "approved", "rejected"]), reason: z.string().trim().max(300).default("") }), params: z.object({ leadId: objectId }), query: z.object({}) });
export const earningPayoutSchema = z.object({ body: z.object({ status: z.literal("paid") }), params: z.object({ earningId: objectId }), query: z.object({}) });
