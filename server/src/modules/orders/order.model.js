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
    total: { type: Number, required: true },
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
