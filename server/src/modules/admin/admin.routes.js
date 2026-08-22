import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { listAllOrders, listApplications, listAudit, listReviews, listUsers, moderateReview, operateRestaurant, reviewRestaurant, updateUserStatus } from "./admin.controller.js";
import { restaurantOperationSchema, reviewModerationSchema, reviewRestaurantSchema, userStatusSchema } from "./admin.schemas.js";

export const adminRouter = Router();
adminRouter.use(authenticate, authorize("admin"));
adminRouter.get("/restaurants", listApplications);
adminRouter.patch("/restaurants/:restaurantId/status", validate(reviewRestaurantSchema), reviewRestaurant);
adminRouter.patch("/restaurants/:restaurantId/operation", validate(restaurantOperationSchema), operateRestaurant);
adminRouter.get("/users", listUsers);
adminRouter.patch("/users/:userId/status", validate(userStatusSchema), updateUserStatus);
adminRouter.get("/orders", listAllOrders);
adminRouter.get("/reviews", listReviews);
adminRouter.patch("/reviews/:reviewId", validate(reviewModerationSchema), moderateReview);
adminRouter.get("/audit", listAudit);
