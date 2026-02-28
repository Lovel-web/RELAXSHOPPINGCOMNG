import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { optionalAuth, requireAuth, requireRole } from "./auth";

async function seedDatabase() {
  const existingStates = await storage.getStates();
  if (existingStates.length === 0) {
    const { db } = await import("./db");
    const { states, lgas, estates, users, products } = await import("@shared/schema");
    
    const [state] = await db.insert(states).values({ name: "Lagos" }).returning();
    const [lga] = await db.insert(lgas).values({ stateId: state.id, name: "Ikeja" }).returning();
    await db.insert(estates).values({ lgaId: lga.id, name: "Hawai Estate", abbreviation: "HAW" });
    
    const [vendor] = await db.insert(users).values({ 
      name: "Vendor 1", phone: "08012345678", role: "vendor", stateId: state.id, lgaId: lga.id, approved: true 
    }).returning();
    
    await db.insert(products).values({
      vendorId: vendor.id, name: "Rice 5kg", price: 5000, vendorCost: 4500, stock: 20,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300",
      lgaId: lga.id, category: "Grains"
    });
    
    await db.insert(products).values({
      vendorId: vendor.id, name: "Beans 2kg", price: 3000, vendorCost: 2700, stock: 15,
      imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=300",
      lgaId: lga.id, category: "Legumes"
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  seedDatabase().catch(console.error);

  // === PUBLIC ROUTES (no auth required) ===

  app.get(api.locations.states.path, async (req, res) => {
    const allStates = await storage.getStates();
    res.json(allStates);
  });

  app.get(api.locations.lgas.path, async (req, res) => {
    const lgaList = await storage.getLgas(Number(req.params.stateId));
    res.json(lgaList);
  });

  app.get(api.locations.estates.path, async (req, res) => {
    const estateList = await storage.getEstates(Number(req.params.lgaId));
    res.json(estateList);
  });

  app.get(api.products.list.path, async (req, res) => {
    const lgaId = req.query.lgaId ? Number(req.query.lgaId) : undefined;
    const prodList = await storage.getProducts(lgaId);
    res.json(prodList);
  });

  // === AUTH ROUTES ===

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { supabaseId, email, name, phone, role, stateId, lgaId, bankName, accountNumber } = req.body;

      if (!supabaseId || !email || !name || !phone || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!["customer", "vendor", "staff"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const existing = await storage.getUserBySupabaseId(supabaseId);
      if (existing) {
        return res.json(existing);
      }

      const approved = role === "customer";

      const newUser = await storage.createUser({
        supabaseId, email, name, phone, role,
        stateId: stateId || null,
        lgaId: lgaId || null,
        approved,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
      });

      res.status(201).json(newUser);
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Failed to create user profile" });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    res.json(req.user);
  });

  // === AUTHENTICATED ROUTES ===

  app.post(api.products.create.path, requireAuth, requireRole("vendor"), async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = {
        ...input,
        vendorId: req.user!.id,
        lgaId: req.user!.lgaId || input.lgaId,
      };
      const newProd = await storage.createProduct(product);
      res.status(201).json(newProd);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.orders.list.path, requireAuth, async (req, res) => {
    if (req.user!.role === "staff") {
      const lgaOrders = await storage.getOrders(req.user!.lgaId || undefined);
      return res.json(lgaOrders);
    }
    if (req.user!.role === "admin") {
      const allOrders = await storage.getOrders();
      return res.json(allOrders);
    }
    const allOrders = await storage.getOrders();
    res.json(allOrders);
  });

  app.post(api.orders.create.path, optionalAuth, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      
      let customerId: number;
      if (req.user) {
        customerId = req.user.id;
      } else {
        const user = await storage.createUser({
          name: input.customer.name,
          phone: input.customer.phone,
          role: 'customer',
          stateId: input.customer.stateId ?? null,
          lgaId: input.customer.lgaId ?? null,
          approved: true,
          supabaseId: null,
          email: null,
          bankName: null,
          accountNumber: null,
        });
        customerId = user.id;
      }

      const randomStr = Math.floor(10000 + Math.random() * 90000).toString();
      const allEstates = await storage.getEstates(input.customer.lgaId || 0);
      const estate = allEstates.find(e => e.id === input.estateId);
      const abbreviation = estate?.abbreviation || "ORD";
      const orderCode = `${abbreviation}-${randomStr}`;

      const totalAmount = input.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) + 400; 

      const order = await storage.createOrder({
        orderCode, customerId, estateId: input.estateId,
        lgaId: input.customer.lgaId || 0, stateId: input.customer.stateId || 0,
        staffId: null, totalAmount, deliveryFee: 400,
        status: 'pending_payment', vendorPaid: false,
        paymentReference: null, batchTime: '10AM',
      });

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.orders.updateStatus.path, requireAuth, requireRole("staff", "admin"), async (req, res) => {
    try {
      const input = api.orders.updateStatus.input.parse(req.body);
      const updated = await storage.updateOrderStatus(Number(req.params.id), input.status);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post(api.vendorPayout.path, requireAuth, requireRole("staff"), async (req, res) => {
    try {
      const input = api.vendorPayout.input.parse(req.body);
      const results = [];

      for (const orderId of input.orderIds) {
        const updated = await storage.markOrderVendorPaid(orderId);
        results.push(updated);
      }

      const transferRef = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      res.json({
        success: true, transferReference: transferRef,
        ordersProcessed: results.length, orders: results,
      });
    } catch (err) {
      res.status(400).json({ message: "Payout failed" });
    }
  });

  // === ADMIN ROUTES ===

  app.get('/api/users', requireAuth, requireRole("admin"), async (req, res) => {
    const role = req.query.role as string | undefined;
    const allUsers = await storage.getUsers(role);
    res.json(allUsers);
  });

  app.patch('/api/users/:id/approve', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const updated = await storage.updateUser(Number(req.params.id), { approved: true });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Failed to approve user" });
    }
  });

  return httpServer;
}
