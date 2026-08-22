import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { createReview } from "./review.controller.js";
import { createReviewSchema } from "./review.schemas.js";
export const reviewRouter = Router();
reviewRouter.use(authenticate, authorize("customer", "restaurantOwner"));
reviewRouter.post("/", validate(createReviewSchema), createReview);
