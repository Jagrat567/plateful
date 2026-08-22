export const orderSequence = ["placed", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered"];
export function nextOrderStatus(status) { return orderSequence[orderSequence.indexOf(status) + 1]; }
export function applyOrderStatus(order, status, changedAt = new Date()) {
  order.status = status;
  order.statusHistory.push({ status, changedAt });
  if (status === "delivered") { order.paymentStatus = "paid"; order.simulationEnabled = false; order.nextStatusUpdateAt = null; }
  return order;
}
