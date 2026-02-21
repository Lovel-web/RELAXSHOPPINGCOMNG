import { db } from "./db";
import {
  states, lgas, estates, users, products, orders, orderItems,
  type State, type Lga, type Estate, type User, type Product, type Order
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getStates(): Promise<State[]>;
  getLgas(stateId: number): Promise<Lga[]>;
  getEstates(lgaId: number): Promise<Estate[]>;
  getProducts(lgaId?: number): Promise<Product[]>;
  createProduct(product: Omit<Product, "id">): Promise<Product>;
  createUser(user: Omit<User, "id">): Promise<User>;
  getOrders(): Promise<Order[]>;
  createOrder(order: Omit<Order, "id" | "createdAt">): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
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
  async getOrders(): Promise<Order[]> {
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
}

export const storage = new DatabaseStorage();
