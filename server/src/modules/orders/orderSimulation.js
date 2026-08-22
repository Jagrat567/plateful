import { env } from "../../config/env.js";
import { emitToUser } from "../../socket.js";
import { Order } from "./order.model.js";
import { applyOrderStatus, nextOrderStatus } from "./orderStatus.js";
import { User } from "../users/user.model.js";
import { orderEmail } from "../../services/email.service.js";

let timer;
let processing = false;

async function processDueOrders() {
  if (processing || !env.ORDER_SIMULATION_ENABLED) return;
  processing = true;
  try {
    const orders = await Order.find({ simulationEnabled: true, nextStatusUpdateAt: { $lte: new Date() }, status: { $nin: ["delivered", "cancelled"] } }).limit(100);
    for (const order of orders) {
      let nextDue = order.nextStatusUpdateAt;
      while (nextDue && nextDue <= new Date() && !["delivered", "cancelled"].includes(order.status)) {
        const nextStatus = nextOrderStatus(order.status);
        if (!nextStatus) break;
        applyOrderStatus(order, nextStatus, nextDue);
        if (nextStatus === "delivered") {
          order.paymentStatus = "paid";
          order.nextStatusUpdateAt = null;
          order.simulationEnabled = false;
          nextDue = null;
        } else {
          nextDue = new Date(nextDue.getTime() + env.ORDER_STATUS_INTERVAL_MS);
          order.nextStatusUpdateAt = nextDue;
        }
      }
      await order.save();
      emitToUser(order.customer, "order:updated", order);
      if (order.status === "delivered") {
        const customer = await User.findById(order.customer);
        if (customer) orderEmail(customer, order, "Order delivered").catch((error) => console.error("Delivery email failed", error));
      }
    }
  } catch (error) { console.error("Order simulation failed", error); }
  finally { processing = false; }
}

export function startOrderSimulation() {
  if (!env.ORDER_SIMULATION_ENABLED) return;
  processDueOrders();
  timer = setInterval(processDueOrders, Math.min(5000, env.ORDER_STATUS_INTERVAL_MS));
  timer.unref();
}

export function stopOrderSimulation() { if (timer) clearInterval(timer); }
