import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import {
  useGetAdminAuditQuery, useGetAdminOrdersQuery, useGetAdminReviewsQuery, useGetAdminUsersQuery,
  useGetApplicationsQuery, useModerateReviewMutation, useOperateRestaurantMutation,
  useReviewRestaurantMutation, useUpdateAdminUserMutation, useGetAdminRidersQuery,
  useReviewRiderMutation, useReviewRestaurantLeadMutation,
  useMarkRiderEarningPaidMutation,
} from "../../app/api.js";

const errorMessage = (error) => error?.data?.message ?? "Unable to complete that review.";

function AdminOperations() {
  const [tab, setTab] = useState("users");
  const { data: users } = useGetAdminUsersQuery();
  const { data: orders } = useGetAdminOrdersQuery();
  const { data: reviews } = useGetAdminReviewsQuery();
  const { data: audit } = useGetAdminAuditQuery();
  const { data: riderData } = useGetAdminRidersQuery();
  const [updateUser] = useUpdateAdminUserMutation();
  const [moderate] = useModerateReviewMutation();
  const [reviewRider] = useReviewRiderMutation();
  const [reviewLead] = useReviewRestaurantLeadMutation();
  const [markPaid] = useMarkRiderEarningPaidMutation();

  return <section className="admin-operations">
    <div className="admin-operation-tabs">{["users", "riders", "restaurant leads", "payouts", "orders", "reviews", "audit"].map((value) => <button className={tab === value ? "active" : ""} onClick={() => setTab(value)} key={value}>{value}</button>)}</div>
    {tab === "users" && <div className="admin-table">{(users?.data.users ?? []).map((account) => <article key={account._id}>
      <div><b>{account.name}</b><span>{account.email} · {account.role}</span></div>
      {account.role !== "admin" && <button onClick={() => updateUser({ id: account._id, status: account.status === "active" ? "suspended" : "active" })}>{account.status === "active" ? "Suspend account" : "Reactivate account"}</button>}
    </article>)}</div>}
    {tab === "orders" && <div className="admin-table">{(orders?.data.orders ?? []).map((order) => <article key={order._id}><div><b>{order.orderNumber} · {order.restaurantSnapshot.name}</b><span>{order.customer?.email} · {order.status}</span></div><strong>₹{order.pricing.total.toFixed(2)}</strong></article>)}</div>}
    {tab === "riders" && <div className="admin-table">{(riderData?.data.riders ?? []).map((rider) => <article key={rider._id}><div><b>{rider.user?.name} · {rider.vehicleType}</b><span>{rider.user?.email} · {rider.city} · {rider.status}</span></div><div>{rider.status !== "approved" && <button onClick={() => reviewRider({ id: rider._id, status: "approved", reason: "" })}>Approve</button>}{rider.status !== "rejected" && <button onClick={() => reviewRider({ id: rider._id, status: "rejected", reason: "Application did not meet rider verification requirements" })}>Reject</button>}</div></article>)}</div>}
    {tab === "restaurant leads" && <div className="admin-table">{(riderData?.data.leads ?? []).map((lead) => <article key={lead._id}><div><b>{lead.restaurantName} · {lead.city}</b><span>{lead.ownerName} · referred by {lead.rider?.user?.name} · {lead.status}</span></div><div>{lead.status === "submitted" && <button onClick={() => reviewLead({ id: lead._id, status: "contacted", reason: "" })}>Mark contacted</button>}{["submitted","contacted"].includes(lead.status) && <button onClick={() => reviewLead({ id: lead._id, status: "approved", reason: "" })}>Approve lead</button>}</div></article>)}</div>}
    {tab === "payouts" && <div className="admin-table">{(riderData?.data.earnings ?? []).map((earning) => <article key={earning._id}><div><b>{earning.rider?.user?.name} · ₹{earning.amount.toFixed(2)}</b><span>{earning.type.replaceAll("_", " ")} · {earning.restaurant?.name} · UPI {earning.rider?.upiId} · {earning.status}</span></div>{earning.status === "earned" && <button onClick={() => markPaid(earning._id)}>Mark paid</button>}</article>)}</div>}
    {tab === "reviews" && <div className="admin-table">{(reviews?.data.reviews ?? []).map((review) => <article key={review._id}><div><b>★ {review.rating} · {review.restaurant?.name}</b><span>{review.comment}</span></div><button onClick={() => moderate({ id: review._id, status: review.status === "visible" ? "hidden" : "visible" })}>{review.status === "visible" ? "Hide" : "Show"}</button></article>)}</div>}
    {tab === "audit" && <div className="admin-table">{(audit?.data.audits ?? []).map((entry) => <article key={entry._id}><div><b>{entry.action.replaceAll("_", " ")}</b><span>{entry.admin?.email} · {new Date(entry.createdAt).toLocaleString()}</span></div></article>)}</div>}
  </section>;
}

export function AdminPage() {
  const user = useSelector((state) => state.auth.user);
  const [filter, setFilter] = useState("pending");
  const [reasons, setReasons] = useState({});
  const { data, isLoading, error } = useGetApplicationsQuery(undefined, { skip: user?.role !== "admin" });
  const [review, reviewState] = useReviewRestaurantMutation();
  const [operateRestaurant, operationState] = useOperateRestaurantMutation();
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role !== "admin") return <Navigate to="/" replace/>;
  if (isLoading) return <main className="owner-loading">Loading restaurant applications…</main>;

  const restaurants = data?.data.restaurants ?? [];
  const stats = data?.data.stats ?? {};
  const visible = restaurants.filter((restaurant) => restaurant.status === filter);
  const decide = async (restaurant, status) => {
    try { await review({ id: restaurant._id, status, reason: status === "rejected" ? reasons[restaurant._id] ?? "" : "" }).unwrap(); } catch { /* displayed below */ }
  };
  const suspendRestaurant = async (restaurant) => {
    try { await operateRestaurant({ id: restaurant._id, status: "suspended" }).unwrap(); } catch { /* displayed below */ }
  };

  return <main className="admin-page">
    <section className="admin-heading"><div><span className="kicker">Operations center</span><h1>Restaurant approvals</h1><p>Review partners and oversee the marketplace.</p></div><div className="admin-avatar">A</div></section>
    <AdminOperations/>
    <section className="admin-stats">
      <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}><span>Pending review</span><b>{stats.pending ?? 0}</b></button>
      <button className={filter === "approved" ? "active" : ""} onClick={() => setFilter("approved")}><span>Approved</span><b>{stats.approved ?? 0}</b></button>
      <button className={filter === "rejected" ? "active" : ""} onClick={() => setFilter("rejected")}><span>Rejected</span><b>{stats.rejected ?? 0}</b></button>
    </section>
    {error && <div className="owner-error">{errorMessage(error)}</div>}
    {reviewState.error && <div className="owner-error">{errorMessage(reviewState.error)}</div>}
    {operationState.error && <div className="owner-error">{errorMessage(operationState.error)}</div>}
    <section className="application-list">{visible.length === 0 ? <div className="empty-applications"><span>✓</span><h2>Nothing waiting here</h2><p>There are no {filter} restaurant applications.</p></div> : visible.map((restaurant) => <article className="application-card" key={restaurant._id}>
      <div className="application-main"><div className="restaurant-logo">{restaurant.imageUrl ? <img src={restaurant.imageUrl} alt=""/> : restaurant.name.charAt(0)}</div><div><span className={`status-badge ${restaurant.status}`}>{restaurant.status}</span><h2>{restaurant.name}</h2><p>{restaurant.description}</p><div className="application-meta"><span><b>Cuisines</b>{restaurant.cuisines.join(", ")}</span><span><b>Owner</b>{restaurant.owner?.name} · {restaurant.owner?.email}</span><span><b>Location</b>{restaurant.address.area}, {restaurant.address.city}, {restaurant.address.state} {restaurant.address.postalCode}</span><span><b>Hours</b>{restaurant.openingTime} – {restaurant.closingTime}</span></div></div></div>
      {restaurant.status === "pending" && <div className="review-panel"><textarea value={reasons[restaurant._id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [restaurant._id]: event.target.value }))} placeholder="Reason required only when rejecting"/><div><button className="reject-button" disabled={reviewState.isLoading} onClick={() => decide(restaurant, "rejected")}>Reject</button><button className="approve-button" disabled={reviewState.isLoading} onClick={() => decide(restaurant, "approved")}>Approve restaurant</button></div></div>}
      {restaurant.status === "approved" && <div className="review-panel"><div><button className="reject-button" disabled={operationState.isLoading} onClick={() => suspendRestaurant(restaurant)}>Suspend restaurant</button></div></div>}
      {restaurant.status === "rejected" && restaurant.rejectionReason && <div className="rejection-note"><b>Rejection reason</b>{restaurant.rejectionReason}</div>}
    </article>)}</section>
  </main>;
}
