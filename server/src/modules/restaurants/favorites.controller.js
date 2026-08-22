import { Restaurant } from "./restaurant.model.js";
import { Order } from "../orders/order.model.js";
import { AppError } from "../../utils/AppError.js";

export async function getFavorites(req, res) {
  await req.user.populate({ path: "favoriteRestaurants", match: { status: "approved" } });
  res.json({ success: true, data: { restaurants: req.user.favoriteRestaurants } });
}
export async function toggleFavorite(req, res) {
  if (!await Restaurant.exists({ _id: req.params.restaurantId, status: "approved" })) throw new AppError(404, "Restaurant not found");
  const exists = req.user.favoriteRestaurants.some((id) => String(id) === req.params.restaurantId);
  if (exists) req.user.favoriteRestaurants.pull(req.params.restaurantId); else req.user.favoriteRestaurants.push(req.params.restaurantId);
  await req.user.save({ validateModifiedOnly: true });
  res.json({ success: true, data: { favorite: !exists } });
}
export async function recentlyOrdered(req, res) {
  const ids = await Order.distinct("restaurant", { customer: req.user.id, status: { $ne: "cancelled" } });
  const restaurants = await Restaurant.find({ _id: { $in: ids }, status: "approved" }).limit(12);
  res.json({ success: true, data: { restaurants } });
}
