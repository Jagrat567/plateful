import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
export async function sendEmail({ to, subject, html }) {
  if (!resend) { if (env.NODE_ENV === "development") console.log(`Email skipped (not configured): ${subject} -> ${to}`); return false; }
  await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  return true;
}
export const welcomeEmail = (user) => sendEmail({ to: user.email, subject: "Welcome to Plateful", html: `<h1>Welcome, ${user.name}!</h1><p>Your Plateful account is ready. Your next favourite meal is waiting.</p>` });
export const orderEmail = (user, order, title) => sendEmail({ to: user.email, subject: `${title} · ${order.orderNumber}`, html: `<h1>${title}</h1><p>Your order from <strong>${order.restaurantSnapshot.name}</strong> totals ₹${order.pricing.total.toFixed(2)}.</p><p><a href="${env.APP_URL}/orders/${order.id}">View your order</a></p>` });
export const restaurantDecisionEmail = (owner, restaurant) => sendEmail({ to: owner.email, subject: `${restaurant.name} application ${restaurant.status}`, html: `<h1>Your restaurant application is ${restaurant.status}</h1><p>${restaurant.status === "rejected" ? restaurant.rejectionReason : "You can now configure your storefront and begin accepting orders."}</p>` });
