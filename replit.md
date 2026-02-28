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
- **Payments**: Paystack (real integration — customer payment via redirect, vendor settlement via Transfer API)
- **File Upload**: multer (product images stored in /uploads)

## System Roles
- **Customer**: Browse products, add to cart, checkout, pay via Paystack (auto-approved on signup)
- **Vendor**: Upload products (manual with image + CSV), view own products (requires admin approval)
- **Staff**: View LGA-isolated paid orders in batches, select orders, view per-vendor payout breakdown, trigger vendor settlement via Paystack Transfer, view/print receipts (requires admin approval)
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
- `products` - Vendor products with price, vendorCost, stock, category, imageUrl
- `orders` - With estate-based order codes (e.g. HAW-48378), LGA isolation, batch times
- `order_items` - Line items with price + vendor cost snapshots
- `vendor_payments` - Settlement records with transfer references

## Payment Flow
### Customer Payment (Paystack Checkout)
1. Customer fills checkout form → order created with status `pending_payment`
2. Backend calls Paystack Initialize Transaction API → returns authorization URL
3. Customer redirected to Paystack hosted checkout page
4. After payment, Paystack redirects to `/payment/callback?reference=xxx`
5. Backend verifies payment via Paystack Verify Transaction API
6. Order status updated to `paid`, payment reference stored

### Vendor Settlement (Paystack Transfer)
1. Staff selects paid orders → clicks "Pay Selected"
2. Backend calculates per-vendor amounts from order_items vendorCostSnapshot
3. Preview modal shows per-vendor breakdown with bank details
4. On confirm: Paystack Transfer Recipient created → Transfer initiated per vendor
5. `vendor_payments` records created with actual transfer references
6. Staff can view/print settlement receipts

## Key Features
- Supabase Auth with role-based redirect engine
- Real Paystack payment integration (customer checkout + vendor transfer)
- Estate-based order code generation (abbreviation + 5 digits)
- Fixed ₦400 delivery fee
- Batch grouping: 10AM, 1PM, 4PM
- Staff LGA-isolated dashboard (filters orders by staff's assigned LGA)
- Per-vendor payout breakdown in settlement modal
- Settlement receipt generation (viewable + printable)
- Vendor product image upload from phone
- CSV/POS import for vendor products
- Admin user approval UI with pending count badge

## Project Structure
```
client/src/
  pages/         - Home, Cart, Checkout, Success, PaymentCallback, Receipt, Auth, PendingApproval, VendorDashboard, StaffDashboard, AdminDashboard
  components/    - Navigation, ProductCard, ProtectedRoute, shadcn UI components
  hooks/         - use-auth, use-cart, use-products, use-orders, use-locations
  lib/           - supabase, queryClient, utils
shared/
  schema.ts      - Drizzle schema + Zod validation + types
  routes.ts      - API contract definitions
server/
  routes.ts      - Express API routes (auth, payments, upload, vendor-payout, receipts)
  storage.ts     - Database storage layer (IStorage interface)
  auth.ts        - JWT middleware (optionalAuth, requireAuth, requireRole)
  db.ts          - Database connection
uploads/         - Vendor product images (served statically)
```

## API Endpoints
- `GET /api/states`, `GET /api/states/:stateId/lgas`, `GET /api/lgas/:lgaId/estates` - Locations
- `GET /api/products`, `POST /api/products` - Products (vendor auth required for create)
- `POST /api/upload` - Image upload (auth required)
- `GET /api/orders`, `POST /api/orders`, `PATCH /api/orders/:id/status` - Orders
- `POST /api/payments/initialize` - Paystack payment initialization
- `POST /api/payments/verify` - Paystack payment verification
- `POST /api/vendor-payout/preview` - Per-vendor payout breakdown (staff only)
- `POST /api/vendor-payout` - Execute vendor settlement via Paystack Transfer (staff only)
- `GET /api/vendor-payments/:id/receipt` - Settlement receipt data
- `POST /api/auth/register`, `GET /api/auth/me` - Auth
- `GET /api/users`, `PATCH /api/users/:id/approve` - Admin user management

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
