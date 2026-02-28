import { db } from "./db";
import {
  states, lgas, estates, users, products, orders, orderItems, vendorPayments,
  type State, type Lga, type Estate, type User, type Product, type Order, type OrderItem, type VendorPayment
} from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  getStates(): Promise<State[]>;
  getLgas(stateId: number): Promise<Lga[]>;
  getEstates(lgaId: number): Promise<Estate[]>;
  getProducts(lgaId?: number): Promise<Product[]>;
  createProduct(product: Omit<Product, "id">): Promise<Product>;
  createUser(user: Omit<User, "id">): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserBySupabaseId(supabaseId: string): Promise<User | undefined>;
  getUsers(role?: string): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  getOrders(lgaId?: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: Omit<Order, "id" | "createdAt">): Promise<Order>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  markOrderVendorPaid(id: number): Promise<Order>;
  createOrderItems(items: Omit<OrderItem, "id">[]): Promise<OrderItem[]>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  getOrderItemsForOrders(orderIds: number[]): Promise<(OrderItem & { product: Product })[]>;
  createVendorPayment(payment: Omit<VendorPayment, "id" | "createdAt">): Promise<VendorPayment>;
  getVendorPayment(id: number): Promise<VendorPayment | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getStates(): Promise<State[]> {
    return await db.select().from(states);
  }
  async getLgas(stateId: number): Promise<Lga[]> {
    return await db.select().from(lgas).where(eq(lgas.stateId, stateId));
  }
  async getEstates(lgaId: number): Promise<Estate[]> {
    return await db.select().from(estates).where(eq(estates.lgaId, lgaId));
  }
  async getProducts(lgaId?: number): Promise<Product[]> {
    if (lgaId) {
      return await db.select().from(products).where(eq(products.lgaId, lgaId));
    }
    return await db.select().from(products);
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
  async markOrderVendorPaid(id: number): Promise<Order> {
    const [updated] = await db.update(orders)
      .set({ vendorPaid: true, status: 'ready_for_delivery' })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
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
}

export const storage = new DatabaseStorage();
