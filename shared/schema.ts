import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  floatBalance: integer("float_balance").default(0),
  assignedLgaId: integer("assigned_lga_id"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  lgaId: integer("lga_id").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderCode: text("order_code").notNull().unique(),
  customerId: integer("customer_id").notNull(),
  estateId: integer("estate_id").notNull(),
  staffId: integer("staff_id"),
  totalAmount: integer("total_amount").notNull(),
  deliveryFee: integer("delivery_fee").notNull().default(400),
  status: text("status").notNull().default('pending_payment'),
  paymentReference: text("payment_reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  priceSnapshot: integer("price_snapshot").notNull(),
});

export const pickupProofs = pgTable("pickup_proofs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  imageUrl: text("image_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Zod schemas
export const insertStateSchema = createInsertSchema(states).omit({ id: true });
export const insertLgaSchema = createInsertSchema(lgas).omit({ id: true });
export const insertEstateSchema = createInsertSchema(estates).omit({ id: true });
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
