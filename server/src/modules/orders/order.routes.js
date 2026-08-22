import { Router } from "express";
import { authenticate, authorize } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { cancelOrder, checkout, getOrder, listOrders, reorder } from "./order.controller.js";
import { cancelOrderSchema, checkoutSchema, orderParamsSchema, reorderSchema } from "./order.schemas.js";

export const orderRouter = Router();
orderRouter.use(authenticate, authorize("customer", "restaurantOwner"));
orderRouter.post("/checkout", validate(checkoutSchema), checkout);
orderRouter.get("/", listOrders);
orderRouter.get("/:orderId", validate(orderParamsSchema), getOrder);
orderRouter.patch("/:orderId/cancel", validate(cancelOrderSchema), cancelOrder);
orderRouter.post("/:orderId/reorder", validate(reorderSchema), reorder);
