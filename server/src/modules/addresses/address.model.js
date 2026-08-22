import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  label: { type: String, enum: ["home", "work", "other"], default: "home" },
  recipientName: { type: String, required: true, trim: true, maxlength: 60 },
  phone: { type: String, required: true, trim: true },
  line1: { type: String, required: true, trim: true, maxlength: 120 },
  area: { type: String, required: true, trim: true, maxlength: 80 },
  city: { type: String, required: true, trim: true, maxlength: 60 },
  state: { type: String, required: true, trim: true, maxlength: 60 },
  postalCode: { type: String, required: true, trim: true, maxlength: 10 },
  instructions: { type: String, default: "", trim: true, maxlength: 200 },
  location: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], default: [0, 0] } },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });
addressSchema.index({ location: "2dsphere" });
export const Address = mongoose.model("Address", addressSchema);
