import { randomBytes } from "node:crypto";
import { Address } from "../addresses/address.model.js";
import { Cart } from "../cart/cart.model.js";
import { Order } from "./order.model.js";
import { AppError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";
import { emitToUser } from "../../socket.js";
import { Restaurant } from "../restaurants/restaurant.model.js";
import { MenuItem } from "../menu/menuItem.model.js";
import { orderEmail } from "../../services/email.service.js";
import { deliveryPricing, PLATFORM_FEE, RESTAURANT_COMMISSION_RATE, RIDER_REFERRAL_SHARE } from "../../config/businessRules.js";

const orderNumber = () => `PLT-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;

export async function checkout(req, res) {
  const existing = await Order.findOne({ idempotencyKey: req.validated.body.idempotencyKey, customer: req.user.id }).select("+idempotencyKey");
  if (existing) return res.json({ success: true, data: { order: existing } });
  const [address, cart, previousOrder] = await Promise.all([
    Address.findOne({ _id: req.validated.body.addressId, user: req.user.id }),
    Cart.findOne({ user: req.user.id }).populate("restaurant").populate("items.menuItem"),
    Order.exists({ customer: req.user.id, status: { $ne: "cancelled" } }),
  ]);
  if (!address) throw new AppError(400, "Choose a valid delivery address");
  if (!cart || cart.items.length === 0) throw new AppError(409, "Your cart is empty");
  if (!cart.restaurant || cart.restaurant.status !== "approved" || !cart.restaurant.isAcceptingOrders) throw new AppError(409, "This restaurant is no longer accepting orders");
  const unavailable = cart.items.find((entry) => !entry.menuItem || !entry.menuItem.isAvailable || String(entry.menuItem.restaurant) !== String(cart.restaurant.id));
  if (unavailable) throw new AppError(409, "One or more cart items are no longer available");
  const items = cart.items.map((entry) => ({ menuItem: entry.menuItem.id, name: entry.menuItem.name, description: entry.menuItem.description, imageUrl: entry.menuItem.imageUrl, foodType: entry.menuItem.foodType, unitPrice: entry.menuItem.price, quantity: entry.quantity, lineTotal: entry.menuItem.price * entry.quantity }));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  if (subtotal < cart.restaurant.minimumOrder) throw new AppError(409, `Minimum order is ₹${cart.restaurant.minimumOrder}`);
  const distance = deliveryPricing(req.validated.body.deliveryDistanceKm);
  const deliveryFee = distance.deliveryFee;
  const discount = previousOrder ? 0 : Number((subtotal * 0.5).toFixed(2));
  const couponCode = discount ? "FIRST50" : "";
  const now = new Date();
  const simulate = env.ORDER_SIMULATION_ENABLED && cart.restaurant.orderMode !== "manual";
  const restaurantCounter = await Restaurant.findByIdAndUpdate(cart.restaurant.id, { $inc: { totalOrdersReceived: 1 } }, { new: true });
  const restaurantOrderNumber = restaurantCounter.totalOrdersReceived;
  const commissionApplied = restaurantOrderNumber % 2 === 0;
  const restaurantCommissionAmount = commissionApplied ? Number((subtotal * RESTAURANT_COMMISSION_RATE).toFixed(2)) : 0;
  const riderReferralEarning = cart.restaurant.referredByRider ? Number((restaurantCommissionAmount * RIDER_REFERRAL_SHARE).toFixed(2)) : 0;
  const order = await Order.create({ orderNumber: orderNumber(), idempotencyKey: req.validated.body.idempotencyKey, customer: req.user.id, restaurant: cart.restaurant.id, restaurantSnapshot: { name: cart.restaurant.name, contactPhone: cart.restaurant.contactPhone }, items, deliveryAddress: { label: address.label, recipientName: address.recipientName, phone: address.phone, line1: address.line1, area: address.area, city: address.city, state: address.state, postalCode: address.postalCode, instructions: address.instructions }, pricing: { subtotal, discount, couponCode, deliveryFee, platformFee: PLATFORM_FEE, total: subtotal - discount + deliveryFee + PLATFORM_FEE }, deliveryDistanceKm: distance.distanceKm, chargeableDeliveryKm: distance.chargeableKm, restaurantOrderNumber, financials: { restaurantCommissionApplied: commissionApplied, restaurantCommissionRate: commissionApplied ? RESTAURANT_COMMISSION_RATE : 0, restaurantCommissionAmount, riderReferralShareRate: cart.restaurant.referredByRider ? RIDER_REFERRAL_SHARE : 0, riderReferralEarning, riderDeliveryEarning: deliveryFee }, status: "placed", statusHistory: [{ status: "placed", changedAt: now }], paymentMethod: "cash_on_delivery", paymentStatus: "pending", simulationEnabled: simulate, nextStatusUpdateAt: simulate ? new Date(now.getTime() + env.ORDER_STATUS_INTERVAL_MS) : null });
  await cart.deleteOne();
  emitToUser(req.user.id, "order:created", order);
  emitToUser(cart.restaurant.owner, "restaurant:order_created", order);
  orderEmail(req.user, order, "Order confirmed").catch((error) => console.error("Order email failed", error));
  res.status(201).json({ success: true, data: { order } });
}

export async function listOrders(req, res) {
  const orders = await Order.find({ customer: req.user.id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: { orders } });
}

export async function getOrder(req, res) {
  const order = await Order.findOne({ _id: req.validated.params.orderId, customer: req.user.id });
  if (!order) throw new AppError(404, "Order not found");
  res.json({ success: true, data: { order } });
}

export async function cancelOrder(req, res) {
  const order = await Order.findOne({ _id: req.validated.params.orderId, customer: req.user.id });
  if (!order) throw new AppError(404, "Order not found");
  if (!["placed", "confirmed"].includes(order.status)) throw new AppError(409, "This order can no longer be cancelled");
  order.status = "cancelled"; order.cancellationReason = req.validated.body.reason; order.cancelledBy = "customer"; order.statusHistory.push({ status: "cancelled", changedAt: new Date() }); order.simulationEnabled = false; order.nextStatusUpdateAt = null;
  await order.save();
  emitToUser(order.customer, "order:updated", order);
  const restaurant = await Restaurant.findById(order.restaurant);
  if (restaurant) emitToUser(restaurant.owner, "restaurant:order_updated", order);
  res.json({ success: true, data: { order } });
}

export async function reorder(req, res) {
  const order = await Order.findOne({ _id: req.validated.params.orderId, customer: req.user.id });
  if (!order) throw new AppError(404, "Order not found");
  const restaurant = await Restaurant.findOne({ _id: order.restaurant, status: "approved", isAcceptingOrders: true });
  if (!restaurant) throw new AppError(409, "This restaurant is not accepting orders");
  const currentItems = await MenuItem.find({ _id: { $in: order.items.map((item) => item.menuItem) }, restaurant: restaurant.id, isAvailable: true });
  const byId = new Map(currentItems.map((item) => [item.id, item]));
  const items = order.items.filter((item) => byId.has(String(item.menuItem))).map((item) => ({ menuItem: item.menuItem, quantity: item.quantity }));
  if (!items.length) throw new AppError(409, "None of these items are currently available");
  let cart = await Cart.findOne({ user: req.user.id });
  if (cart && String(cart.restaurant) !== String(restaurant.id) && !req.validated.body.replaceCart) throw new AppError(409, "Your cart contains items from another restaurant. Clear it to reorder.");
  if (!cart) cart = new Cart({ user: req.user.id, restaurant: restaurant.id, items: [] });
  cart.restaurant = restaurant.id; cart.items = items;
  await cart.save();
  res.json({ success: true, data: { cartId: cart.id, unavailableItemCount: order.items.length - items.length } });
}
