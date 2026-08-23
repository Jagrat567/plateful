import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { acceptDelivery, applyAsRider, getRiderDashboard, submitRestaurantLead, updateAvailability, updateDeliveryStatus } from "./rider.controller.js";
import { availabilitySchema, restaurantLeadSchema, riderApplicationSchema, riderOrderParamsSchema, riderOrderStatusSchema } from "./rider.schemas.js";

export const riderRouter = Router();
riderRouter.use(authenticate);
riderRouter.get("/dashboard", getRiderDashboard);
riderRouter.post("/apply", validate(riderApplicationSchema), applyAsRider);
riderRouter.patch("/availability", validate(availabilitySchema), updateAvailability);
riderRouter.post("/restaurant-leads", validate(restaurantLeadSchema), submitRestaurantLead);
riderRouter.post("/deliveries/:orderId/accept", validate(riderOrderParamsSchema), acceptDelivery);
riderRouter.patch("/deliveries/:orderId/status", validate(riderOrderStatusSchema), updateDeliveryStatus);
