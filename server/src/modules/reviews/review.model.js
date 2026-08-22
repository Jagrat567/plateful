import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  foodRating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
  status: { type: String, enum: ["visible", "hidden"], default: "visible", index: true },
}, { timestamps: true });
export const Review = mongoose.model("Review", reviewSchema);
