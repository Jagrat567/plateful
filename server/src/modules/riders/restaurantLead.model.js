import mongoose from "mongoose";

const restaurantLeadSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: "RiderProfile", required: true, index: true },
  restaurantName: { type: String, required: true, trim: true, maxlength: 100 },
  ownerName: { type: String, required: true, trim: true, maxlength: 60 },
  ownerPhone: { type: String, required: true, trim: true, index: true },
  ownerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
  city: { type: String, required: true, trim: true, maxlength: 60 },
  address: { type: String, required: true, trim: true, maxlength: 200 },
  cuisines: [{ type: String, trim: true, maxlength: 40 }],
  notes: { type: String, default: "", trim: true, maxlength: 500 },
  status: { type: String, enum: ["submitted", "contacted", "approved", "converted", "rejected"], default: "submitted", index: true },
  rejectionReason: { type: String, default: "", maxlength: 300 },
  convertedRestaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", default: null },
}, { timestamps: true });

restaurantLeadSchema.index({ rider: 1, ownerEmail: 1 }, { unique: true });
export const RestaurantLead = mongoose.model("RestaurantLead", restaurantLeadSchema);
