import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["customer", "restaurantOwner", "admin"], default: "customer" },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  refreshTokenHash: { type: String, select: false, default: null },
  favoriteRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
  passwordResetTokenHash: { type: String, default: null, select: false },
  passwordResetExpiresAt: { type: Date, default: null, select: false },
}, { timestamps: true });

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return { id: this.id, name: this.name, email: this.email, phone: this.phone, role: this.role };
};

export const User = mongoose.model("User", userSchema);
