import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const states = pgTable("states", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const lgas = pgTable("lgas", {
  id: serial("id").primaryKey(),
  stateId: integer("state_id").notNull(),
  name: text("name").notNull(),
});

export const estates = pgTable("estates", {
  id: serial("id").primaryKey(),
  lgaId: integer("lga_id").notNull(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull(), // 'admin' | 'vendor' | 'staff' | 'customer'
  stateId: integer("state_id"),
  lgaId: integer("lga_id"),
  approved: boolean("approved").default(false),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // Selling price to customer
  vendorCost: integer("vendor_cost").notNull().default(0), // Price paid to vendor
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  lgaId: integer("lga_id").notNull(),
  category: text("category"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderCode: text("order_code").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  estateId: integer("estate_id").notNull(),
  lgaId: integer("lga_id").notNull(),
  stateId: integer("state_id").notNull(),
  staffId: integer("staff_id"),
  totalAmount: integer("total_amount").notNull(),
  deliveryFee: integer("delivery_fee").notNull().default(400),
  status: text("status").notNull().default('pending_payment'), // 'pending_payment', 'paid', 'ready_for_delivery', 'delivered'
  vendorPaid: boolean("vendor_paid").default(false),
  paymentReference: text("payment_reference"),
  batchTime: text("batch_time"), // '10AM', '1PM', '4PM'
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  priceSnapshot: integer("price_snapshot").notNull(),
  vendorCostSnapshot: integer("vendor_cost_snapshot").notNull().default(0),
});

export const vendorPayments = pgTable("vendor_payments", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  staffId: integer("staff_id").notNull(),
  amount: integer("amount").notNull(),
  transferReference: text("transfer_reference").notNull(),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });

// Types
export type State = typeof states.$inferSelect;
export type Lga = typeof lgas.$inferSelect;
export type Estate = typeof estates.$inferSelect;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type VendorPayment = typeof vendorPayments.$inferSelect;
