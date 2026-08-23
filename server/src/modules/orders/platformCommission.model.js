import mongoose from "mongoose";

const platformCommissionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  orderNumber: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["due", "collected", "waived"], default: "due" },
}, { timestamps: true });

export const PlatformCommission = mongoose.model("PlatformCommission", platformCommissionSchema);
