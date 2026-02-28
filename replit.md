# RelaxShopping - LGA Marketplace Platform

## Overview
Multi-vendor marketplace platform with controlled logistics and automated vendor settlement. Built for Nigerian LGA (Local Government Area) communities, distributed via WhatsApp group links.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Replit built-in) + Drizzle ORM
- **Auth**: Supabase Auth (login/signup only, data stays in Replit DB)
- **State**: Zustand (cart), TanStack Query (server state)
- **Routing**: wouter
- **Payments**: Paystack (keys configured, integration simulated)

## System Roles
- **Customer**: Browse products, add to cart, checkout, pay (auto-approved on signup)
- **Vendor**: Upload products (manual + CSV), view own products (requires admin approval)
- **Staff**: View LGA-isolated paid orders in batches, select orders, trigger vendor settlement (requires admin approval)
- **Admin**: Overview dashboard, monitor orders/products/payments, approve vendor/staff accounts

## Auth Architecture
- Supabase handles email/password authentication only
- User profiles stored in Replit PostgreSQL `users` table with `supabase_id` foreign link
- Login flow: Supabase Auth → fetch profile from `/api/auth/me` → role-based redirect
- Signup flow: Supabase signUp → create profile via `/api/auth/register` → redirect
- Route protection via `<ProtectedRoute allowedRoles={[...]}>` component
- Vendor/staff accounts default to `approved=false`, require admin approval

## Database Tables
- `states`, `lgas`, `estates` - Location hierarchy
- `users` - All roles with supabase_id, email, approval status, bank details for vendors
- `products` - Vendor products with price, vendorCost, stock, category
- `orders` - With estate-based order codes (e.g. HAW-48378), LGA isolation, batch times
- `order_items` - Line items with price + vendor cost snapshots
- `vendor_payments` - Settlement records with transfer references

## Key Features
- Supabase Auth with role-based redirect engine
- Estate-based order code generation (first 3 letters of estate name + 5 digits)
- Fixed ₦400 delivery fee
- Batch grouping: 10AM, 1PM, 4PM
- Staff LGA-isolated dashboard (filters orders by staff's assigned LGA)
- Staff can only select orders & trigger payout (no editing amounts)
- CSV/POS import for vendor products
- Admin user approval UI with pending count badge

## Project Structure
```
client/src/
  pages/         - Home, Cart, Checkout, Success, Auth, PendingApproval, VendorDashboard, StaffDashboard, AdminDashboard
  components/    - Navigation, ProductCard, ProtectedRoute, shadcn UI components
  hooks/         - use-auth, use-cart, use-products, use-orders, use-locations
  lib/           - supabase, queryClient, utils
shared/
  schema.ts      - Drizzle schema + Zod validation + types
  routes.ts      - API contract definitions
server/
  routes.ts      - Express API routes (including /api/auth/register, /api/auth/me)
  storage.ts     - Database storage layer (IStorage interface)
  db.ts          - Database connection
```

## Environment Secrets
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_PAYSTACK_PUBLIC_KEY` - Paystack public key
- `PAYSTACK_SECRET_KEY` - Paystack secret key
- `PAYSTACK_WEBHOOK_SECRET` - Paystack webhook secret
- `SESSION_SECRET` - Express session secret

## Running
- `npm run dev` starts both Express backend and Vite frontend on port 5000
- Database synced via direct SQL for schema changes (avoid drizzle-kit interactive prompts)

## Theme
- WhatsApp-inspired green (#25D366) primary color
- Fonts: Outfit (headings), Inter (body)
- Mobile-first with bottom navigation
