import { Order } from "./order.model.js";
import { Restaurant } from "../restaurants/restaurant.model.js";
import { AppError } from "../../utils/AppError.js";
import { applyOrderStatus, nextOrderStatus } from "./orderStatus.js";
import { emitToUser } from "../../socket.js";
import { User } from "../users/user.model.js";
import { orderEmail } from "../../services/email.service.js";

async function restaurantFor(userId) {
  const restaurant = await Restaurant.findOne({ owner: userId });
  if (!restaurant) throw new AppError(404, "Restaurant not found");
  return restaurant;
}
export async function listRestaurantOrders(req, res) {
  const restaurant = await restaurantFor(req.user.id);
  const orders = await Order.find({ restaurant: restaurant.id }).populate("customer", "name phone email").sort({ createdAt: -1 }).limit(100);
  res.json({ success: true, data: { orders } });
}
export async function updateRestaurantOrder(req, res) {
  const restaurant = await restaurantFor(req.user.id);
  const order = await Order.findOne({ _id: req.validated.params.orderId, restaurant: restaurant.id });
  if (!order) throw new AppError(404, "Order not found");
  const { status, reason } = req.validated.body;
  if (["delivered", "cancelled"].includes(order.status)) throw new AppError(409, "This order is already complete");
  if (status === "cancelled") {
    if (!["placed", "confirmed"].includes(order.status)) throw new AppError(409, "This order can no longer be cancelled");
    if (reason.length < 5) throw new AppError(400, "Provide a cancellation reason");
    order.status = "cancelled"; order.cancellationReason = reason; order.cancelledBy = "restaurant"; order.statusHistory.push({ status: "cancelled", changedAt: new Date() }); order.simulationEnabled = false; order.nextStatusUpdateAt = null;
  } else {
    if (status !== nextOrderStatus(order.status)) throw new AppError(409, `The next valid status is ${nextOrderStatus(order.status)}`);
    applyOrderStatus(order, status); order.simulationEnabled = false; order.nextStatusUpdateAt = null;
  }
  await order.save();
  emitToUser(order.customer, "order:updated", order);
  if (order.status === "delivered") { const customer = await User.findById(order.customer); if (customer) orderEmail(customer, order, "Order delivered").catch((error) => console.error("Delivery email failed", error)); }
  res.json({ success: true, data: { order } });
}
