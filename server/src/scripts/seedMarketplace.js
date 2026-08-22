import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { User } from "../modules/users/user.model.js";
import { Restaurant } from "../modules/restaurants/restaurant.model.js";
import { MenuCategory } from "../modules/menu/menuCategory.model.js";
import { MenuItem } from "../modules/menu/menuItem.model.js";

const image = (name) => `/assets/categories/${name}.png`;
const dish = (category, name, description, price, foodType = "veg", imageName = "healthy") => ({ category, name, description, price, foodType, imageUrl: image(imageName) });

const businesses = [
  {
    name: "Royal Handi Biryani", cuisines: ["Biryani", "Mughlai", "Kebabs"], area: "Indiranagar", city: "Bengaluru", state: "Karnataka", postalCode: "560038", line1: "12, 100 Feet Road", phone: "9000010001", hours: ["11:00", "23:30"], deliveryFee: 35, minimumOrder: 199, eta: 32, rating: 4.7, ratingCount: 1842, cover: "biryani",
    description: "Slow-cooked dum biryanis, smoky kebabs and classic Mughlai comfort food prepared with house-ground spices.",
    items: [dish("Biryanis", "Hyderabadi Chicken Dum Biryani", "Long-grain basmati rice layered with marinated chicken, saffron and fried onions.", 329, "nonVeg", "biryani"), dish("Biryanis", "Paneer Tikka Biryani", "Smoky paneer tikka and aromatic rice served with mint raita.", 279, "veg", "biryani"), dish("Kebabs", "Chicken Seekh Kebab", "Char-grilled minced chicken skewers with green chutney.", 259, "nonVeg", "burgers"), dish("Sides", "Burani Raita", "Chilled garlic yogurt finished with roasted cumin.", 79), dish("Drinks", "Kesar Lassi", "Thick yogurt drink scented with saffron and cardamom.", 119, "veg", "desserts")],
  },
  {
    name: "Dakshin Tiffin House", cuisines: ["South Indian", "Breakfast", "Filter Coffee"], area: "T Nagar", city: "Chennai", state: "Tamil Nadu", postalCode: "600017", line1: "44, North Usman Road", phone: "9000010002", hours: ["06:30", "22:30"], deliveryFee: 20, minimumOrder: 99, eta: 24, rating: 4.8, ratingCount: 3210, cover: "south-indian",
    description: "A neighbourhood tiffin room serving crisp dosas, fluffy idlis and freshly brewed degree filter coffee all day.",
    items: [dish("Dosas", "Mysore Masala Dosa", "Crisp dosa with spicy chutney and potato masala, served with sambar.", 149, "vegan", "south-indian"), dish("Tiffin", "Ghee Podi Idli", "Soft idlis tossed in ghee and house gunpowder spice.", 119, "veg", "south-indian"), dish("Tiffin", "Medu Vada Sambar", "Two crisp lentil vadas with hot sambar and coconut chutney.", 109, "vegan", "south-indian"), dish("Rice", "Curd Rice", "Tempered yogurt rice with pomegranate and pickle.", 129), dish("Drinks", "Degree Filter Coffee", "Strong South Indian coffee with frothy milk.", 69, "veg", "desserts")],
  },
  {
    name: "Punjab Junction", cuisines: ["North Indian", "Punjabi", "Tandoor"], area: "Rajouri Garden", city: "New Delhi", state: "Delhi", postalCode: "110027", line1: "B-18, Main Market", phone: "9000010003", hours: ["11:30", "23:45"], deliveryFee: 30, minimumOrder: 179, eta: 35, rating: 4.6, ratingCount: 2276, cover: "healthy",
    description: "Robust Punjabi curries, buttery breads and tandoor favourites made for generous family-style meals.",
    items: [dish("Curries", "Butter Chicken", "Tandoori chicken simmered in a silky tomato, butter and fenugreek gravy.", 349, "nonVeg", "biryani"), dish("Curries", "Paneer Lababdar", "Paneer in a rich tomato-cashew gravy with bell peppers.", 299), dish("Dal & Rice", "Dal Makhani", "Black lentils slow-cooked overnight with butter and cream.", 249), dish("Breads", "Garlic Butter Naan", "Tandoor-baked naan brushed with garlic butter.", 69), dish("Drinks", "Mango Lassi", "Chilled mango and yogurt blend.", 109, "veg", "desserts")],
  },
  {
    name: "Bombay Street Co.", cuisines: ["Street Food", "Maharashtrian", "Fast Food"], area: "Bandra West", city: "Mumbai", state: "Maharashtra", postalCode: "400050", line1: "7, Hill Road", phone: "9000010004", hours: ["09:00", "01:00"], deliveryFee: 25, minimumOrder: 129, eta: 27, rating: 4.5, ratingCount: 4138, cover: "burgers",
    description: "Mumbai street-food classics with bright chutneys, toasted pav and the lively flavours of the city.",
    items: [dish("Mumbai Classics", "Pav Bhaji", "Buttery spiced vegetable mash with toasted pav, onion and lemon.", 189, "veg", "burgers"), dish("Mumbai Classics", "Vada Pav", "Crisp potato vada in pav with garlic and green chutneys.", 79, "vegan", "burgers"), dish("Chaat", "Ragda Pattice", "Potato patties, white-pea curry, chutneys and crunchy sev.", 149), dish("Chaat", "Sev Puri", "Crisp puris layered with potato, chutneys and sev.", 129), dish("Drinks", "Kala Khatta Soda", "Tangy blackberry-spiced fizzy cooler.", 89, "vegan", "healthy")],
  },
  {
    name: "Curry & Crust", cuisines: ["Pizza", "Burgers", "Indian Fusion"], area: "Koregaon Park", city: "Pune", state: "Maharashtra", postalCode: "411001", line1: "21, Lane 6", phone: "9000010005", hours: ["11:00", "00:30"], deliveryFee: 39, minimumOrder: 199, eta: 29, rating: 4.4, ratingCount: 1659, cover: "pizza",
    description: "Indian flavours meet hand-stretched pizzas, stacked burgers and loaded café-style fast food.",
    items: [dish("Pizzas", "Paneer Tikka Pizza", "Hand-tossed crust, tikka sauce, paneer, peppers, onion and mozzarella.", 329, "veg", "pizza"), dish("Pizzas", "Tandoori Chicken Pizza", "Smoky chicken tikka, onion, jalapeño and mozzarella.", 369, "nonVeg", "pizza"), dish("Burgers", "Crispy Paneer Burger", "Spiced paneer patty, lettuce, onion and makhani mayo.", 219, "veg", "burgers"), dish("Sides", "Peri-Peri Fries", "Crisp fries tossed in a punchy peri-peri seasoning.", 139, "vegan", "burgers"), dish("Shakes", "Chocolate Brownie Shake", "Thick chocolate shake blended with fudgy brownie.", 179, "veg", "desserts")],
  },
  {
    name: "Chai & Chapter Café", cuisines: ["Cafe", "Beverages", "Fast Food"], area: "Salt Lake", city: "Kolkata", state: "West Bengal", postalCode: "700091", line1: "CF-112, Sector I", phone: "9000010006", hours: ["08:00", "23:00"], deliveryFee: 25, minimumOrder: 149, eta: 22, rating: 4.6, ratingCount: 986, cover: "desserts",
    description: "A relaxed all-day café for brewed chai, cold coffee, sandwiches, quick bites and warm desserts.",
    items: [dish("Chai", "Kulhad Masala Chai", "Freshly brewed Assam tea with milk, ginger and whole spices.", 79), dish("Coffee", "Classic Cold Coffee", "Chilled espresso, milk and vanilla blended until frothy.", 149), dish("Quick Bites", "Bombay Veg Grilled Sandwich", "Triple-layer vegetable sandwich with chutney and cheese.", 179), dish("Quick Bites", "Masala Maggi", "Noodles tossed with vegetables and house masala.", 119), dish("Desserts", "Sizzling Brownie", "Warm chocolate brownie with vanilla ice cream and chocolate sauce.", 199, "veg", "desserts")],
  },
  {
    name: "The Green Bowl", cuisines: ["Healthy", "Salads", "Vegan"], area: "Jubilee Hills", city: "Hyderabad", state: "Telangana", postalCode: "500033", line1: "Plot 58, Road 36", phone: "9000010007", hours: ["08:00", "22:30"], deliveryFee: 30, minimumOrder: 199, eta: 26, rating: 4.7, ratingCount: 1204, cover: "healthy",
    description: "Nourishing grain bowls, salads and smoothies built from fresh produce, whole grains and bold Indian dressings.",
    items: [dish("Power Bowls", "Millet Tikka Bowl", "Foxtail millet, paneer tikka, roasted vegetables and mint dressing.", 279, "veg", "healthy"), dish("Power Bowls", "Vegan Chana Bowl", "Brown rice, masala chickpeas, cucumber, greens and tamarind dressing.", 249, "vegan", "healthy"), dish("Salads", "Tandoori Chicken Salad", "Grilled chicken, mixed leaves, corn, cucumber and yogurt dressing.", 289, "nonVeg", "healthy"), dish("Comfort", "Moong Dal Khichdi", "Light yellow-lentil and rice khichdi with seasonal vegetables.", 199, "vegan", "healthy"), dish("Smoothies", "Mango Turmeric Smoothie", "Mango, banana, turmeric and coconut milk.", 169, "vegan", "healthy")],
  },
  {
    name: "Bengal Sweet House", cuisines: ["Bengali", "Sweets", "Rolls"], area: "Gariahat", city: "Kolkata", state: "West Bengal", postalCode: "700029", line1: "196, Rash Behari Avenue", phone: "9000010008", hours: ["08:00", "22:00"], deliveryFee: 20, minimumOrder: 119, eta: 30, rating: 4.8, ratingCount: 2761, cover: "desserts",
    description: "Bengali home-style meals, Kolkata rolls and traditional sweets handcrafted fresh each morning.",
    items: [dish("Bengali Mains", "Kosha Mangsho with Luchi", "Slow-cooked Bengali mutton curry with four fluffy luchis.", 399, "nonVeg", "biryani"), dish("Bengali Mains", "Mustard Fish Curry", "Rohu fish in a sharp mustard gravy served with steamed rice.", 329, "nonVeg", "healthy"), dish("Rolls", "Kolkata Egg Chicken Roll", "Flaky paratha wrapped around egg, spiced chicken, onion and lime.", 179, "nonVeg", "burgers"), dish("Sweets", "Nolen Gur Rasgulla", "Soft chenna dumplings sweetened with seasonal date-palm jaggery.", 139, "veg", "desserts"), dish("Sweets", "Mishti Doi", "Caramelised set yogurt in a traditional clay cup.", 89, "veg", "desserts")],
  },
  {
    name: "Delhi Darbar Kitchen", cuisines: ["North Indian", "Kebabs", "Parathas"], area: "Sector 29", city: "Gurugram", state: "Haryana", postalCode: "122001", line1: "SCO 34, Leisure Valley Road", phone: "9000010009", hours: ["07:30", "00:00"], deliveryFee: 35, minimumOrder: 169, eta: 31, rating: 4.5, ratingCount: 1945, cover: "biryani",
    description: "Delhi favourites from stuffed parathas and rajma chawal to charcoal kebabs and indulgent lassi.",
    items: [dish("Breakfast", "Aloo Paratha Platter", "Two stuffed parathas with curd, pickle and white butter.", 169), dish("Mains", "Rajma Chawal", "Slow-cooked kidney bean curry with steamed basmati rice.", 199, "vegan", "healthy"), dish("Mains", "Chole Bhature", "Spiced chickpeas with two pillowy bhature, pickle and onion.", 189, "vegan", "south-indian"), dish("Kebabs", "Afghani Chicken Tikka", "Creamy, mildly spiced chicken tikka cooked over charcoal.", 319, "nonVeg", "biryani"), dish("Drinks", "Rose Lassi", "Chilled yogurt drink with rose and cardamom.", 109, "veg", "desserts")],
  },
  {
    name: "Coastal Curry Café", cuisines: ["Coastal", "Seafood", "Kerala"], area: "Panampilly Nagar", city: "Kochi", state: "Kerala", postalCode: "682036", line1: "33, Main Avenue", phone: "9000010010", hours: ["08:00", "23:00"], deliveryFee: 29, minimumOrder: 179, eta: 34, rating: 4.7, ratingCount: 1533, cover: "south-indian",
    description: "Coastal recipes from Kerala and Mangaluru featuring seafood curries, appam and cooling regional drinks.",
    items: [dish("Seafood", "Kerala Fish Curry", "Seer fish simmered with kokum, coconut and roasted spices.", 349, "nonVeg", "healthy"), dish("Seafood", "Pepper Prawn Fry", "Juicy prawns tossed with black pepper, curry leaves and shallots.", 389, "nonVeg", "biryani"), dish("Breads", "Appam with Vegetable Stew", "Three lacy appams with a gentle coconut-milk vegetable stew.", 229, "vegan", "south-indian"), dish("Breads", "Neer Dosa", "Four delicate rice crêpes, soft and naturally gluten-free.", 139, "vegan", "south-indian"), dish("Drinks", "Kokum Coconut Cooler", "Kokum, tender coconut water and lime over ice.", 129, "vegan", "healthy")],
  },
];

const password = process.env.DEMO_OWNER_PASSWORD || "DemoOwner123";

await connectDatabase();
try {
  for (const [index, business] of businesses.entries()) {
    const email = `owner${index + 1}@plateful.demo`;
    let owner = await User.findOne({ email }).select("+passwordHash");
    if (!owner) owner = new User({ email, phone: business.phone, role: "restaurantOwner" });
    owner.name = `${business.name} Owner`;
    owner.phone = business.phone;
    owner.role = "restaurantOwner";
    owner.status = "active";
    await owner.setPassword(password);
    await owner.save();

    let restaurant = await Restaurant.findOne({ owner: owner.id });
    if (!restaurant) restaurant = new Restaurant({ owner: owner.id });
    Object.assign(restaurant, {
      name: business.name, description: business.description, cuisines: business.cuisines, contactPhone: business.phone,
      imageUrl: image(business.cover), coverImageUrl: image(business.cover),
      address: { line1: business.line1, area: business.area, city: business.city, state: business.state, postalCode: business.postalCode },
      openingTime: business.hours[0], closingTime: business.hours[1], status: "approved", isAcceptingOrders: true,
      deliveryFee: business.deliveryFee, minimumOrder: business.minimumOrder, estimatedDeliveryMinutes: business.eta,
      rating: business.rating, ratingCount: business.ratingCount, orderMode: "simulated",
    });
    await restaurant.save();

    await MenuItem.deleteMany({ restaurant: restaurant.id });
    await MenuCategory.deleteMany({ restaurant: restaurant.id });
    const categoryNames = [...new Set(business.items.map((item) => item.category))];
    const categories = await MenuCategory.insertMany(categoryNames.map((name, displayOrder) => ({ restaurant: restaurant.id, name, displayOrder })));
    const categoryIds = new Map(categories.map((category) => [category.name, category.id]));
    await MenuItem.insertMany(business.items.map(({ category, ...item }) => ({ ...item, restaurant: restaurant.id, category: categoryIds.get(category), isAvailable: true })));
    console.log(`Seeded ${business.name} (${business.items.length} menu items)`);
  }
  console.log(`Marketplace ready: ${businesses.length} restaurants and ${businesses.reduce((sum, business) => sum + business.items.length, 0)} menu items.`);
  console.log(`Demo owner password: ${password}`);
} finally {
  await disconnectDatabase();
}
