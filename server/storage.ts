import { db } from "./db";
import { pool } from "./db";
import {
  states, lgas, estates, users, products, orders, orderItems, vendorPayments, checkoutSessions, settings,
  type State, type Lga, type Estate, type User, type Product, type Order, type OrderItem, type VendorPayment, type CheckoutSession, type Settings
} from "@shared/schema";
import { eq, and, inArray, sql, lt, ne } from "drizzle-orm";

export interface IStorage {
  getStates(): Promise<State[]>;
  getLgas(stateId: number): Promise<Lga[]>;
  getLga(id: number): Promise<Lga | undefined>;
  getEstates(lgaId: number): Promise<Estate[]>;
  getEstate(id: number): Promise<Estate | undefined>;
  getProducts(lgaId?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: Omit<Product, "id">): Promise<Product>;
  createUser(user: Omit<User, "id">): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserBySupabaseId(supabaseId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(role?: string): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  getOrders(lgaId?: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByCode(code: string): Promise<Order | undefined>;
  createOrder(order: Omit<Order, "id" | "createdAt">): Promise<Order>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  createOrderItems(items: Omit<OrderItem, "id">[]): Promise<OrderItem[]>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  getOrderItemsForOrders(orderIds: number[]): Promise<(OrderItem & { product: Product })[]>;
  createVendorPayment(payment: Omit<VendorPayment, "id" | "createdAt">): Promise<VendorPayment>;
  getVendorPayment(id: number): Promise<VendorPayment | undefined>;
  getVendorPayments(): Promise<VendorPayment[]>;
  createCheckoutSession(session: Omit<CheckoutSession, "id" | "createdAt">): Promise<CheckoutSession>;
  getCheckoutSessionByRef(ref: string): Promise<CheckoutSession | undefined>;
  updateCheckoutSession(id: number, data: Partial<CheckoutSession>): Promise<CheckoutSession>;
  getActiveReservations(productId: number): Promise<number>;
  getStaleCheckoutSessions(): Promise<CheckoutSession[]>;
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<void>;
  createState(name: string): Promise<State>;
  createLga(data: { stateId: number; name: string; whatsappLink?: string }): Promise<Lga>;
  createEstate(data: { lgaId: number; name: string; abbreviation: string }): Promise<Estate>;
  deactivateState(id: number): Promise<void>;
  deactivateLga(id: number): Promise<void>;
  deactivateEstate(id: number): Promise<void>;
  hasActiveVendorsInLga(lgaId: number): Promise<boolean>;
  hasPendingOrdersInLga(lgaId: number): Promise<boolean>;
  getOrdersByCustomerId(customerId: number): Promise<Order[]>;
  getOrdersByStaffId(staffId: number): Promise<Order[]>;
  getUsersByState(stateId: number): Promise<User[]>;
  getUsersByLga(lgaId: number): Promise<User[]>;
  getStatesAll(): Promise<State[]>;
  getLgasAll(stateId: number): Promise<Lga[]>;
  getEstatesAll(lgaId: number): Promise<Estate[]>;
  deleteUser(id: number): Promise<void>;
  reactivateState(id: number): Promise<void>;
  reactivateLga(id: number): Promise<void>;
  reactivateEstate(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getStates(): Promise<State[]> {
    return await db.select().from(states).where(ne(states.isActive, false));
  }
  async getLgas(stateId: number): Promise<Lga[]> {
    return await db.select().from(lgas).where(and(eq(lgas.stateId, stateId), ne(lgas.isActive, false)));
  }
  async getLga(id: number): Promise<Lga | undefined> {
    const [lga] = await db.select().from(lgas).where(eq(lgas.id, id));
    return lga;
  }
  async getEstates(lgaId: number): Promise<Estate[]> {
    return await db.select().from(estates).where(and(eq(estates.lgaId, lgaId), ne(estates.isActive, false)));
  }
  async getEstate(id: number): Promise<Estate | undefined> {
    const [estate] = await db.select().from(estates).where(eq(estates.id, id));
    return estate;
  }
  async getProducts(lgaId?: number): Promise<Product[]> {
    if (lgaId) {
      return await db.select().from(products).where(eq(products.lgaId, lgaId));
    }
    return await db.select().from(products);
  }
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }
  async createUser(user: Omit<User, "id">): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }
  async getUserBySupabaseId(supabaseId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.supabaseId, supabaseId));
    return user;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getUsers(role?: string): Promise<User[]> {
    if (role) {
      return await db.select().from(users).where(eq(users.role, role));
    }
    return await db.select().from(users);
  }
  async updateUser(id: number, user: Partial<User>): Promise<User> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }
  async getOrders(lgaId?: number): Promise<Order[]> {
    if (lgaId) {
      return await db.select().from(orders).where(eq(orders.lgaId, lgaId));
    }
    return await db.select().from(orders);
  }
  async createOrder(order: Omit<Order, "id" | "createdAt">): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  async getOrderByCode(code: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderCode, code));
    return order;
  }
  async updateOrder(id: number, data: Partial<Order>): Promise<Order> {
    const [updated] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return updated;
  }
  async createOrderItems(items: Omit<OrderItem, "id">[]): Promise<OrderItem[]> {
    if (items.length === 0) return [];
    return await db.insert(orderItems).values(items).returning();
  }
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
  async getOrderItemsForOrders(orderIds: number[]): Promise<(OrderItem & { product: Product })[]> {
    if (orderIds.length === 0) return [];
    const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
    const productIds = [...new Set(items.map(i => i.productId))];
    const productList = productIds.length > 0
      ? await db.select().from(products).where(inArray(products.id, productIds))
      : [];
    const productMap = new Map(productList.map(p => [p.id, p]));
    return items.map(item => ({
      ...item,
      product: productMap.get(item.productId)!,
    }));
  }
  async createVendorPayment(payment: Omit<VendorPayment, "id" | "createdAt">): Promise<VendorPayment> {
    const [vp] = await db.insert(vendorPayments).values(payment).returning();
    return vp;
  }
  async getVendorPayment(id: number): Promise<VendorPayment | undefined> {
    const [vp] = await db.select().from(vendorPayments).where(eq(vendorPayments.id, id));
    return vp;
  }
  async getVendorPayments(): Promise<VendorPayment[]> {
    return await db.select().from(vendorPayments);
  }
  async createCheckoutSession(session: Omit<CheckoutSession, "id" | "createdAt">): Promise<CheckoutSession> {
    const [cs] = await db.insert(checkoutSessions).values(session).returning();
    return cs;
  }
  async getCheckoutSessionByRef(ref: string): Promise<CheckoutSession | undefined> {
    const [cs] = await db.select().from(checkoutSessions).where(eq(checkoutSessions.sessionRef, ref));
    return cs;
  }
  async updateCheckoutSession(id: number, data: Partial<CheckoutSession>): Promise<CheckoutSession> {
    const [cs] = await db.update(checkoutSessions).set(data).where(eq(checkoutSessions.id, id)).returning();
    return cs;
  }
  async getActiveReservations(productId: number): Promise<number> {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const sessions = await db.select().from(checkoutSessions)
      .where(and(
        eq(checkoutSessions.status, 'pending'),
        sql`${checkoutSessions.createdAt} > ${fifteenMinAgo}`
      ));
    let reserved = 0;
    for (const s of sessions) {
      try {
        const items = JSON.parse(s.items) as Array<{ productId: number; quantity: number }>;
        for (const item of items) {
          if (item.productId === productId) {
            reserved += item.quantity;
          }
        }
      } catch { }
    }
    return reserved;
  }
  async getStaleCheckoutSessions(): Promise<CheckoutSession[]> {
    const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000);
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    return await db.select().from(checkoutSessions)
      .where(and(
        eq(checkoutSessions.status, 'pending'),
        sql`${checkoutSessions.createdAt} < ${threeMinAgo}`,
        sql`${checkoutSessions.createdAt} > ${fifteenMinAgo}`
      ));
  }
  async getSetting(key: string): Promise<string | undefined> {
    const [s] = await db.select().from(settings).where(eq(settings.key, key));
    return s?.value;
  }
  async setSetting(key: string, value: string): Promise<void> {
    const existing = await db.select().from(settings).where(eq(settings.key, key));
    if (existing.length > 0) {
      await db.update(settings).set({ value }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value });
    }
  }
  async createState(name: string): Promise<State> {
    const [s] = await db.insert(states).values({ name }).returning();
    return s;
  }
  async createLga(data: { stateId: number; name: string; whatsappLink?: string }): Promise<Lga> {
    const [l] = await db.insert(lgas).values(data).returning();
    return l;
  }
  async createEstate(data: { lgaId: number; name: string; abbreviation: string }): Promise<Estate> {
    const [e] = await db.insert(estates).values(data).returning();
    return e;
  }
  async deactivateState(id: number): Promise<void> {
    await db.update(states).set({ isActive: false }).where(eq(states.id, id));
  }
  async deactivateLga(id: number): Promise<void> {
    await db.update(lgas).set({ isActive: false }).where(eq(lgas.id, id));
  }
  async deactivateEstate(id: number): Promise<void> {
    await db.update(estates).set({ isActive: false }).where(eq(estates.id, id));
  }
  async hasActiveVendorsInLga(lgaId: number): Promise<boolean> {
    const vendors = await db.select().from(users).where(and(eq(users.lgaId, lgaId), eq(users.role, 'vendor'), eq(users.approved, true)));
    return vendors.length > 0;
  }
  async hasPendingOrdersInLga(lgaId: number): Promise<boolean> {
    const pending = await db.select().from(orders).where(and(eq(orders.lgaId, lgaId), sql`${orders.status} NOT IN ('delivered')`));
    return pending.length > 0;
  }
  async getOrdersByCustomerId(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId));
  }
  async getOrdersByStaffId(staffId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.claimedByStaffId, staffId));
  }
  async getUsersByState(stateId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.stateId, stateId));
  }
  async getUsersByLga(lgaId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.lgaId, lgaId));
  }
  async getStatesAll(): Promise<State[]> {
    return await db.select().from(states);
  }
  async getLgasAll(stateId: number): Promise<Lga[]> {
    return await db.select().from(lgas).where(eq(lgas.stateId, stateId));
  }
  async getEstatesAll(lgaId: number): Promise<Estate[]> {
    return await db.select().from(estates).where(eq(estates.lgaId, lgaId));
  }
  async deleteUser(id: number): Promise<void> {
    await db.update(users).set({ approved: false, supabaseId: null }).where(eq(users.id, id));
  }
  async reactivateState(id: number): Promise<void> {
    await db.update(states).set({ isActive: true }).where(eq(states.id, id));
  }
  async reactivateLga(id: number): Promise<void> {
    await db.update(lgas).set({ isActive: true }).where(eq(lgas.id, id));
  }
  async reactivateEstate(id: number): Promise<void> {
    await db.update(estates).set({ isActive: true }).where(eq(estates.id, id));
  }
}

export const storage = new DatabaseStorage();
