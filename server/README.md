# Hotel Management API (Node.js + Express + Prisma + MySQL)

## Setup
1. Create a `.env` file with your DB and secrets (see keys below).
2. Install deps:
```bash
npm i
```
3. Generate Prisma client and migrate DB:
```bash
npx prisma generate
npx prisma migrate dev --name init
```
4. Seed dev data:
```bash
node prisma/seed.js
```
5. Run the API:
```bash
npm run dev
```

### .env keys
```
DATABASE_URL="mysql://Edmond:edmond0553050084#@localhost:3306/hotel_db"
JWT_SECRET="replace-with-long-random-secret"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

## Endpoints (base `/api`)
- POST `/auth/signup` → { token, user }
- POST `/auth/signin` → { token, user }
- GET `/auth/me` (Bearer token) → user
- GET `/guest/reservations` (auth)
- POST `/guest/requests` (auth)
- GET `/guest/invoices` (auth)
- GET `/admin/rooms` (admin)
- POST `/admin/rooms` (admin)
- GET `/admin/stats` (admin)

Ensure `VITE_API_URL=http://localhost:4000/api` in the frontend.

