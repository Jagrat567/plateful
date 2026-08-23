import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { useClearCartMutation, useGetCartQuery, useRemoveCartItemMutation, useUpdateCartItemMutation } from "../../app/api.js";

export function CartPage() {
  const user = useSelector((state) => state.auth.user);
  const { data, isLoading } = useGetCartQuery(undefined, { skip: !user });
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const [clearCart] = useClearCartMutation();
  if (!user) return <Navigate to="/login" replace/>;
  if (isLoading) return <main className="page-state tall">Loading your cart…</main>;
  const summary = data?.data;
  if (!summary?.cart) return <main className="empty-cart"><span>🛒</span><h1>Your cart is empty</h1><p>Add something delicious from a restaurant nearby.</p><Link to="/restaurants">Explore restaurants</Link></main>;
  const belowMinimum = summary.subtotal < summary.cart.restaurant.minimumOrder;
  return <main className="cart-page"><section className="cart-items-panel"><div className="cart-panel-title"><div><span className="kicker">Your order</span><h1>{summary.cart.restaurant.name}</h1></div><button onClick={() => clearCart()}>Clear cart</button></div><div className="cart-lines">{summary.cart.items.filter((entry) => entry.menuItem).map((entry) => <article key={entry._id}>{entry.menuItem.imageUrl ? <img src={entry.menuItem.imageUrl} alt=""/> : <div className="cart-placeholder">🍽️</div>}<div><h3>{entry.menuItem.name}</h3><p>₹{entry.menuItem.price.toFixed(2)} each</p><button onClick={() => removeItem(entry._id)}>Remove</button></div><div className="quantity-control"><button disabled={entry.quantity === 1} onClick={() => updateItem({id:entry._id,quantity:entry.quantity-1})}>−</button><span>{entry.quantity}</span><button disabled={entry.quantity === 20} onClick={() => updateItem({id:entry._id,quantity:entry.quantity+1})}>+</button></div><b>₹{(entry.menuItem.price * entry.quantity).toFixed(2)}</b></article>)}</div></section><aside className="cart-summary"><h2>Bill details</h2>{summary.couponCode && <div className="coupon-applied"><span>{summary.couponCode} applied</span><b>50% OFF</b></div>}<div><span>Item subtotal</span><b>₹{summary.subtotal.toFixed(2)}</b></div>{summary.discount > 0 && <div className="discount-line"><span>First-order discount</span><b>−₹{summary.discount.toFixed(2)}</b></div>}<div><span>Platform fee</span><b>₹{summary.platformFee.toFixed(2)}</b></div><div><span>Delivery fee</span><b>Calculated at checkout</b></div><hr/><div className="cart-total"><span>Before delivery</span><b>₹{summary.total.toFixed(2)}</b></div>{belowMinimum && <p>Add ₹{(summary.cart.restaurant.minimumOrder-summary.subtotal).toFixed(2)} more to reach the minimum order.</p>}<Link className={`checkout-link ${belowMinimum ? "disabled" : ""}`} to={belowMinimum ? "/cart" : "/checkout"}>Continue to checkout</Link><small>First kilometre free · ₹10 each additional km</small></aside></main>;
}
