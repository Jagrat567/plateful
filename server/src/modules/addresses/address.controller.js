import { Address } from "./address.model.js";
import { AppError } from "../../utils/AppError.js";

export async function listAddresses(req, res) {
  const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, data: { addresses } });
}
export async function createAddress(req, res) {
  const count = await Address.countDocuments({ user: req.user.id });
  const isDefault = req.validated.body.isDefault || count === 0;
  if (isDefault) await Address.updateMany({ user: req.user.id }, { $set: { isDefault: false } });
  const address = await Address.create({ ...req.validated.body, isDefault, user: req.user.id });
  res.status(201).json({ success: true, data: { address } });
}
export async function updateAddress(req, res) {
  const address = await Address.findOne({ _id: req.validated.params.addressId, user: req.user.id });
  if (!address) throw new AppError(404, "Address not found");
  if (req.validated.body.isDefault) await Address.updateMany({ user: req.user.id }, { $set: { isDefault: false } });
  Object.assign(address, req.validated.body);
  await address.save();
  res.json({ success: true, data: { address } });
}
export async function deleteAddress(req, res) {
  const address = await Address.findOneAndDelete({ _id: req.validated.params.addressId, user: req.user.id });
  if (!address) throw new AppError(404, "Address not found");
  if (address.isDefault) {
    const replacement = await Address.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (replacement) { replacement.isDefault = true; await replacement.save(); }
  }
  res.status(204).send();
}
