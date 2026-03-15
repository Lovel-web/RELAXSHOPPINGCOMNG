# RelaxShopping - LGA Marketplace Platform

## Overview
Geo-locked WhatsApp-driven, mobile-first LGA marketplace for Nigerian communities. Multi-role architecture (customer, vendor, staff, admin) with estate-based order codes (e.g. HAW-48378), LGA-isolated staff dashboards, Supabase auth with role-based redirects, automated vendor settlement via Paystack Transfer API, and a full Nigerian-resilient operational safety stack.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Replit built-in) + Drizzle ORM
- **Auth**: Supabase Auth (login/signup only, data stays in Replit DB)
- **State**: Zustand (cart), TanStack Query (server state)
- **Routing**: wouter
- **Payments**: Paystack (webhook-owned order creation, item-level vendor settlement via Transfer API)
- **File Upload**: multer (product images stored in /uploads)

## System Roles
- **Customer**: Browse products (LGA-locked), add to cart, checkout, pay via Paystack (auto-approved on signup)
- **Vendor**: Upload products (manual with image + CSV), edit/delete products, custom categories via "Other" option, view payment history/receipts, edit bank details with Paystack re-verification, see assigned State→LGA location (requires admin approval)
- **Staff**: LGA-isolated 4-tab dashboard (Batch Board, Vendor Pickup, Delivery, WhatsApp), item-level vendor settlement, order claiming, batch locking (requires admin approval)
- **Admin**: Overview dashboard, user management (approve/block/deactivate/reassign with detail views), hierarchical location drill-down (state→LGA→estate with pause/resume/delete), finance panel with settlement toggle + system mode controller

## Auth Architecture
- Supabase handles email/password authentication only
- User profiles stored in Replit PostgreSQL `users` table with `supabase_id` foreign link
- Login flow: Supabase Auth → fetch profile from `/api/auth/me` → role-based redirect
- Separate signup pages: /join (customer), /vendor-signup (vendor with bank verification), /staff-signup (staff)
- Forgot password: /forgot-password → sends Supabase reset email → /reset-password page with new password form
- Route protection via `<ProtectedRoute allowedRoles={[...]}>` component
- Vendor/staff accounts default to `approved=false`, require admin approval
- Minimum password length: 8 characters (enforced client-side on all forms)

## Database Tables
- `states`, `lgas`, `estates` - Location hierarchy with isActive soft-delete, estate abbreviations, LGA WhatsApp links
- `users` - All roles with supabase_id, email, approval status, bank details, paystackRecipientCode, accountNameVerified
- `products` - Vendor products with price, vendorCost, stock, category, imageUrl, lgaId
- `orders` - Webhook-created orders with estate-based codes, claimedByStaffId, batch times
- `order_items` - Line items with price + vendor cost snapshots + vendorPaid boolean (item-level settlement)
- `vendor_payments` - Settlement records with transfer references (UNIQUE), itemsSnapshot audit trail
- `checkout_sessions` - Pre-order sessions for webhook-owned order creation + soft stock reservation
- `settings` - Key-value store for system_mode, settlement_enabled, locked_batches

## Payment Flow
### Customer Payment (Webhook-Owned)
1. Customer fills checkout → POST /api/checkout/initialize
2. Location hierarchy validation (estate→LGA→state chain verified)
3. Soft stock reservation (available = stock - active reservations from pending sessions)
4. Checkout session created with price snapshots from DB (never from client)
5. Paystack Initialize Transaction → redirect to hosted checkout
6. Paystack webhook (charge.success) → signature validated → amount verified → order created from snapshot
7. Stock deducted atomically, order code generated, batch assigned
8. Frontend polls GET /api/payments/status/:reference (fallback verify if webhook missed)

### Vendor Settlement (Item-Level, Row-Locked)
1. Staff selects accepted orders → preview shows per-vendor breakdown
2. POST /api/vendor-payout in DB transaction:
   - SELECT order_items FOR UPDATE WHERE vendorPaid=false
   - Group by vendor, calculate from vendorCostSnapshot
   - Create vendor_payment with itemsSnapshot audit trail
   - Mark items vendorPaid=true
   - When ALL items paid → order auto-transitions to ready_for_delivery
3. Idempotent via UNIQUE transfer_reference
4. Uses pre-created paystackRecipientCode (verified on vendor signup)

## Safety Stack
- **Estate hierarchy validation**: estate.lgaId must match provided lgaId, lga.stateId must match provided stateId
- **Staff claim locking**: accepted orders locked to claiming staff, only claimer can mark delivered
- **Paystack bank verification**: resolve account + create transfer recipient on vendor signup
- **Soft stock reservation**: pending checkout sessions reserve stock for 15 minutes
- **Background payment reconciler**: 5-min setInterval checks stale sessions, verifies via Paystack API
- **Row-locked item-level settlement**: SELECT FOR UPDATE prevents double-payment
- **Batch freeze**: staff locks current batch, new orders go to next batch
- **System mode controller**: normal/maintenance/emergency (blocks checkout/settlements as appropriate)
- **Settlement toggle**: admin can disable all vendor payouts
- **Soft-delete locations**: isActive flag, blocked if active vendors/pending orders exist
- **Location pause guard**: Paused locations block checkout server-side; users in paused locations see "area on hold" message
- **Role-aware navigation**: Admin/staff/vendor see Dashboard+Logout only; customers see Shop+Cart+Logout

## Project Structure
```
client/src/
  pages/         - Landing, JoinCustomer, Home, Cart, Checkout, Success, PaymentCallback, Receipt, Auth, ForgotPassword, ResetPassword, PendingApproval, VendorSignup, StaffSignup, VendorDashboard, StaffDashboard, AdminDashboard
  components/    - Navigation, ProductCard, ProtectedRoute, shadcn UI components
  hooks/         - use-auth, use-cart, use-products, use-orders, use-locations, use-toast
  lib/           - supabase, queryClient, utils
shared/
  schema.ts      - Drizzle schema + Zod validation + types
server/
  routes.ts      - Express API routes (all endpoints)
  storage.ts     - Database storage layer (IStorage interface)
  auth.ts        - JWT middleware (optionalAuth, requireAuth, requireRole)
  db.ts          - Database connection
uploads/         - Vendor product images (served statically)
```

## API Endpoints
### Public
- `GET /api/states`, `GET /api/states/:stateId/lgas`, `GET /api/lgas/:lgaId/estates`, `GET /api/lgas/:id` - Locations
- `GET /api/products?lgaId=X` - Products (LGA-filtered)
- `POST /api/auth/register`, `GET /api/auth/me` - Auth

### Authenticated
- `POST /api/upload` - Image upload
- `POST /api/products` - Create product (vendor, auto-assigns lgaId)
- `PATCH /api/products/:id` - Update product (vendor, owner-only)
- `DELETE /api/products/:id` - Delete product (vendor, owner-only, blocked if active orders exist)
- `GET /api/vendor/payments` - Vendor payment history (vendor-only)
- `PATCH /api/profile/bank` - Update bank details with Paystack re-verification (vendor-only)
- `GET /api/orders` - Orders (role-filtered)
- `PATCH /api/orders/:id/status` - State machine transitions
- `POST /api/checkout/initialize` - Start payment flow
- `GET /api/payments/status/:reference` - Poll payment status
- `POST /api/payments/webhook` - Paystack webhook (signature-validated)

### Staff
- `POST /api/orders/items-bulk` - Enriched order items (LGA-enforced)
- `POST /api/vendor-payout/preview` - Settlement breakdown
- `POST /api/vendor-payout` - Execute settlement
- `POST /api/batches/lock`, `POST /api/batches/unlock`, `GET /api/batches/status` - Batch management

### Admin
- `GET /api/users`, `GET /api/users/:id`, `PATCH /api/users/:id/approve` - User management
- `PATCH /api/users/:id/block` - Block user (set approved=false)
- `DELETE /api/users/:id` - Deactivate user (soft-delete: approved=false, supabaseId=null)
- `DELETE /api/users/:id/permanent` - Permanently delete user (removes from both local DB and Supabase Auth)
- `PATCH /api/users/:id/reassign` - Reassign user location (stateId+lgaId)
- `GET /api/users/:id/orders` - User order history
- `POST /api/states`, `POST /api/lgas`, `POST /api/estates` - Create locations
- `DELETE /api/states/:id`, `DELETE /api/lgas/:id`, `DELETE /api/estates/:id` - Soft-delete locations
- `PATCH /api/{states,lgas,estates}/:id/pause` - Pause location (cascades to children)
- `PATCH /api/{states,lgas,estates}/:id/resume` - Resume location (cascades to children)
- `DELETE /api/{states,lgas,estates}/:id/permanent` - Hard delete location + unlink users
- `GET /api/admin/states`, `GET /api/admin/states/:id/lgas`, `GET /api/admin/lgas/:id/estates` - All locations (inc. paused)
- `GET /api/states/:id/summary`, `GET /api/lgas/:id/summary` - Location stats
- `GET /api/vendor-payments` - All settlements with audit trail
- `GET /api/settings/:key`, `PATCH /api/settings/:key` - System settings

## Environment Secrets
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_PAYSTACK_PUBLIC_KEY` - Paystack public key
- `PAYSTACK_SECRET_KEY` - Paystack secret key
- `PAYSTACK_WEBHOOK_SECRET` - Paystack webhook secret
- `SESSION_SECRET` - Express session secret
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations like permanent user deletion)

## Running
- `npm run dev` starts both Express backend and Vite frontend on port 5000
- Database synced via direct SQL for schema changes

## Theme
- WhatsApp-inspired green (#25D366) primary color
- Fonts: Outfit (headings), Inter (body)
- Mobile-first with bottom navigation
