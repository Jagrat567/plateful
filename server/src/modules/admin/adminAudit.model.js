import mongoose from "mongoose";
const auditSchema = new mongoose.Schema({ admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, action: { type: String, required: true }, targetType: { type: String, required: true }, targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, details: { type: mongoose.Schema.Types.Mixed, default: {} } }, { timestamps: true });
export const AdminAudit = mongoose.model("AdminAudit", auditSchema);
