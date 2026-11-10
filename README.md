# IIIT Mess Management

React/Vite client and Express/MongoDB API for student mess operations.

## Run locally

1. Start MongoDB locally, or set `USE_MEMORY_DB=true` in `backend/.env` for a persistent local MongoDB instance.
2. In `backend`, copy `.env.example` to `.env`, then run `npm install` and `npm run dev`.
3. In `frontend`, run `npm install` and `npm run dev`.
4. Open http://localhost:5173. Vite proxies `/api` and `/uploads` to the API on port 5000.

For local login accounts without clearing existing data, run `npm run seed:demo` in `backend`. If the demo emails already exist and only their demo passwords need resetting, run `npm run seed:demo:reset` (local development only). The full `npm run seed` command rebuilds the demo dataset and clears existing application collections; use it only with a disposable database.

## Deploy with Docker Compose

This stack serves the built app and API from one origin, and persists MongoDB data and complaint uploads in Docker volumes.

1. Install Docker Engine and the Docker Compose plugin on the deployment machine.
2. Copy `.env.example` to `.env`; replace `JWT_SECRET` and `QR_SECRET` with separate random secrets of at least 32 characters. Set `CLIENT_URL` to the public site origin (for example `https://mess.example.edu`) and `WEB_PORT` as needed.
3. From this directory run `docker compose up -d --build`.
4. Check `http://YOUR_HOST:WEB_PORT/api/health`. Put a TLS reverse proxy in front for public production use and set `CLIENT_URL` to its HTTPS origin.
5. To populate demo records on a fresh install, run `docker compose exec api node src/seed/seed.js`. The script prints demo credentials; change demo passwords before opening the service to users.

To update, pull the new source and run `docker compose up -d --build`. Back up the `mongo_data` volume before upgrades. `docker compose down` keeps data; `docker compose down -v` removes all persisted database and upload data.

## Production notes

- Never commit `.env` or publish seeded demo credentials.
- MongoDB is only reachable on the Compose network; do not publish its port.
- Payment collection is disabled until a payment provider is configured.
- For multi-instance/cloud deployments, use managed MongoDB and durable object storage for uploads.

## Deploy the frontend on Vercel

This repository is a monorepo. In Vercel, set the project **Root Directory** to `frontend` and keep **Include files outside the Root Directory** disabled. Vercel should detect Vite, run `npm run build`, and publish `dist`. `frontend/vercel.json` rewrites `/api/*` and `/uploads/*` to the Render API and browser routes to the SPA entry point. If you keep the Vercel Root Directory at the repository root, the root `vercel.json` builds `frontend` and publishes `frontend/dist` and includes the same rewrites.

The Express API is a separate service and is proxied through the Vercel rewrites above. Set the Render API service’s `CLIENT_URL` to the Vercel site origin (`https://messo-iota.vercel.app`) so its production CORS policy allows the browser app. If you prefer to call the API directly instead of using the Vercel proxy, set `VITE_API_URL` in Vercel to the public API base URL ending in `/api` and redeploy.
