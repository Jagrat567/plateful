import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "MenuCategory", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, required: true, trim: true, maxlength: 300 },
  price: { type: Number, required: true, min: 1 },
  imageUrl: { type: String, default: "", trim: true },
  imagePublicId: { type: String, default: "", select: false },
  foodType: { type: String, enum: ["veg", "nonVeg", "vegan"], required: true },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
