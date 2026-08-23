import { Restaurant } from "../restaurants/restaurant.model.js";
import { AppError } from "../../utils/AppError.js";
import { User } from "../users/user.model.js";
import { Order } from "../orders/order.model.js";
import { Review } from "../reviews/review.model.js";
import { refreshRestaurantRating } from "../reviews/review.controller.js";
import { AdminAudit } from "./adminAudit.model.js";
import { restaurantDecisionEmail } from "../../services/email.service.js";
import { RiderProfile } from "../riders/riderProfile.model.js";
import { RestaurantLead } from "../riders/restaurantLead.model.js";
import { RiderEarning } from "../riders/riderEarning.model.js";

export async function listApplications(req, res) {
  const [restaurants, counts] = await Promise.all([
    Restaurant.find({ status: { $in: ["pending", "approved", "rejected", "suspended"] } }).populate("owner", "name email phone").sort({ createdAt: -1 }),
    Restaurant.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  const stats = Object.fromEntries(counts.map(({ _id, count }) => [_id, count]));
  res.json({ success: true, data: { restaurants, stats } });
}

export async function reviewRestaurant(req, res) {
  const { status, reason } = req.validated.body;
  const restaurant = await Restaurant.findById(req.validated.params.restaurantId);
  if (!restaurant) throw new AppError(404, "Restaurant application not found");
  if (restaurant.status !== "pending") throw new AppError(409, "This application has already been reviewed");
  restaurant.status = status;
  restaurant.rejectionReason = status === "rejected" ? reason : "";
  restaurant.isAcceptingOrders = false;
  await restaurant.save();
  await AdminAudit.create({ admin: req.user.id, action: `restaurant_${status}`, targetType: "restaurant", targetId: restaurant.id, details: { reason } });
  await restaurant.populate("owner", "name email phone");
  restaurantDecisionEmail(restaurant.owner, restaurant).catch((error) => console.error("Restaurant decision email failed", error));
  res.json({ success: true, data: { restaurant } });
}

export async function listUsers(req, res) {
  const users = await User.find({}).sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: { users } });
}
export async function updateUserStatus(req, res) {
  if (req.validated.params.userId === req.user.id) throw new AppError(409, "You cannot suspend your own account");
  const user = await User.findById(req.validated.params.userId);
  if (!user) throw new AppError(404, "User not found");
  if (user.role === "admin") throw new AppError(409, "Administrator accounts cannot be suspended here");
  user.status = req.validated.body.status;
  await user.save({ validateModifiedOnly: true });
  if (user.role === "restaurantOwner" && user.status === "suspended") {
    await Restaurant.updateOne({ owner: user.id }, { status: "suspended", isAcceptingOrders: false });
  }
  if (user.role === "rider" && user.status === "suspended") await RiderProfile.updateOne({ user: user.id }, { status: "suspended", isAvailable: false });
  await AdminAudit.create({ admin: req.user.id, action: `user_${user.status}`, targetType: "user", targetId: user.id });
  res.json({ success: true, data: { user } });
}
export async function listAllOrders(req, res) {
  const filter = req.query.status ? { status: req.query.status } : {};
  const orders = await Order.find(filter).populate("customer", "name email phone").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: { orders } });
}
export async function operateRestaurant(req, res) {
  const restaurant = await Restaurant.findById(req.validated.params.restaurantId);
  if (!restaurant) throw new AppError(404, "Restaurant not found");
  restaurant.status = req.validated.body.status;
  if (restaurant.status === "suspended") restaurant.isAcceptingOrders = false;
  await restaurant.save();
  await AdminAudit.create({ admin: req.user.id, action: `restaurant_${restaurant.status}`, targetType: "restaurant", targetId: restaurant.id });
  res.json({ success: true, data: { restaurant } });
}
export async function listReviews(req, res) {
  const reviews = await Review.find({}).populate("customer", "name email").populate("restaurant", "name").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: { reviews } });
}
export async function moderateReview(req, res) {
  const review = await Review.findByIdAndUpdate(req.validated.params.reviewId, { status: req.validated.body.status }, { new: true });
  if (!review) throw new AppError(404, "Review not found");
  await refreshRestaurantRating(review.restaurant);
  await AdminAudit.create({ admin: req.user.id, action: `review_${review.status}`, targetType: "review", targetId: review.id });
  res.json({ success: true, data: { review } });
}
export async function listAudit(req, res) {
  const audits = await AdminAudit.find({}).populate("admin", "name email").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, data: { audits } });
}

export async function listRiders(req, res) {
  const [riders, leads, earnings] = await Promise.all([
    RiderProfile.find({}).populate("user", "name email phone role").sort({ createdAt: -1 }),
    RestaurantLead.find({}).populate({ path: "rider", populate: { path: "user", select: "name email phone" } }).sort({ createdAt: -1 }),
    RiderEarning.find({}).populate({ path: "rider", populate: { path: "user", select: "name email phone" } }).populate("restaurant", "name").sort({ createdAt: -1 }).limit(300),
  ]);
  res.json({ success: true, data: { riders, leads, earnings } });
}

export async function reviewRider(req, res) {
  const rider = await RiderProfile.findById(req.validated.params.riderId).populate("user");
  if (!rider) throw new AppError(404, "Rider application not found");
  rider.status = req.validated.body.status; rider.rejectionReason = req.validated.body.status === "rejected" ? req.validated.body.reason : "";
  rider.isAvailable = false; await rider.save();
  if (rider.status === "approved") { rider.user.role = "rider"; await rider.user.save({ validateModifiedOnly: true }); }
  await AdminAudit.create({ admin: req.user.id, action: `rider_${rider.status}`, targetType: "rider", targetId: rider.id, details: { reason: req.validated.body.reason } });
  res.json({ success: true, data: { rider } });
}

export async function reviewRestaurantLead(req, res) {
  const lead = await RestaurantLead.findById(req.validated.params.leadId);
  if (!lead) throw new AppError(404, "Restaurant lead not found");
  lead.status = req.validated.body.status; lead.rejectionReason = lead.status === "rejected" ? req.validated.body.reason : ""; await lead.save();
  await AdminAudit.create({ admin: req.user.id, action: `restaurant_lead_${lead.status}`, targetType: "restaurantLead", targetId: lead.id, details: { reason: req.validated.body.reason } });
  res.json({ success: true, data: { lead } });
}

export async function markRiderEarningPaid(req, res) {
  const earning = await RiderEarning.findById(req.validated.params.earningId);
  if (!earning) throw new AppError(404, "Rider earning not found");
  earning.status = "paid"; await earning.save();
  await AdminAudit.create({ admin: req.user.id, action: "rider_earning_paid", targetType: "riderEarning", targetId: earning.id, details: { amount: earning.amount } });
  res.json({ success: true, data: { earning } });
}
