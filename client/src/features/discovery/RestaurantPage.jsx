import { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAddCartItemMutation, useGetRestaurantQuery, useGetRestaurantReviewsQuery } from "../../app/api.js";

export function RestaurantPage() {
  const { restaurantId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetRestaurantQuery(restaurantId);
  const { data: reviewData } = useGetRestaurantReviewsQuery(restaurantId);
  const [addItem, request] = useAddCartItemMutation();
  const [notice, setNotice] = useState("");
  if (isLoading) return <main className="page-state tall">Loading restaurant menu…</main>;
  if (error) return <main className="page-state tall error">Restaurant unavailable or not found.</main>;
  const { restaurant, categories, items } = data.data;
  const addToCart = async (menuItemId, replaceCart = false) => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    try { await addItem({ menuItemId, quantity: 1, replaceCart }).unwrap(); setNotice("Added to cart"); }
    catch (requestError) {
      if (requestError?.status === 409 && requestError?.data?.message?.includes("another restaurant") && window.confirm("Your cart contains food from another restaurant. Replace it with this item?")) addToCart(menuItemId, true);
      else setNotice(requestError?.data?.message ?? "Could not add this item");
    }
  };
  const reviews=reviewData?.data.reviews??[];
  return <main className="storefront-page"><section className="storefront-cover">{restaurant.coverImageUrl ? <img src={restaurant.coverImageUrl} alt=""/> : <div>🍲</div>}<div className="storefront-overlay"><Link to="/restaurants">← All restaurants</Link><h1>{restaurant.name}</h1><p>{restaurant.cuisines.join(" · ")}</p><div><span>★ {restaurant.rating || "New"} ({restaurant.ratingCount})</span><span>{restaurant.estimatedDeliveryMinutes} min</span><span>First 1 km free · ₹10/km after</span><span>Min. ₹{restaurant.minimumOrder}</span></div></div></section>{notice && <button type="button" className="cart-toast" onClick={() => navigate("/cart")}>{notice} · View cart →</button>}<section className="storefront-menu"><aside><h3>Menu</h3>{categories.map((category) => <a href={`#category-${category._id}`} key={category._id}>{category.name}</a>)}<a href="#reviews">Reviews</a></aside><div className="menu-groups">{categories.map((category) => { const categoryItems = items.filter((item) => item.category === category._id); return categoryItems.length ? <section id={`category-${category._id}`} key={category._id}><h2>{category.name}</h2><p>{categoryItems.length} items</p><div>{categoryItems.map((item) => <article className="customer-menu-item" key={item._id}><div><span className={`food-dot ${item.foodType}`}/><h3>{item.name}</h3><b>₹{item.price.toFixed(2)}</b><p>{item.description}</p></div><div className="customer-item-image">{item.imageUrl ? <img src={item.imageUrl} alt={item.name}/> : <span>🍽️</span>}<button type="button" disabled={request.isLoading} onClick={() => addToCart(item._id)}>{request.isLoading && request.originalArgs?.menuItemId === item._id ? "ADDING…" : "ADD"}</button></div></article>)}</div></section> : null; })}<section id="reviews" className="restaurant-reviews"><h2>Customer reviews</h2>{reviews.length===0?<p>No reviews yet.</p>:reviews.map(review=><article key={review._id}><b>★ {review.rating} · {review.customer?.name}</b><p>{review.comment}</p><small>{new Date(review.createdAt).toLocaleDateString()}</small></article>)}</section></div></section></main>;
}
