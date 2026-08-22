import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useGetCartQuery, useGetRestaurantsQuery, useLogoutMutation, useRefreshMutation } from "./app/api.js";
import { AuthPage } from "./features/auth/AuthPage.jsx";
import { sessionCleared, sessionReceived } from "./features/auth/authSlice.js";
import { OwnerPage } from "./features/owner/OwnerPage.jsx";
import { AdminPage } from "./features/admin/AdminPage.jsx";
import { DiscoveryPage } from "./features/discovery/DiscoveryPage.jsx";
import { RestaurantPage } from "./features/discovery/RestaurantPage.jsx";
import { CartPage } from "./features/cart/CartPage.jsx";
import { AddressesPage } from "./features/addresses/AddressesPage.jsx";
import { CheckoutPage } from "./features/orders/CheckoutPage.jsx";
import { OrdersPage } from "./features/orders/OrdersPage.jsx";
import { OrderTrackingPage } from "./features/orders/OrderTrackingPage.jsx";
import { PasswordResetPage } from "./features/auth/PasswordResetPage.jsx";

const categories = [
  ["Biryani", "/assets/categories/biryani.png"], ["Pizza", "/assets/categories/pizza.png"], ["Burgers", "/assets/categories/burgers.png"],
  ["South Indian", "/assets/categories/south-indian.png"], ["Desserts", "/assets/categories/desserts.png"], ["Healthy", "/assets/categories/healthy.png"],
];

let sessionBootstrapStarted = false;

function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const {data:homeRestaurants}=useGetRestaurantsQuery({limit:4,sort:"rating"});
  const restaurants=homeRestaurants?.data.restaurants??[];
  const runSearch = (term = search) => navigate(`/restaurants?search=${encodeURIComponent(term.trim())}`);
  return <>
    <section className="hero-section">
      <div className="hero-content"><span className="kicker light">#1 choice for your cravings</span><h1>Good food.<br/><em>Great mood.</em></h1><p>Discover the best food from over 1,000 restaurants and get it delivered hot to your doorstep.</p>
        <form className="home-search" onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
          <div className="home-location-field"><span aria-hidden="true">●</span><label className="sr-only" htmlFor="location">Delivery location</label><input id="location" placeholder="Enter your delivery location"/><b aria-hidden="true">⌄</b></div>
          <div className="home-food-search"><input value={search} onChange={(event) => setSearch(event.target.value)} onFocus={() => setSuggestionsOpen(true)} onBlur={() => setTimeout(() => setSuggestionsOpen(false), 120)} placeholder="Search for restaurant, item or more" aria-label="Search for restaurant, item or more"/><button type="submit" aria-label="Search">⌕</button>
            {suggestionsOpen && <div className="food-suggestions"><h3>Popular cuisines</h3><div>{categories.map(([name, imageUrl]) => <button type="button" key={name} onMouseDown={() => runSearch(name)}><img src={imageUrl} alt=""/><span>{name}</span></button>)}</div></div>}
          </div>
        </form>
        <div className="trust"><span><b>4.8 ★</b>App rating</span><i/><span><b>10M+</b>Happy orders</span><i/><span><b>30 min</b>Avg. delivery</span></div>
      </div>
    </section>
    <main>
      <section className="content categories"><div className="heading"><div><span className="kicker">Eat what makes you happy</span><h2>What’s on your mind?</h2></div><button className="text-button" type="button">See all cuisines →</button></div>
        <div className="category-grid">{categories.map(([name, imageUrl]) => <button className="category-card" type="button" key={name} onClick={() => navigate("/restaurants")}><span><img src={imageUrl} alt=""/></span><b>{name}</b></button>)}</div>
      </section>
      <section className="content offers" id="offers">
        <div className="offer orange"><div><span>FIRST50 · AUTO-APPLIED</span><h3>50% off your first order</h3><p>Sign in and add food—the discount appears automatically at checkout.</p><button type="button" onClick={() => navigate("/restaurants")}>Order now</button></div><strong aria-hidden="true">50%</strong></div>
        <div className="offer purple"><div><span>PLATEFUL PERKS</span><h3>More offers coming soon</h3><p>Seasonal savings and restaurant deals will appear here.</p><button type="button" onClick={() => navigate("/restaurants")}>Explore restaurants</button></div><strong aria-hidden="true">%</strong></div>
      </section>
      <section className="content restaurants"><div className="heading restaurant-heading"><div><span className="kicker">Top picks near you</span><h2>Restaurants you’ll love</h2></div><div className="filters"><button type="button">Filter</button><button type="button">Fast delivery</button><button type="button">Rating 4.0+</button></div></div>
        <div className="restaurant-grid">{restaurants.map((restaurant) => <Link to={`/restaurants/${restaurant._id}`} className="restaurant-card" key={restaurant._id}><div className="restaurant-image">{restaurant.coverImageUrl?<img src={restaurant.coverImageUrl} alt={`Food served by ${restaurant.name}`}/>:<div className="item-placeholder">🍲</div>}<span>₹{restaurant.deliveryFee} delivery</span></div><div className="restaurant-info"><div><h3>{restaurant.name}</h3><b>★ {restaurant.rating||"New"}</b></div><p>{restaurant.cuisines.join(" · ")}</p><small>◷ {restaurant.estimatedDeliveryMinutes} min</small></div></Link>)}</div>{restaurants.length===0&&<p className="empty-state">No restaurants are accepting orders right now.</p>}
      </section>
      <section className="app-banner"><div><span className="kicker">Food in your pocket</span><h2>Cravings travel with you.</h2><p>Save favourites, track orders live, and unlock app-only offers.</p><div className="store-buttons"><button type="button">▶ <span>GET IT ON<b>Google Play</b></span></button><button type="button">● <span>Download on the<b>App Store</b></span></button></div></div><div className="phone" aria-hidden="true"><i/><span>plateful</span><div>🍕<small>Arriving in</small><b>12 mins</b></div></div></section>
    </main>
  </>;
}

function App() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state) => state.auth);
  const [refresh] = useRefreshMutation();
  const [logout, logoutState] = useLogoutMutation();
  const canShop = Boolean(user && user.role !== "admin");
  const { data: cartResponse } = useGetCartQuery(undefined, { skip: !canShop });
  const authRoute = ["/login", "/signup", "/forgot-password", "/reset-password"].includes(location.pathname);

  useEffect(() => {
    if (!accessToken && !sessionBootstrapStarted) {
      sessionBootstrapStarted = true;
      refresh().unwrap().then((response) => dispatch(sessionReceived(response.data))).catch(() => dispatch(sessionCleared()));
    }
  }, [accessToken, dispatch, refresh]);

  useEffect(() => {
    if (!location.hash) return;
    requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth" }));
  }, [location.hash, location.pathname]);

  const signOut = async () => {
    try { await logout().unwrap(); } finally { dispatch(sessionCleared()); }
  };

  return <div className="app-shell">
    {!authRoute && <header className="site-header"><Link className="brand" to="/"><span>p</span> plateful</Link><nav aria-label="Main navigation">{user?.role === "admin" ? <Link to="/admin">Admin dashboard</Link> : <Link to="/owner">{user?.role === "restaurantOwner" ? "Restaurant dashboard" : "Partner with us"}</Link>}<Link to="/restaurants">Restaurants</Link>{canShop && <><Link to="/orders">Orders</Link><Link to="/addresses">Addresses</Link></>}<Link to="/#offers">Offers <b>NEW</b></Link></nav><div className="header-actions">{user ? <>{canShop && <Link className="cart-header-link" to="/cart">Cart <b>{cartResponse?.data.itemCount ?? 0}</b></Link>}<span className="welcome-user">Hi, {user.name.split(" ")[0]}</span><button type="button" onClick={signOut} disabled={logoutState.isLoading}>Log out</button></> : <><Link className="header-link-button" to="/login">Log in</Link><Link className="header-link-button dark-button" to="/signup">Sign up</Link></>}</div></header>}
    <Routes><Route path="/" element={<HomePage/>}/><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/signup" element={<AuthPage mode="signup"/>}/><Route path="/forgot-password" element={<PasswordResetPage/>}/><Route path="/reset-password" element={<PasswordResetPage/>}/><Route path="/owner" element={<OwnerPage/>}/><Route path="/admin" element={<AdminPage/>}/><Route path="/restaurants" element={<DiscoveryPage/>}/><Route path="/restaurants/:restaurantId" element={<RestaurantPage/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/addresses" element={<AddressesPage/>}/><Route path="/checkout" element={<CheckoutPage/>}/><Route path="/orders" element={<OrdersPage/>}/><Route path="/orders/:orderId" element={<OrderTrackingPage/>}/></Routes>
    {!authRoute && <footer><Link className="brand" to="/"><span>p</span> plateful</Link><p>Made with appetite. © 2026 Plateful.</p></footer>}
  </div>;
}

export default App;
