import { Order } from "./order.model.js";
import { Restaurant } from "../restaurants/restaurant.model.js";
import { RiderProfile } from "../riders/riderProfile.model.js";
import { RiderEarning } from "../riders/riderEarning.model.js";
import { PlatformCommission } from "./platformCommission.model.js";

async function awardRider({ riderId, order, type, amount }) {
  if (!riderId || !Number.isFinite(amount) || amount < 0) return;
  const result = await RiderEarning.updateOne(
    { rider: riderId, order: order.id, type },
    { $setOnInsert: { restaurant: order.restaurant, amount, status: "earned" } },
    { upsert: true },
  );
  if (!result.upsertedCount) return;
  const increments = type === "delivery"
    ? { deliveryEarnings: amount, totalEarnings: amount, completedDeliveries: 1 }
    : { referralEarnings: amount, totalEarnings: amount };
  await RiderProfile.updateOne({ _id: riderId }, { $inc: increments, ...(type === "delivery" ? { $set: { activeOrder: null } } : {}) });
}

export async function settleDeliveredOrder(orderOrId) {
  const order = typeof orderOrId === "string" ? await Order.findById(orderOrId) : orderOrId;
  if (!order || order.status !== "delivered" || order.financials?.settledAt) return order;
  const restaurant = await Restaurant.findById(order.restaurant);
  if (!restaurant) return order;

  if (order.financials.restaurantCommissionApplied && order.financials.restaurantCommissionAmount > 0) {
    const commission = await PlatformCommission.updateOne(
      { order: order.id },
      { $setOnInsert: { restaurant: restaurant.id, orderNumber: order.restaurantOrderNumber, subtotal: order.pricing.subtotal, rate: order.financials.restaurantCommissionRate, amount: order.financials.restaurantCommissionAmount, status: "due" } },
      { upsert: true },
    );
    if (commission.upsertedCount) await Restaurant.updateOne({ _id: restaurant.id }, { $inc: { totalCommissionCharged: order.financials.restaurantCommissionAmount, commissionBalance: order.financials.restaurantCommissionAmount } });
    await awardRider({ riderId: restaurant.referredByRider, order, type: "restaurant_referral", amount: order.financials.riderReferralEarning });
  }
  await awardRider({ riderId: order.assignedRider, order, type: "delivery", amount: order.financials.riderDeliveryEarning });
  order.financials.settledAt = new Date();
  await order.save();
  return order;
}
