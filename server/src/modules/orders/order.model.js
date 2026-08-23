import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  idempotencyKey: { type: String, required: true, unique: true, select: false },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  restaurantSnapshot: { name: { type: String, required: true }, contactPhone: String },
  items: [{ menuItem: mongoose.Schema.Types.ObjectId, name: { type: String, required: true }, description: String, imageUrl: String, foodType: String, unitPrice: { type: Number, required: true }, quantity: { type: Number, required: true }, lineTotal: { type: Number, required: true } }],
  deliveryAddress: { label: String, recipientName: String, phone: String, line1: String, area: String, city: String, state: String, postalCode: String, instructions: String },
  pricing: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    deliveryFee: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  deliveryDistanceKm: { type: Number, default: 1, min: 0.1, max: 50 },
  chargeableDeliveryKm: { type: Number, default: 0, min: 0 },
  restaurantOrderNumber: { type: Number, default: 1, min: 1 },
  assignedRider: { type: mongoose.Schema.Types.ObjectId, ref: "RiderProfile", default: null, index: true },
  deliveryAcceptedAt: { type: Date, default: null },
  financials: {
    restaurantCommissionApplied: { type: Boolean, default: false },
    restaurantCommissionRate: { type: Number, default: 0 },
    restaurantCommissionAmount: { type: Number, default: 0 },
    riderReferralShareRate: { type: Number, default: 0 },
    riderReferralEarning: { type: Number, default: 0 },
    riderDeliveryEarning: { type: Number, default: 0 },
    settledAt: { type: Date, default: null },
  },
  paymentMethod: { type: String, enum: ["cash_on_delivery", "online"], default: "cash_on_delivery" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  status: { type: String, enum: ["placed", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "cancelled"], default: "placed", index: true },
  statusHistory: [{ status: { type: String, required: true }, changedAt: { type: Date, default: Date.now } }],
  simulationEnabled: { type: Boolean, default: true },
  nextStatusUpdateAt: { type: Date, default: null, index: true },
  cancellationReason: { type: String, default: "", maxlength: 300 },
  cancelledBy: { type: String, enum: ["", "customer", "restaurant", "admin"], default: "" },
}, { timestamps: true });

export const Order = mongoose.model("Order", orderSchema);
