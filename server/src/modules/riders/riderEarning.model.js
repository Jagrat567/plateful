import mongoose from "mongoose";

const riderEarningSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: "RiderProfile", required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  type: { type: String, enum: ["delivery", "restaurant_referral"], required: true },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["earned", "paid"], default: "earned" },
}, { timestamps: true });

riderEarningSchema.index({ order: 1, type: 1, rider: 1 }, { unique: true });
export const RiderEarning = mongoose.model("RiderEarning", riderEarningSchema);
