import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { useGetOrdersQuery } from "../../app/api.js";

const statusText = (status) => status.replaceAll("_", " ");

export function OrdersPage() {
  const user = useSelector((state) => state.auth.user);
  const { data, isLoading } = useGetOrdersQuery(undefined, { skip: !user });
  if (!user) return <Navigate to="/login" replace/>;
  if (isLoading) return <main className="page-state tall">Loading your orders…</main>;
  const orders = data?.data.orders ?? [];
  return <main className="orders-page"><span className="kicker">Your food journey</span><h1>My orders</h1>{orders.length === 0 ? <div className="empty-orders"><span>🧾</span><h2>No orders yet</h2><p>Your first delicious delivery is only a few clicks away.</p><Link to="/restaurants">Find food</Link></div> : <div className="order-list">{orders.map((order) => <Link to={`/orders/${order._id}`} key={order._id}><div><span className={`order-status ${order.status}`}>{statusText(order.status)}</span><h2>{order.restaurantSnapshot.name}</h2><p>{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</p><small>{new Date(order.createdAt).toLocaleString()} · {order.orderNumber}</small></div><div><b>₹{order.pricing.total.toFixed(2)}</b><span>Track order →</span></div></Link>)}</div>}</main>;
}
