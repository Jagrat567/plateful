import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { API_ORIGIN } from "../../app/config.js";
import { useCancelOrderMutation, useCreateReviewMutation, useGetOrderQuery, useReorderMutation } from "../../app/api.js";

const steps = ["placed", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered"];
const labels = { placed: "Order placed", confirmed: "Restaurant confirmed", preparing: "Preparing your food", ready_for_pickup: "Ready for pickup", out_for_delivery: "Out for delivery", delivered: "Delivered" };

export function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useSelector((state) => state.auth);
  const { data, isLoading, error, refetch } = useGetOrderQuery(orderId, { skip: !user });
  const [cancelOrder] = useCancelOrderMutation();
  const [reorder] = useReorderMutation();
  const [createReview, reviewState] = useCreateReviewMutation();
  const [review, setReview] = useState({ rating: 5, foodRating: 5, comment: "" });
  useEffect(() => {
    if (!accessToken) return undefined;
    const socket = io(API_ORIGIN, { auth: { token: accessToken } });
    socket.on("order:updated", (order) => { if (order._id === orderId) refetch(); });
    return () => socket.disconnect();
  }, [accessToken, orderId, refetch]);
  if (!user) return <Navigate to="/login" replace/>;
  if (isLoading) return <main className="page-state tall">Locating your order…</main>;
  if (error) return <main className="page-state tall error">Order not found.</main>;
  const order = data.data.order;
  const currentIndex = steps.indexOf(order.status);
  const cancel = async () => { const reason = window.prompt("Why are you cancelling this order?"); if (reason) await cancelOrder({id:order._id,reason}); };
  const reorderNow = async (replaceCart=false) => { try { await reorder({id:order._id,replaceCart}).unwrap(); navigate("/cart"); } catch (reorderError) { if (reorderError?.status===409 && reorderError?.data?.message?.includes("another restaurant") && window.confirm("Replace your current cart?")) reorderNow(true); } };
  const submitReview = async (event) => { event.preventDefault(); try { await createReview({orderId:order._id,...review}).unwrap(); setReview({...review,comment:""}); } catch { /* shown below */ } };
  return <main className="tracking-page"><section className="tracking-hero"><Link to="/orders">← All orders</Link><span className="live-pill"><i/> LIVE ORDER</span><h1>{labels[order.status] ?? order.status}</h1><p>{order.restaurantSnapshot.name} · {order.orderNumber}</p>{order.nextStatusUpdateAt && <small>Next update around {new Date(order.nextStatusUpdateAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</small>}<div className="tracking-actions">{["placed","confirmed"].includes(order.status) && <button onClick={cancel}>Cancel order</button>}<button onClick={() => reorderNow()}>Reorder</button><button onClick={() => window.print()}>Print receipt</button></div></section><div className="tracking-layout"><section><div className="tracking-card"><h2>Order progress</h2><div className="status-timeline">{steps.map((step, index) => <div className={index <= currentIndex ? "complete" : ""} key={step}><span>{index < currentIndex ? "✓" : index === currentIndex ? "●" : ""}</span><div><b>{labels[step]}</b><small>{order.statusHistory.find((history) => history.status === step) ? new Date(order.statusHistory.find((history) => history.status === step).changedAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "Waiting"}</small></div></div>)}</div></div>{order.status === "delivered" && <form className="review-form" onSubmit={submitReview}><h2>How was your order?</h2><div><label>Overall<select value={review.rating} onChange={(e)=>setReview({...review,rating:Number(e.target.value)})}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} stars</option>)}</select></label><label>Food<select value={review.foodRating} onChange={(e)=>setReview({...review,foodRating:Number(e.target.value)})}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} stars</option>)}</select></label></div><textarea value={review.comment} onChange={(e)=>setReview({...review,comment:e.target.value})} placeholder="Tell others what you enjoyed" required minLength="5"/>{reviewState.error && <div className="owner-error">{reviewState.error.data?.message}</div>}<button>Submit review</button></form>}</section><aside className="tracking-details"><h2>Order details</h2>{order.items.map((item) => <div className="tracking-item" key={item._id}><span>{item.quantity} × {item.name}</span><b>₹{item.lineTotal.toFixed(2)}</b></div>)}<hr/><div><span>Delivery · {order.deliveryDistanceKm?.toFixed(1) ?? "1.0"} km</span><b>₹{(order.pricing.deliveryFee ?? 0).toFixed(2)}</b></div><div><span>Platform fee</span><b>₹{(order.pricing.platformFee ?? 0).toFixed(2)}</b></div><div><span>Total</span><b>₹{order.pricing.total.toFixed(2)}</b></div><div><span>Payment</span><b>{order.paymentStatus === "paid" ? "Paid" : "Cash on delivery"}</b></div><hr/><h3>Delivering to</h3><p>{order.deliveryAddress.recipientName}<br/>{order.deliveryAddress.line1}, {order.deliveryAddress.area}<br/>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p></aside></div></main>;
}
