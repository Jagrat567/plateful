import { Router } from "express";
import { getRestaurant, listRestaurants } from "./public.controller.js";
import { listRestaurantReviews } from "../reviews/review.controller.js";

export const publicRestaurantRouter = Router();
publicRestaurantRouter.get("/", listRestaurants);
publicRestaurantRouter.get("/:restaurantId", getRestaurant);
publicRestaurantRouter.get("/:restaurantId/reviews", listRestaurantReviews);
