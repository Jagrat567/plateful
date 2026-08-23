import { RiderProfile } from "./riderProfile.model.js";
import { RestaurantLead } from "./restaurantLead.model.js";
import { RiderEarning } from "./riderEarning.model.js";
import { Order } from "../orders/order.model.js";
import { Restaurant } from "../restaurants/restaurant.model.js";
import { AppError } from "../../utils/AppError.js";
import { applyOrderStatus } from "../orders/orderStatus.js";
import { settleDeliveredOrder } from "../orders/orderFinancials.js";
import { emitToUser } from "../../socket.js";

const profileFor = (userId) => RiderProfile.findOne({ user: userId });

async function notifyOrderParticipants(order) {
  const restaurant = await Restaurant.findById(order.restaurant).select("owner");
  emitToUser(order.customer, "order:updated", order);
  if (restaurant?.owner) emitToUser(restaurant.owner, "restaurant:order_updated", order);
}

export async function getRiderDashboard(req, res) {
  const profile = await profileFor(req.user.id);
  if (!profile) return res.json({ success: true, data: { profile: null, leads: [], earnings: [], availableOrders: [], activeOrder: null } });
  const [leads, earnings, availableOrders, activeOrder] = await Promise.all([
    RestaurantLead.find({ rider: profile.id }).sort({ createdAt: -1 }),
    RiderEarning.find({ rider: profile.id }).populate("restaurant", "name").sort({ createdAt: -1 }).limit(100),
    profile.status === "approved" && profile.isAvailable ? Order.find({ status: "ready_for_pickup", assignedRider: null }).populate("restaurant", "name address").limit(30) : [],
    profile.activeOrder ? Order.findById(profile.activeOrder).populate("restaurant", "name address contactPhone") : null,
  ]);
  res.json({ success: true, data: { profile, leads, earnings, availableOrders, activeOrder } });
}

export async function applyAsRider(req, res) {
  if (await profileFor(req.user.id)) throw new AppError(409, "You already have a rider application");
  if (req.user.role === "admin" || req.user.role === "restaurantOwner") throw new AppError(409, "This account cannot become a rider");
  const profile = await RiderProfile.create({ ...req.validated.body, user: req.user.id });
  res.status(201).json({ success: true, data: { profile } });
}

export async function updateAvailability(req, res) {
  const profile = await profileFor(req.user.id);
  if (!profile || profile.status !== "approved") throw new AppError(403, "Your rider account is not approved");
  if (profile.activeOrder && !req.validated.body.isAvailable) throw new AppError(409, "Complete your active delivery before going offline");
  profile.isAvailable = req.validated.body.isAvailable;
  await profile.save();
  res.json({ success: true, data: { profile } });
}

export async function submitRestaurantLead(req, res) {
  const profile = await profileFor(req.user.id);
  if (!profile || profile.status !== "approved") throw new AppError(403, "Only approved riders can add restaurant leads");
  if (await RestaurantLead.exists({ $or: [{ ownerEmail: req.validated.body.ownerEmail }, { ownerPhone: req.validated.body.ownerPhone }] })) throw new AppError(409, "This restaurant owner has already been referred");
  const lead = await RestaurantLead.create({ ...req.validated.body, rider: profile.id });
  res.status(201).json({ success: true, data: { lead } });
}

export async function acceptDelivery(req, res) {
  const profile = await profileFor(req.user.id);
  if (!profile || profile.status !== "approved" || !profile.isAvailable) throw new AppError(403, "Go online with an approved rider account first");
  if (profile.activeOrder) throw new AppError(409, "Complete your active delivery first");
  const order = await Order.findOneAndUpdate({ _id: req.validated.params.orderId, status: "ready_for_pickup", assignedRider: null }, { assignedRider: profile.id, deliveryAcceptedAt: new Date(), simulationEnabled: false, nextStatusUpdateAt: null }, { new: true });
  if (!order) throw new AppError(409, "This delivery is no longer available");
  profile.activeOrder = order.id;
  await profile.save();
  await notifyOrderParticipants(order);
  res.json({ success: true, data: { order } });
}

export async function updateDeliveryStatus(req, res) {
  const profile = await profileFor(req.user.id);
  const order = await Order.findOne({ _id: req.validated.params.orderId, assignedRider: profile?.id });
  if (!order) throw new AppError(404, "Assigned delivery not found");
  const status = req.validated.body.status;
  if ((status === "out_for_delivery" && order.status !== "ready_for_pickup") || (status === "delivered" && order.status !== "out_for_delivery")) throw new AppError(409, "Complete delivery steps in order");
  applyOrderStatus(order, status);
  await order.save();
  if (status === "delivered") await settleDeliveredOrder(order);
  await notifyOrderParticipants(order);
  res.json({ success: true, data: { order } });
}
