import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate.js";
import { getFavorites, recentlyOrdered, toggleFavorite } from "./favorites.controller.js";
export const favoriteRouter = Router();
favoriteRouter.use(authenticate, authorize("customer", "restaurantOwner", "rider"));
favoriteRouter.get("/", getFavorites);
favoriteRouter.get("/recent", recentlyOrdered);
favoriteRouter.patch("/:restaurantId", toggleFavorite);
