# Plateful

Plateful is a production-ready MERN food-delivery marketplace with customer, restaurant-owner, rider, and administrator experiences. It includes menu discovery, dish search, cart and checkout, first-order discounts, Socket.IO order tracking, rider deliveries, restaurant referrals, commission accounting, restaurant operations, reviews, favorites, image uploads, and seeded marketplace data.

## Rider and marketplace model

- Customers pay a ₹5 platform fee at checkout.
- The first delivery kilometre is free; each additional started kilometre costs ₹10.
- Every second order received is marked for a 10% restaurant commission, collected only after that order is delivered.
- A rider who referred that restaurant earns 20% of Plateful's restaurant commission.
- An assigned delivery rider earns the customer delivery fee for that order.
- Riders apply from `/rider`, require administrator approval, can go online, accept ready-for-pickup deliveries, submit consented restaurant leads, and track delivery and referral earnings.

These defaults are centralized in `server/src/config/businessRules.js`.

Restaurant commission and rider earnings are stored in auditable ledgers. Administrators can mark rider earnings as paid; automated bank/UPI transfers and restaurant commission collection require a payment provider integration. Checkout currently uses the customer's estimated restaurant distance, so production distance enforcement should be connected to a trusted maps/geocoding provider.

## Architecture

- `client`: React 19 + Vite single-page application
- `server`: Express 5 API + Socket.IO
- Database: MongoDB / MongoDB Atlas
- Media: Cloudinary
- Email: Resend (optional)

Node.js 20 or newer is required. Node.js 22 is used by the production container.

## Local development

1. Copy `server/.env.example` to `server/.env`.
2. Copy `client/.env.example` to `client/.env` if the API does not use `http://localhost:5000`.
3. Start MongoDB or provide a MongoDB Atlas connection string.
4. Install dependencies and start both workspaces:

```bash
npm ci
npm run dev
```

The client runs at `http://localhost:5173`; the API runs at `http://localhost:5000`.

## Validation

```bash
npm run check
npm run build
```

## Seed data

```bash
npm run seed:admin -w server
npm run seed:marketplace -w server
```

The first command creates or updates the administrator configured in `server/.env`. The second creates or updates ten demo restaurants and their menus.

## Production deployment

### 1. Database

Create a MongoDB Atlas cluster and put its connection string in `MONGODB_URI`. Use a strong, unique database password. Hosts with dynamic outbound addresses may require `0.0.0.0/0` in the Atlas network access list.

### 2. Backend container (Back4app Containers)

The root `Dockerfile` runs only the API and supports the platform-provided `PORT` variable.

1. Create a Back4app Container app from this GitHub repository.
2. Keep the repository root as the build root.
3. Add the environment variables listed in `server/.env.example`.
4. Set `NODE_ENV=production`.
5. Set `CLIENT_ORIGIN` to the final Vercel URL. Multiple exact origins can be comma-separated.
6. Set `APP_URL` to the final public frontend URL.
7. Deploy and verify `https://YOUR-BACKEND/api/v1/health`.

Required production variables:

```dotenv
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
CLIENT_ORIGIN=https://YOUR-FRONTEND.vercel.app
APP_URL=https://YOUR-FRONTEND.vercel.app
ACCESS_TOKEN_SECRET=use-at-least-32-random-characters
REFRESH_TOKEN_SECRET=use-a-different-32-character-secret
ORDER_SIMULATION_ENABLED=true
ORDER_STATUS_INTERVAL_MS=60000
```

Cloudinary variables are required only for owner image uploads. Resend variables are optional.

### 3. Frontend (Vercel)

1. Import the same GitHub repository into Vercel.
2. Set the project root directory to `client`.
3. Add `VITE_API_URL=https://YOUR-BACKEND` without `/api/v1` or a trailing slash.
4. Deploy, then update the backend's `CLIENT_ORIGIN` and `APP_URL` with the exact Vercel URL.

`client/vercel.json` provides SPA fallback routing for direct visits to application routes.

## Security notes

- Secrets and local environment files are excluded from Git.
- Authentication endpoints are rate-limited.
- Refresh tokens use HTTP-only, Secure, SameSite=None cookies in production.
- CORS accepts only origins explicitly listed in `CLIENT_ORIGIN`.
- Image uploads are type-filtered and limited to 5 MB.
- The API terminates gracefully on container shutdown signals.

Never commit production secrets, MongoDB credentials, Cloudinary keys, Resend keys, or administrator passwords.
