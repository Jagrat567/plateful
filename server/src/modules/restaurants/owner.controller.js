import { Restaurant } from "./restaurant.model.js";
import { MenuCategory } from "../menu/menuCategory.model.js";
import { MenuItem } from "../menu/menuItem.model.js";
import { AppError } from "../../utils/AppError.js";
import { deleteImage } from "../../config/cloudinary.js";

async function ownerRestaurant(userId) {
  const restaurant = await Restaurant.findOne({ owner: userId });
  if (!restaurant) throw new AppError(404, "Complete restaurant onboarding first");
  return restaurant;
}

export async function createRestaurant(req, res) {
  if (await Restaurant.exists({ owner: req.user.id })) throw new AppError(409, "You already have a restaurant application");
  const restaurant = await Restaurant.create({ ...req.validated.body, isAcceptingOrders: false, owner: req.user.id });
  if (req.user.role === "customer") {
    req.user.role = "restaurantOwner";
    await req.user.save({ validateModifiedOnly: true });
  }
  res.status(201).json({ success: true, data: { restaurant, user: req.user.toPublicJSON() } });
}

export async function getOwnerRestaurant(req, res) {
  const restaurant = await ownerRestaurant(req.user.id);
  res.json({ success: true, data: { restaurant } });
}

export async function updateRestaurant(req, res) {
  const restaurant = await ownerRestaurant(req.user.id);
  if (req.validated.body.isAcceptingOrders && restaurant.status !== "approved") throw new AppError(409, "Your restaurant must be approved before accepting orders");
  Object.assign(restaurant, req.validated.body);
  await restaurant.save();
  res.json({ success: true, data: { restaurant } });
}

export async function getMenu(req, res) {
  const restaurant = await ownerRestaurant(req.user.id);
  const [categories, items] = await Promise.all([
    MenuCategory.find({ restaurant: restaurant.id }).sort({ displayOrder: 1, createdAt: 1 }),
    MenuItem.find({ restaurant: restaurant.id }).sort({ createdAt: -1 }),
  ]);
  res.json({ success: true, data: { categories, items } });
}

export async function createCategory(req, res) {
  const restaurant = await ownerRestaurant(req.user.id);
  const category = await MenuCategory.create({ ...req.validated.body, restaurant: restaurant.id });
  res.status(201).json({ success: true, data: { category } });
}

export async function deleteCategory(req, res) {
  const restaurant = await ownerRestaurant(req.user.id);
  const category = await MenuCategory.findOne({ _id: req.validated.params.categoryId, restaurant: restaurant.id });
  if (!category) throw new AppError(404, "Menu category not found");
  if (await MenuItem.exists({ category: category.id })) throw new AppError(409, "Move or delete this category’s items first");
  await category.deleteOne();
  res.status(204).send();
}

export async function createItem(req, res) {
  const restaurant = await ownerRestaurant(req.user.id);
  const { categoryId, ...fields } = req.validated.body;
  const category = await MenuCategory.findOne({ _id: categoryId, restaurant: restaurant.id });
  if (!category) throw new AppError(400, "Choose a valid menu category");
  const item = await MenuItem.create({ ...fields, category: category.id, restaurant: restaurant.id });
  res.status(201).json({ success: true, data: { item } });
}

export async function updateItem(req, res) {
  const restaurant = await ownerRestaurant(req.user.id);
  const { categoryId, ...fields } = req.validated.body;
  if (categoryId) {
    const category = await MenuCategory.findOne({ _id: categoryId, restaurant: restaurant.id });
    if (!category) throw new AppError(400, "Choose a valid menu category");
    fields.category = category.id;
  }
  const previousItem = await MenuItem.findOne({ _id: req.validated.params.itemId, restaurant: restaurant.id }).select("+imagePublicId");
  if (!previousItem) throw new AppError(404, "Menu item not found");
  const oldImagePublicId = previousItem.imagePublicId;
  const item = await MenuItem.findOneAndUpdate({ _id: previousItem.id, restaurant: restaurant.id }, fields, { new: true, runValidators: true });
  if (!item) throw new AppError(404, "Menu item not found");
  if (fields.imagePublicId && oldImagePublicId && fields.imagePublicId !== oldImagePublicId) deleteImage(oldImagePublicId).catch((error) => console.error("Cloudinary cleanup failed", error));
  res.json({ success: true, data: { item } });
}

export async function deleteItem(req, res) {
  const restaurant = await ownerRestaurant(req.user.id);
  const item = await MenuItem.findOneAndDelete({ _id: req.validated.params.itemId, restaurant: restaurant.id }).select("+imagePublicId");
  if (!item) throw new AppError(404, "Menu item not found");
  deleteImage(item.imagePublicId).catch((error) => console.error("Cloudinary cleanup failed", error));
  res.status(204).send();
}
