import mongoose from "mongoose";

const menuCategorySchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 50 },
  displayOrder: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

menuCategorySchema.index({ restaurant: 1, name: 1 }, { unique: true });
export const MenuCategory = mongoose.model("MenuCategory", menuCategorySchema);
