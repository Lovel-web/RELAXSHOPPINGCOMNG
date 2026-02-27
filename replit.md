# RelaxShopping - LGA Marketplace Platform

## Overview
Multi-vendor marketplace platform with controlled logistics and automated vendor settlement. Built for Nigerian LGA (Local Government Area) communities, distributed via WhatsApp group links.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (Replit built-in) + Drizzle ORM
- **State**: Zustand (cart), TanStack Query (server state)
- **Routing**: wouter

## System Roles
- **Customer**: Browse products, add to cart, checkout, pay
- **Vendor**: Upload products (manual + CSV), view own products
- **Staff**: View LGA-isolated paid orders in batches, select orders, trigger vendor settlement
- **Admin**: Overview dashboard, monitor orders/products/payments

## Database Tables
- `states`, `lgas`, `estates` - Location hierarchy
- `users` - All roles with approval_status, bank details for vendors
- `products` - Vendor products with price, vendorCost, stock, category
- `orders` - With estate-based order codes (e.g. HAW-48378), LGA isolation, batch times
- `order_items` - Line items with price + vendor cost snapshots
- `vendor_payments` - Settlement records with transfer references

## Key Features
- Estate-based order code generation (first 3 letters of estate name + 5 digits)
- Fixed ₦400 delivery fee
- Batch grouping: 10AM, 1PM, 4PM
- Staff can only select orders & trigger payout (no editing amounts)
- CSV/POS import for vendor products

## Project Structure
```
client/src/
  pages/         - Home, Cart, Checkout, Success, VendorDashboard, StaffDashboard, AdminDashboard
  components/    - Navigation, ProductCard, shadcn UI components
  hooks/         - use-cart, use-products, use-orders, use-locations
  lib/           - queryClient, utils
shared/
  schema.ts      - Drizzle schema + Zod validation + types
  routes.ts      - API contract definitions
server/
  routes.ts      - Express API routes
  storage.ts     - Database storage layer (IStorage interface)
  db.ts          - Database connection
```

## Running
- `npm run dev` starts both Express backend and Vite frontend on port 5000
- Database synced via `npm run db:push` or direct SQL for schema changes

## Theme
- WhatsApp-inspired green (#25D366) primary color
- Fonts: Outfit (headings), Inter (body)
- Mobile-first with bottom navigation
