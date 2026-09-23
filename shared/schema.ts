import { pgTable, text, serial, uuid, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const states = pgTable("states", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
});

export const lgas = pgTable("lgas", {
  id: uuid("id").defaultRandom().primaryKey(),
  stateId: uuid("state_id"),
  name: text("name").notNull(),
  whatsappLink: text("whatsapp_link"),
  isActive: boolean("is_active").default(true),
});

export const estates = pgTable("estates", {
  id: uuid("id").defaultRandom().primaryKey(),
  lgaId: uuid("lga_id"),
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
  stateId: text("state_id"),
  lgaId: text("lga_id"),
  approved: boolean("approved").default(false),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  paystackRecipientCode: text("paystack_recipient_code"),
  accountNameVerified: text("account_name_verified"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id"),
  name: text("name"),
  price: numeric("price"),
  stock: integer("stock"),
  imageUrl: text("image_url"),
  lgaId: text("lga_id"),
  createdAt: timestamp("created_at").defaultNow(),
  vendorCost: integer("vendor_cost").default(0),
  category: text("category"),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderCode: text("order_code").unique(),
  customerId: uuid("customer_id"),
  estateId: text("estate_id"),
  lgaId: text("lga_id"),
  stateId: text("state_id"),
  staffId: uuid("staff_id"),
  totalAmount: numeric("total_amount"),
  deliveryFee: numeric("delivery_fee").default("400"),
  batchTime: text("batch_time"),
  paymentReference: text("payment_reference"),
  paymentStatus: text("payment_status"),
  vendorPaid: boolean("vendor_paid").default(false),
  status: text("status").default("paid"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id"),
  productId: uuid("product_id"),
  vendorId: uuid("vendor_id"),
  quantity: integer("quantity"),
  priceSnapshot: numeric("price_snapshot"),
  vendorCostSnapshot: integer("vendor_cost_snapshot").default(0),
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
  estateId: text("estate_id").notNull(),
  lgaId: text("lga_id").notNull(),
  stateId: text("state_id").notNull(),
  items: text("items").notNull(),
  totalAmount: integer("total_amount").notNull(),
  deliveryFee: integer("delivery_fee").notNull().default(400),
  status: text("status").notNull().default("pending"),
  orderId: uuid("order_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
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
