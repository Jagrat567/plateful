import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  items: [{ menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true }, quantity: { type: Number, required: true, min: 1, max: 20 } }],
}, { timestamps: true });
export const Cart = mongoose.model("Cart", cartSchema);
