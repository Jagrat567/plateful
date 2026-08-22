/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { io } from "socket.io-client";
import { API_ORIGIN } from "../../app/config.js";
import { useCreateCategoryMutation, useCreateMenuItemMutation, useCreateRestaurantMutation, useDeleteCategoryMutation, useDeleteMenuItemMutation, useGetOwnerMenuQuery, useGetOwnerOrdersQuery, useGetOwnerRestaurantQuery, useUpdateMenuItemMutation, useUpdateOwnerOrderMutation, useUpdateRestaurantMutation, useUploadImageMutation } from "../../app/api.js";
import { sessionReceived } from "../auth/authSlice.js";

const emptyRestaurant = { name: "", description: "", cuisines: "", contactPhone: "", line1: "", area: "", city: "", state: "", postalCode: "", openingTime: "09:00", closingTime: "23:00" };
const emptyItem = { name: "", description: "", price: "", categoryId: "", foodType: "veg", imageUrl: "", imagePublicId: "" };
const message = (error) => error?.data?.message ?? "Something went wrong. Please try again.";

function StorefrontSettings({ restaurant }) {
  const [form, setForm] = useState({ deliveryFee: restaurant.deliveryFee, minimumOrder: restaurant.minimumOrder, estimatedDeliveryMinutes: restaurant.estimatedDeliveryMinutes, isAcceptingOrders: restaurant.isAcceptingOrders, orderMode: restaurant.orderMode ?? "simulated", coverImageUrl: restaurant.coverImageUrl ?? "", coverImagePublicId: "" });
  const [updateRestaurant, request] = useUpdateRestaurantMutation();
  const [uploadImage, uploadRequest] = useUploadImageMutation();
  const save = async (event) => { event.preventDefault(); try { await updateRestaurant({ ...form, deliveryFee: Number(form.deliveryFee), minimumOrder: Number(form.minimumOrder), estimatedDeliveryMinutes: Number(form.estimatedDeliveryMinutes) }).unwrap(); } catch { /* shown below */ } };
  const chooseCover = async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const response = await uploadImage(file).unwrap(); setForm((current) => ({ ...current, coverImageUrl: response.data.imageUrl, coverImagePublicId: response.data.imagePublicId })); } catch { /* shown below */ } };
  return <section className="dashboard-card storefront-settings"><div className="card-title"><div><h2>Storefront settings</h2><p>Control delivery details and customer visibility.</p></div></div><form onSubmit={save}><label>Delivery fee (₹)<input type="number" min="0" value={form.deliveryFee} onChange={(e) => setForm({...form,deliveryFee:e.target.value})}/></label><label>Minimum order (₹)<input type="number" min="0" value={form.minimumOrder} onChange={(e) => setForm({...form,minimumOrder:e.target.value})}/></label><label>Delivery estimate<input type="number" min="10" max="180" value={form.estimatedDeliveryMinutes} onChange={(e) => setForm({...form,estimatedDeliveryMinutes:e.target.value})}/></label><label>Order handling<select value={form.orderMode} onChange={(e) => setForm({...form,orderMode:e.target.value})}><option value="simulated">Automatic simulation</option><option value="manual">Manual restaurant updates</option></select></label><label>Cover image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseCover}/></label>{form.coverImageUrl && <img className="cover-preview" src={form.coverImageUrl} alt="Restaurant cover preview"/>}<label className="accepting-toggle"><input type="checkbox" checked={form.isAcceptingOrders} disabled={restaurant.status !== "approved"} onChange={(e) => setForm({...form,isAcceptingOrders:e.target.checked})}/><span><b>Accepting orders</b><small>{restaurant.status === "approved" ? "Customers can discover your restaurant when enabled." : "Available after admin approval."}</small></span></label>{(request.error || uploadRequest.error) && <div className="owner-error">{message(request.error || uploadRequest.error)}</div>}<button className="owner-primary" disabled={request.isLoading || uploadRequest.isLoading}>{request.isLoading ? "Saving…" : "Save storefront"}</button></form></section>;
}

const nextStatus = { placed: "confirmed", confirmed: "preparing", preparing: "ready_for_pickup", ready_for_pickup: "out_for_delivery", out_for_delivery: "delivered" };
function RestaurantOrders() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const { data, refetch } = useGetOwnerOrdersQuery();
  const [updateOrder, request] = useUpdateOwnerOrderMutation();
  const [tab, setTab] = useState("active");
  useEffect(() => { if (!accessToken) return undefined; const socket = io(API_ORIGIN, { auth: { token: accessToken } }); socket.on("restaurant:order_created", refetch); socket.on("restaurant:order_updated", refetch); return () => socket.disconnect(); }, [accessToken, refetch]);
  const orders = (data?.data.orders ?? []).filter((order) => tab === "active" ? !["delivered","cancelled"].includes(order.status) : ["delivered","cancelled"].includes(order.status));
  const advance = (order) => updateOrder({ id: order._id, status: nextStatus[order.status] });
  const cancel = (order) => { const reason = window.prompt("Why is the restaurant cancelling this order?"); if (reason) updateOrder({ id: order._id, status: "cancelled", reason }); };
  return <section className="dashboard-card restaurant-orders"><div className="card-title"><div><h2>Restaurant orders</h2><p>Manage live orders or let simulation handle them.</p></div><div className="order-tabs"><button className={tab === "active" ? "active" : ""} onClick={() => setTab("active")}>Active</button><button className={tab === "completed" ? "active" : ""} onClick={() => setTab("completed")}>Completed</button></div></div>{request.error && <div className="owner-error">{message(request.error)}</div>}<div className="restaurant-order-list">{orders.length === 0 ? <p className="empty-state large">No {tab} orders.</p> : orders.map((order) => <article key={order._id}><div><span className={`order-status ${order.status}`}>{order.status.replaceAll("_"," ")}</span><h3>{order.orderNumber}</h3><p>{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</p><small>{order.customer?.name} · {order.deliveryAddress.area}</small></div><b>₹{order.pricing.total.toFixed(2)}</b><div>{nextStatus[order.status] && <button disabled={request.isLoading} onClick={() => advance(order)}>Mark {nextStatus[order.status].replaceAll("_"," ")}</button>}{["placed","confirmed"].includes(order.status) && <button className="danger" onClick={() => cancel(order)}>Cancel</button>}</div></article>)}</div></section>;
}

function OnboardingForm() {
  const dispatch = useDispatch();
  const session = useSelector((state) => state.auth);
  const [form, setForm] = useState(emptyRestaurant);
  const [createRestaurant, request] = useCreateRestaurantMutation();
  const update = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    try {
      const body = { name: form.name, description: form.description, cuisines: form.cuisines.split(",").map((value) => value.trim()).filter(Boolean), contactPhone: form.contactPhone, address: { line1: form.line1, area: form.area, city: form.city, state: form.state, postalCode: form.postalCode }, openingTime: form.openingTime, closingTime: form.closingTime };
      const response = await createRestaurant(body).unwrap();
      dispatch(sessionReceived({ ...session, user: response.data.user }));
    } catch { /* Error is shown below. */ }
  };
  return <main className="owner-onboarding"><div className="owner-intro"><span className="kicker light">Partner with Plateful</span><h1>Let’s put your restaurant on the map.</h1><p>Create your storefront, build your menu, and get ready to delight hungry customers.</p><div className="owner-benefits"><span>✓ Simple menu tools</span><span>✓ Real-time order updates</span><span>✓ Reach nearby customers</span></div></div><section className="onboarding-card"><span className="kicker">Restaurant application</span><h2>Tell us about your kitchen</h2><p>Your restaurant stays private while its approval is pending.</p><form className="owner-form" onSubmit={submit}><label>Restaurant name<input name="name" value={form.name} onChange={update} required minLength="2"/></label><label>Contact phone<input name="contactPhone" value={form.contactPhone} onChange={update} required placeholder="9876543210"/></label><label className="full">Description<textarea name="description" value={form.description} onChange={update} required minLength="20" placeholder="Tell customers what makes your food special…"/></label><label className="full">Cuisines<input name="cuisines" value={form.cuisines} onChange={update} required placeholder="North Indian, Biryani, Desserts"/><small>Separate cuisines with commas</small></label><label className="full">Street address<input name="line1" value={form.line1} onChange={update} required/></label><label>Area<input name="area" value={form.area} onChange={update} required/></label><label>City<input name="city" value={form.city} onChange={update} required/></label><label>State<input name="state" value={form.state} onChange={update} required/></label><label>Postal code<input name="postalCode" value={form.postalCode} onChange={update} required/></label><label>Opens at<input type="time" name="openingTime" value={form.openingTime} onChange={update}/></label><label>Closes at<input type="time" name="closingTime" value={form.closingTime} onChange={update}/></label>{request.error && <div className="owner-error full">{message(request.error)}</div>}<button className="owner-primary full" disabled={request.isLoading}>{request.isLoading ? "Submitting…" : "Submit application"}</button></form></section></main>;
}

function OwnerDashboard() {
  const { data: restaurantResponse, isLoading: restaurantLoading } = useGetOwnerRestaurantQuery();
  const { data: menuResponse, isLoading: menuLoading } = useGetOwnerMenuQuery();
  const [categoryName, setCategoryName] = useState("");
  const [item, setItem] = useState(emptyItem);
  const [createCategory, categoryRequest] = useCreateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [createItem, itemRequest] = useCreateMenuItemMutation();
  const [updateItem] = useUpdateMenuItemMutation();
  const [deleteItem] = useDeleteMenuItemMutation();
  const [uploadImage, uploadRequest] = useUploadImageMutation();
  const [deleteError, setDeleteError] = useState("");
  const restaurant = restaurantResponse?.data.restaurant;
  const categories = menuResponse?.data.categories ?? [];
  const items = menuResponse?.data.items ?? [];
  if (restaurantLoading || menuLoading) return <main className="owner-loading">Preparing your restaurant dashboard…</main>;
  const addCategory = async (event) => { event.preventDefault(); try { await createCategory({ name: categoryName, displayOrder: categories.length }).unwrap(); setCategoryName(""); } catch { /* shown below */ } };
  const addItem = async (event) => { event.preventDefault(); try { await createItem({ ...item, price: Number(item.price), isAvailable: true }).unwrap(); setItem(emptyItem); } catch { /* shown below */ } };
  const chooseImage = async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const response = await uploadImage(file).unwrap(); setItem((current) => ({ ...current, ...response.data })); } catch { /* shown beside the picker */ } };
  const removeItem = async (menuItem) => { if (!window.confirm(`Delete ${menuItem.name} from your menu?`)) return; setDeleteError(""); try { await deleteItem(menuItem._id).unwrap(); } catch (error) { setDeleteError(message(error)); } };
  return <main className="owner-dashboard"><section className="dashboard-top"><div><span className="kicker">Restaurant workspace</span><h1>{restaurant?.name}</h1><p>{restaurant?.cuisines.join(" · ")}</p></div><span className={`status-badge ${restaurant?.status}`}>{restaurant?.status}</span></section>{restaurant?.status === "pending" && <div className="pending-note"><b>Application under review</b><span>You can build your menu now. Your restaurant will become publicly visible after admin approval.</span></div>}<StorefrontSettings restaurant={restaurant}/>{restaurant?.status === "approved" && <RestaurantOrders/>}
    <div className="dashboard-grid"><section className="dashboard-card category-manager"><div className="card-title"><div><h2>Menu categories</h2><p>Organize items so customers can browse quickly.</p></div><span>{categories.length}</span></div><form className="inline-form" onSubmit={addCategory}><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Starters" required minLength="2"/><button disabled={categoryRequest.isLoading}>Add</button></form>{categoryRequest.error && <div className="owner-error">{message(categoryRequest.error)}</div>}<div className="category-list">{categories.length === 0 ? <p className="empty-state">No categories yet. Add your first one above.</p> : categories.map((category) => <div key={category._id}><span>{category.name}</span><small>{items.filter((menuItem) => menuItem.category === category._id).length} items</small><button onClick={() => deleteCategory(category._id)} aria-label={`Delete ${category.name}`}>×</button></div>)}</div></section>
      <section className="dashboard-card item-editor"><h2>Add a menu item</h2><p>Upload a clear JPEG, PNG, or WebP image up to 5 MB.</p><form className="item-form" onSubmit={addItem}><label>Item name<input value={item.name} onChange={(e) => setItem({...item,name:e.target.value})} required/></label><label>Category<select value={item.categoryId} onChange={(e) => setItem({...item,categoryId:e.target.value})} required><option value="">Choose category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label><label>Price (₹)<input type="number" min="1" step="0.01" value={item.price} onChange={(e) => setItem({...item,price:e.target.value})} required/></label><label>Food type<select value={item.foodType} onChange={(e) => setItem({...item,foodType:e.target.value})}><option value="veg">Vegetarian</option><option value="nonVeg">Non-vegetarian</option><option value="vegan">Vegan</option></select></label><label className="full">Description<textarea value={item.description} onChange={(e) => setItem({...item,description:e.target.value})} required minLength="5"/></label><label className="full image-picker">Dish image <span>(optional)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage}/>{uploadRequest.isLoading && <small>Uploading image…</small>}{item.imageUrl && <img src={item.imageUrl} alt="New dish preview"/>}</label>{uploadRequest.error && <div className="owner-error full">{message(uploadRequest.error)}</div>}{itemRequest.error && <div className="owner-error full">{message(itemRequest.error)}</div>}<button className="owner-primary full" disabled={itemRequest.isLoading || uploadRequest.isLoading || categories.length === 0}>Add to menu</button></form></section></div>
    <section className="dashboard-card menu-preview"><div className="card-title"><div><h2>Your menu</h2><p>{items.length} items across {categories.length} categories</p></div></div>{deleteError && <div className="owner-error">{deleteError}</div>}{items.length === 0 ? <p className="empty-state large">Your dishes will appear here after you add them.</p> : <div className="owner-items">{items.map((menuItem) => <article key={menuItem._id} className={!menuItem.isAvailable ? "unavailable" : ""}>{menuItem.imageUrl ? <img src={menuItem.imageUrl} alt={menuItem.name}/> : <div className="item-placeholder">🍽️</div>}<div><span className={`food-dot ${menuItem.foodType}`}/><h3>{menuItem.name}</h3><p>{menuItem.description}</p><b>₹{menuItem.price.toFixed(2)}</b></div><div className="item-actions"><button type="button" onClick={() => updateItem({id:menuItem._id,isAvailable:!menuItem.isAvailable})}>{menuItem.isAvailable ? "Mark unavailable" : "Make available"}</button><button type="button" className="danger" onClick={() => removeItem(menuItem)}>Delete</button></div></article>)}</div>}</section>
  </main>;
}

export function OwnerPage() {
  const user = useSelector((state) => state.auth.user);
  if (!user) return <Navigate to="/login" replace/>;
  return user.role === "customer" ? <OnboardingForm/> : <OwnerDashboard/>;
}
