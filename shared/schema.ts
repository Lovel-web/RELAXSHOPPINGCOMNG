import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const states = pgTable("states", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
});

export const lgas = pgTable("lgas", {
  id: serial("id").primaryKey(),
  stateId: integer("state_id").notNull(),
  name: text("name").notNull(),
  whatsappLink: text("whatsapp_link"),
  isActive: boolean("is_active").default(true),
});

export const estates = pgTable("estates", {
  id: serial("id").primaryKey(),
  lgaId: integer("lga_id").notNull(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  isActive: boolean("is_active").default(true),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseId: text("supabase_id").unique(),
  email: text("email"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull(),
  stateId: integer("state_id"),
  lgaId: integer("lga_id"),
  approved: boolean("approved").default(false),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  paystackRecipientCode: text("paystack_recipient_code"),
  accountNameVerified: text("account_name_verified"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  vendorCost: integer("vendor_cost").notNull().default(0),
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
  status: text("status").notNull().default('pending_payment'),
  vendorPaid: boolean("vendor_paid").default(false),
  paymentReference: text("payment_reference"),
  batchTime: text("batch_time"),
  claimedByStaffId: integer("claimed_by_staff_id"),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  priceSnapshot: integer("price_snapshot").notNull(),
  vendorCostSnapshot: integer("vendor_cost_snapshot").notNull().default(0),
  vendorPaid: boolean("vendor_paid").default(false),
});

export const vendorPayments = pgTable("vendor_payments", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  staffId: integer("staff_id").notNull(),
  amount: integer("amount").notNull(),
  transferReference: text("transfer_reference").notNull().unique(),
  receiptUrl: text("receipt_url"),
  itemsSnapshot: text("items_snapshot"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checkoutSessions = pgTable("checkout_sessions", {
  id: serial("id").primaryKey(),
  sessionRef: text("session_ref").notNull().unique(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  estateId: integer("estate_id").notNull(),
  lgaId: integer("lga_id").notNull(),
  stateId: integer("state_id").notNull(),
  items: text("items").notNull(),
  totalAmount: integer("total_amount").notNull(),
  deliveryFee: integer("delivery_fee").notNull().default(400),
  status: text("status").notNull().default('pending'),
  orderId: integer("order_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertCheckoutSessionSchema = createInsertSchema(checkoutSessions).omit({ id: true, createdAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });

export type State = typeof states.$inferSelect;
export type Lga = typeof lgas.$inferSelect;
export type Estate = typeof estates.$inferSelect;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type VendorPayment = typeof vendorPayments.$inferSelect;
export type CheckoutSession = typeof checkoutSessions.$inferSelect;
export type Settings = typeof settings.$inferSelect;
