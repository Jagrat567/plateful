import { Review } from "./review.model.js";
import { Order } from "../orders/order.model.js";
import { Restaurant } from "../restaurants/restaurant.model.js";
import { AppError } from "../../utils/AppError.js";

export async function refreshRestaurantRating(restaurantId) {
  const [stats] = await Review.aggregate([{ $match: { restaurant: restaurantId, status: "visible" } }, { $group: { _id: null, rating: { $avg: "$rating" }, count: { $sum: 1 } } }]);
  await Restaurant.updateOne({ _id: restaurantId }, { $set: { rating: stats ? Math.round(stats.rating * 10) / 10 : 0, ratingCount: stats?.count ?? 0 } });
}
export async function createReview(req, res) {
  const order = await Order.findOne({ _id: req.validated.body.orderId, customer: req.user.id });
  if (!order) throw new AppError(404, "Order not found");
  if (order.status !== "delivered") throw new AppError(409, "You can review an order after delivery");
  if (await Review.exists({ order: order.id })) throw new AppError(409, "This order has already been reviewed");
  const review = await Review.create({ ...req.validated.body, customer: req.user.id, restaurant: order.restaurant, order: order.id });
  await refreshRestaurantRating(order.restaurant);
  res.status(201).json({ success: true, data: { review } });
}
export async function listRestaurantReviews(req, res) {
  const reviews = await Review.find({ restaurant: req.params.restaurantId, status: "visible" }).populate("customer", "name").sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: { reviews } });
}
