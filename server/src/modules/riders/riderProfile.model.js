import mongoose from "mongoose";

const riderProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "suspended"], default: "pending", index: true },
  rejectionReason: { type: String, default: "", maxlength: 300 },
  vehicleType: { type: String, enum: ["bicycle", "motorcycle", "scooter", "car"], required: true },
  vehicleNumber: { type: String, default: "", trim: true, maxlength: 30 },
  drivingLicenseNumber: { type: String, default: "", trim: true, maxlength: 40 },
  city: { type: String, required: true, trim: true, maxlength: 60 },
  serviceAreas: [{ type: String, trim: true, maxlength: 80 }],
  upiId: { type: String, required: true, trim: true, maxlength: 100 },
  emergencyContact: { type: String, required: true, trim: true },
  isAvailable: { type: Boolean, default: false },
  activeOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  completedDeliveries: { type: Number, default: 0, min: 0 },
  referredRestaurants: { type: Number, default: 0, min: 0 },
  deliveryEarnings: { type: Number, default: 0, min: 0 },
  referralEarnings: { type: Number, default: 0, min: 0 },
  totalEarnings: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

export const RiderProfile = mongoose.model("RiderProfile", riderProfileSchema);
