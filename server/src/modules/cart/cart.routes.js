import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "./cart.controller.js";
import { addCartItemSchema, cartItemParamsSchema, updateCartItemSchema } from "./cart.schemas.js";

export const cartRouter = Router();
cartRouter.use(authenticate, authorize("customer", "restaurantOwner", "rider"));
cartRouter.get("/", getCart);
cartRouter.post("/items", validate(addCartItemSchema), addCartItem);
cartRouter.patch("/items/:cartItemId", validate(updateCartItemSchema), updateCartItem);
cartRouter.delete("/items/:cartItemId", validate(cartItemParamsSchema), removeCartItem);
cartRouter.delete("/", clearCart);
