import { Cart } from "./cart.model.js";
import { MenuItem } from "../menu/menuItem.model.js";
import { Restaurant } from "../restaurants/restaurant.model.js";
import { Order } from "../orders/order.model.js";
import { AppError } from "../../utils/AppError.js";

async function cartResponse(userId) {
  const cart = await Cart.findOne({ user: userId }).populate("restaurant", "name deliveryFee minimumOrder estimatedDeliveryMinutes isAcceptingOrders status").populate("items.menuItem", "name description price imageUrl foodType isAvailable restaurant");
  if (!cart) return { cart: null, subtotal: 0, discount: 0, couponCode: "", deliveryFee: 0, total: 0, itemCount: 0 };
  const validItems = cart.items.filter((entry) => entry.menuItem);
  const subtotal = validItems.reduce((sum, entry) => sum + entry.menuItem.price * entry.quantity, 0);
  const itemCount = validItems.reduce((sum, entry) => sum + entry.quantity, 0);
  const deliveryFee = cart.restaurant?.deliveryFee ?? 0;
  const previousOrder = await Order.exists({ customer: userId, status: { $ne: "cancelled" } });
  const discount = previousOrder ? 0 : Number((subtotal * 0.5).toFixed(2));
  return { cart, subtotal, discount, couponCode: discount ? "FIRST50" : "", deliveryFee, total: subtotal - discount + deliveryFee, itemCount };
}

export async function getCart(req, res) { res.json({ success: true, data: await cartResponse(req.user.id) }); }

export async function addCartItem(req, res) {
  const { menuItemId, quantity, replaceCart } = req.validated.body;
  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem || !menuItem.isAvailable) throw new AppError(409, "This menu item is currently unavailable");
  const restaurant = await Restaurant.findOne({ _id: menuItem.restaurant, status: "approved", isAcceptingOrders: true });
  if (!restaurant) throw new AppError(409, "This restaurant is not accepting orders");
  let cart = await Cart.findOne({ user: req.user.id });
  if (cart && String(cart.restaurant) !== String(restaurant.id)) {
    if (!replaceCart) throw new AppError(409, "Your cart contains items from another restaurant. Clear it to continue.");
    cart.restaurant = restaurant.id;
    cart.items = [];
  }
  if (!cart) cart = new Cart({ user: req.user.id, restaurant: restaurant.id, items: [] });
  const existing = cart.items.find((entry) => String(entry.menuItem) === String(menuItem.id));
  if (existing) existing.quantity = Math.min(20, existing.quantity + quantity);
  else cart.items.push({ menuItem: menuItem.id, quantity });
  await cart.save();
  res.status(201).json({ success: true, data: await cartResponse(req.user.id) });
}

export async function updateCartItem(req, res) {
  const cart = await Cart.findOne({ user: req.user.id });
  const entry = cart?.items.id(req.validated.params.cartItemId);
  if (!entry) throw new AppError(404, "Cart item not found");
  entry.quantity = req.validated.body.quantity;
  await cart.save();
  res.json({ success: true, data: await cartResponse(req.user.id) });
}

export async function removeCartItem(req, res) {
  const cart = await Cart.findOne({ user: req.user.id });
  const entry = cart?.items.id(req.validated.params.cartItemId);
  if (!entry) throw new AppError(404, "Cart item not found");
  entry.deleteOne();
  if (cart.items.length === 0) await cart.deleteOne(); else await cart.save();
  res.json({ success: true, data: await cartResponse(req.user.id) });
}

export async function clearCart(req, res) {
  await Cart.deleteOne({ user: req.user.id });
  res.status(204).send();
}
