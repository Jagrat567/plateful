import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetFavoritesQuery, useGetRestaurantsQuery, useToggleFavoriteMutation } from "../../app/api.js";

const suggestions = [
  ["Biryani", "/assets/categories/biryani.png"], ["Pizza", "/assets/categories/pizza.png"], ["Burgers", "/assets/categories/burgers.png"],
  ["South Indian", "/assets/categories/south-indian.png"], ["Desserts", "/assets/categories/desserts.png"], ["Healthy", "/assets/categories/healthy.png"],
];

export function DiscoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [foodType, setFoodType] = useState("");
  const [sort, setSort] = useState("rating");
  const [openNow, setOpenNow] = useState(false);
  const [page, setPage] = useState(1);
  const user = useSelector((state) => state.auth.user);
  const { data, isLoading, error } = useGetRestaurantsQuery({ search, foodType, sort, openNow, page });
  const { data: favoriteData } = useGetFavoritesQuery(undefined, { skip: !user || user.role === "admin" });
  const [toggleFavorite] = useToggleFavoriteMutation();
  const restaurants = data?.data.restaurants ?? [];
  const matchedItems = data?.data.matchedItems ?? [];
  const pagination = data?.data.pagination;
  const favoriteIds = new Set((favoriteData?.data.restaurants ?? []).map((restaurant) => restaurant._id));

  const submitSearch = (event) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    setSearch(nextSearch);
    setSearchParams(nextSearch ? { search: nextSearch } : {});
    setSuggestionsOpen(false);
    setPage(1);
  };

  const chooseSuggestion = (term) => {
    setSearchInput(term);
    setSearch(term);
    setSearchParams({ search: term });
    setSuggestionsOpen(false);
    setPage(1);
  };

  return <main className="discovery-page">
    <section className="discovery-hero">
      <span className="kicker light">Delivering happiness nearby</span>
      <h1>Find your next meal.</h1>
      <form className="discovery-search" onSubmit={submitSearch}>
        <span aria-hidden="true">⌕</span>
        <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onFocus={() => setSuggestionsOpen(true)} onBlur={() => setTimeout(() => setSuggestionsOpen(false), 120)} onKeyDown={(event) => { if (event.key === "Enter") submitSearch(event); }} placeholder="Search dishes, restaurants or cuisines" aria-label="Search dishes, restaurants or cuisines"/>
        <button type="submit">Search</button>
        {suggestionsOpen && <div className="food-suggestions discovery-suggestions"><h3>Popular cuisines</h3><div>{suggestions.map(([name, imageUrl]) => <button type="button" key={name} onMouseDown={() => chooseSuggestion(name)}><img src={imageUrl} alt=""/><span>{name}</span></button>)}</div></div>}
      </form>
    </section>
    <section className="discovery-content">
      <div className="discovery-toolbar">
        <div><h2>{search ? `Results for “${search}”` : "Restaurants near you"}</h2><p>{pagination?.total ?? restaurants.length} places accepting orders</p></div>
        <div className="filter-pills">
          <button className={!foodType ? "active" : ""} onClick={() => { setFoodType(""); setPage(1); }}>All</button>
          <button className={foodType === "veg" ? "active" : ""} onClick={() => { setFoodType("veg"); setPage(1); }}>Vegetarian</button>
          <button className={foodType === "vegan" ? "active" : ""} onClick={() => { setFoodType("vegan"); setPage(1); }}>Vegan</button>
          <button className={openNow ? "active" : ""} onClick={() => { setOpenNow(!openNow); setPage(1); }}>Open now</button>
          <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="rating">Top rated</option><option value="deliveryTime">Fastest</option><option value="newest">Newest</option></select>
        </div>
      </div>
      {isLoading && <div className="page-state">Searching available menus…</div>}
      {error && <div className="page-state error">Unable to search restaurants right now.</div>}
      {!isLoading && !error && search && matchedItems.length > 0 && <section className="dish-results">
        <div className="dish-results-heading"><h2>Available dishes</h2><span>{matchedItems.length} match{matchedItems.length === 1 ? "" : "es"}</span></div>
        <div className="dish-results-grid">{matchedItems.map((item) => <Link to={`/restaurants/${item.restaurant._id}`} className="dish-result-card" key={item._id}>
          {item.imageUrl ? <img src={item.imageUrl} alt={item.name}/> : <div className="dish-result-placeholder">🍽️</div>}
          <div><small>{item.restaurant.name}</small><h3>{item.name}</h3><p>{item.description}</p><b>₹{item.price.toFixed(2)}</b><span>View menu →</span></div>
        </Link>)}</div>
      </section>}
      {!isLoading && !error && restaurants.length === 0 && <div className="page-state unavailable-state"><span>⌕</span><h3>{search ? `“${search}” is not available` : "No open restaurants found"}</h3><p>{search ? "Try another dish, drink, restaurant or cuisine." : "Try another filter or check back shortly."}</p></div>}
      {!isLoading && !error && restaurants.length > 0 && <>
        {search && <h2 className="restaurant-result-heading">Restaurants serving your search</h2>}
        <div className="public-restaurant-grid">{restaurants.map((restaurant) => <Link className="public-restaurant-card" to={`/restaurants/${restaurant._id}`} key={restaurant._id}>
          <div className="public-card-image">{restaurant.coverImageUrl ? <img src={restaurant.coverImageUrl} alt={restaurant.name}/> : <span>🍲</span>}<b>{restaurant.estimatedDeliveryMinutes} min</b>{user && user.role !== "admin" && <button className="favorite-button" onClick={(event) => { event.preventDefault(); toggleFavorite(restaurant._id); }}>{favoriteIds.has(restaurant._id) ? "♥" : "♡"}</button>}</div>
          <div><div className="public-card-title"><h3>{restaurant.name}</h3><span>★ {restaurant.rating || "New"}</span></div><p>{restaurant.cuisines.join(" · ")}</p><small>{restaurant.address.area}, {restaurant.address.city} · First 1 km free · {restaurant.isOpenNow ? "Open" : "Closed"}</small></div>
        </Link>)}</div>
      </>}
      {pagination?.pages > 1 && <div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pagination.pages}</span><button disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </section>
  </main>;
}
