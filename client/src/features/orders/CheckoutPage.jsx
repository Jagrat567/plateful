import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCheckoutMutation, useGetAddressesQuery, useGetCartQuery } from "../../app/api.js";

export function CheckoutPage() {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const { data: addressData, isLoading: addressesLoading } = useGetAddressesQuery(undefined, { skip: !user });
  const { data: cartData, isLoading: cartLoading } = useGetCartQuery(undefined, { skip: !user });
  const [checkout, request] = useCheckoutMutation();
  const [addressId, setAddressId] = useState("");
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(1);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  if (!user) return <Navigate to="/login" replace/>;
  if (addressesLoading || cartLoading) return <main className="page-state tall">Preparing checkout…</main>;
  const addresses = addressData?.data.addresses ?? [];
  const summary = cartData?.data;
  if (!summary?.cart) return <Navigate to="/cart" replace/>;
  const selectedAddress = addressId || addresses.find((address) => address.isDefault)?._id || addresses[0]?._id || "";
  const chargeableKm = Math.max(0, Math.ceil(deliveryDistanceKm - 1));
  const deliveryFee = chargeableKm * 10;
  const platformFee = 5;
  const total = summary.subtotal - summary.discount + deliveryFee + platformFee;
  const placeOrder = async () => { try { const response = await checkout({ addressId: selectedAddress, idempotencyKey, deliveryDistanceKm }).unwrap(); navigate(`/orders/${response.data.order._id}`, { replace: true }); } catch { /* shown below */ } };
  return <main className="checkout-page"><section><span className="kicker">Almost there</span><h1>Checkout</h1><div className="checkout-card"><div className="checkout-card-title"><span>1</span><div><h2>Delivery address</h2><p>Where should we bring your order?</p></div><Link to="/addresses">Manage addresses</Link></div>{addresses.length === 0 ? <div className="checkout-empty-address"><p>Add a delivery address before placing your order.</p><Link to="/addresses">Add an address</Link></div> : <div className="checkout-addresses">{addresses.map((address) => <label className={selectedAddress === address._id ? "selected" : ""} key={address._id}><input type="radio" name="address" checked={selectedAddress === address._id} onChange={() => setAddressId(address._id)}/><div><b>{address.label} {address.isDefault && <small>DEFAULT</small>}</b><span>{address.recipientName} · {address.phone}</span><p>{address.line1}, {address.area}, {address.city}, {address.state} {address.postalCode}</p></div></label>)}</div>}<label className="distance-field">Estimated restaurant distance (km)<input type="number" min="0.1" max="50" step="0.1" value={deliveryDistanceKm} onChange={(event) => setDeliveryDistanceKm(Number(event.target.value))}/><small>The first kilometre is free; each additional started kilometre costs ₹10.</small></label></div><div className="checkout-card payment-card"><div className="checkout-card-title"><span>2</span><div><h2>Payment method</h2><p>Online payment will be added later.</p></div></div><label className="cod-option"><input type="radio" checked readOnly/><span>💵</span><div><b>Cash on delivery</b><p>Pay when your food arrives</p></div></label></div></section><aside className="checkout-summary"><h2>{summary.cart.restaurant.name}</h2><p>{summary.itemCount} item{summary.itemCount === 1 ? "" : "s"}</p>{summary.couponCode && <div className="coupon-applied"><span>{summary.couponCode} auto-applied</span><b>50% OFF</b></div>}{summary.cart.items.filter((entry) => entry.menuItem).map((entry) => <div className="checkout-line" key={entry._id}><span>{entry.quantity} × {entry.menuItem.name}</span><b>₹{(entry.quantity*entry.menuItem.price).toFixed(2)}</b></div>)}<hr/><div><span>Subtotal</span><b>₹{summary.subtotal.toFixed(2)}</b></div>{summary.discount > 0 && <div className="discount-line"><span>First-order discount</span><b>−₹{summary.discount.toFixed(2)}</b></div>}<div><span>Delivery ({deliveryDistanceKm.toFixed(1)} km)</span><b>{deliveryFee ? `₹${deliveryFee.toFixed(2)}` : "FREE"}</b></div><div><span>Platform fee</span><b>₹{platformFee.toFixed(2)}</b></div><div className="checkout-total"><span>Total</span><b>₹{total.toFixed(2)}</b></div>{request.error && <div className="owner-error">{request.error.data?.message ?? "Could not place your order"}</div>}<button disabled={!selectedAddress || request.isLoading} onClick={placeOrder}>{request.isLoading ? "Placing order…" : "Place COD order"}</button><small>By placing this order, you agree to the delivery terms.</small></aside></main>;
}
