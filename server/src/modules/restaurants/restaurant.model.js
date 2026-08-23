import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  referredByRider: { type: mongoose.Schema.Types.ObjectId, ref: "RiderProfile", default: null, index: true },
  referralLead: { type: mongoose.Schema.Types.ObjectId, ref: "RestaurantLead", default: null },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  cuisines: [{ type: String, trim: true, maxlength: 40 }],
  contactPhone: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: "" },
  imagePublicId: { type: String, default: "", select: false },
  coverImageUrl: { type: String, default: "" },
  coverImagePublicId: { type: String, default: "", select: false },
  address: {
    line1: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  openingTime: { type: String, default: "09:00" },
  closingTime: { type: String, default: "23:00" },
  status: { type: String, enum: ["pending", "approved", "rejected", "suspended"], default: "pending", index: true },
  rejectionReason: { type: String, default: "", maxlength: 300 },
  isAcceptingOrders: { type: Boolean, default: false },
  deliveryFee: { type: Number, default: 30, min: 0 },
  minimumOrder: { type: Number, default: 100, min: 0 },
  estimatedDeliveryMinutes: { type: Number, default: 30, min: 10, max: 180 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },
  orderMode: { type: String, enum: ["simulated", "manual"], default: "simulated" },
  totalOrdersReceived: { type: Number, default: 0, min: 0 },
  totalCommissionCharged: { type: Number, default: 0, min: 0 },
  commissionBalance: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

export const Restaurant = mongoose.model("Restaurant", restaurantSchema);
