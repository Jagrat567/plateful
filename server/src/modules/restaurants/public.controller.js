import mongoose from "mongoose";
import { Restaurant } from "./restaurant.model.js";
import { MenuCategory } from "../menu/menuCategory.model.js";
import { MenuItem } from "../menu/menuItem.model.js";
import { AppError } from "../../utils/AppError.js";

function safeRegex(value = "") { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export async function listRestaurants(req, res) {
  const { search = "", cuisine = "", foodType = "", sort = "rating", page = "1", limit = "12", openNow = "false" } = req.query;
  const filter = { status: "approved", isAcceptingOrders: true };
  const searchTerm = search.trim();
  const regex = searchTerm ? new RegExp(safeRegex(searchTerm), "i") : null;
  const matchingMenuItems = regex ? await MenuItem.find({ isAvailable: true, ...(foodType ? { foodType } : {}), $or: [{ name: regex }, { description: regex }] }).limit(200) : [];
  const matchingRestaurantIds = matchingMenuItems.map((item) => item.restaurant);
  if (regex) filter.$or = [{ name: regex }, { cuisines: regex }, { description: regex }, { _id: { $in: matchingRestaurantIds } }];
  if (cuisine) filter.cuisines = new RegExp(`^${safeRegex(cuisine)}$`, "i");
  if (foodType) {
    const foodTypeRestaurantIds = await MenuItem.distinct("restaurant", { foodType, isAvailable: true });
    filter.$and = [...(filter.$and ?? []), { _id: { $in: foodTypeRestaurantIds } }];
  }
  const currentTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (openNow === "true") { filter.openingTime = { $lte: currentTime }; filter.closingTime = { $gte: currentTime }; }
  const pageNumber = Math.max(1, Number(page) || 1); const pageSize = Math.min(30, Math.max(1, Number(limit) || 12));
  const sortMap = { rating: { rating: -1, createdAt: -1 }, deliveryTime: { estimatedDeliveryMinutes: 1 }, deliveryFee: { deliveryFee: 1 }, newest: { createdAt: -1 } };
  const [restaurants, total] = await Promise.all([Restaurant.find(filter).sort(sortMap[sort] ?? sortMap.rating).skip((pageNumber - 1) * pageSize).limit(pageSize), Restaurant.countDocuments(filter)]);
  const enriched = restaurants.map((restaurant) => ({ ...restaurant.toObject(), isOpenNow: restaurant.openingTime <= currentTime && restaurant.closingTime >= currentTime }));
  const visibleRestaurantIds = new Set(enriched.map((restaurant) => String(restaurant._id)));
  const restaurantNames = new Map(enriched.map((restaurant) => [String(restaurant._id), restaurant.name]));
  const matchedItems = matchingMenuItems.filter((item) => visibleRestaurantIds.has(String(item.restaurant))).map((item) => ({ ...item.toObject(), restaurant: { _id: item.restaurant, name: restaurantNames.get(String(item.restaurant)) } }));
  res.json({ success: true, data: { restaurants: enriched, matchedItems, query: searchTerm, pagination: { page: pageNumber, limit: pageSize, total, pages: Math.ceil(total / pageSize) } } });
}

export async function getRestaurant(req, res) {
  if (!mongoose.isValidObjectId(req.params.restaurantId)) throw new AppError(400, "Invalid restaurant identifier");
  const restaurant = await Restaurant.findOne({ _id: req.params.restaurantId, status: "approved" });
  if (!restaurant) throw new AppError(404, "Restaurant not found");
  const [categories, items] = await Promise.all([
    MenuCategory.find({ restaurant: restaurant.id }).sort({ displayOrder: 1 }),
    MenuItem.find({ restaurant: restaurant.id, isAvailable: true }).sort({ createdAt: -1 }),
  ]);
  res.json({ success: true, data: { restaurant, categories, items } });
}
