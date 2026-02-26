import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const existingStates = await storage.getStates();
  if (existingStates.length === 0) {
    const { db } = await import("./db");
    const { states, lgas, estates, users, products } = await import("@shared/schema");
    
    // Seed State
    const [state] = await db.insert(states).values({ name: "Lagos" }).returning();
    
    // Seed LGA
    const [lga] = await db.insert(lgas).values({ stateId: state.id, name: "Ikeja" }).returning();
    
    // Seed Estate
    await db.insert(estates).values({ lgaId: lga.id, name: "Hawai Estate", abbreviation: "HAW" });
    
    // Seed Admin & Vendor
    const [vendor] = await db.insert(users).values({ 
      name: "Vendor 1", phone: "08012345678", role: "vendor", stateId: state.id, lgaId: lga.id, approved: true 
    }).returning();
    
    // Seed Product
    await db.insert(products).values({
      vendorId: vendor.id,
      name: "Rice 5kg",
      price: 5000,
      vendorCost: 4500,
      stock: 20,
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300",
      lgaId: lga.id,
      category: "Grains"
    });
    
    await db.insert(products).values({
      vendorId: vendor.id,
      name: "Beans 2kg",
      price: 3000,
      vendorCost: 2700,
      stock: 15,
      imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=300",
      lgaId: lga.id,
      category: "Legumes"
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Seed DB on start
  seedDatabase().catch(console.error);

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

  app.post(api.products.create.path, async (req, res) => {
    try {
      // Assuming body is fully validated by schema
      const input = api.products.create.input.parse(req.body);
      const newProd = await storage.createProduct(input);
      res.status(201).json(newProd);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.orders.list.path, async (req, res) => {
    const ordList = await storage.getOrders();
    res.json(ordList);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      
      // Auto-create user if they don't exist
      let user = await storage.createUser({
        name: input.customer.name,
        phone: input.customer.phone,
        role: 'customer',
        stateId: input.customer.stateId ?? null,
        lgaId: input.customer.lgaId ?? null,
        approved: true
      });

      // Generate order code
      const randomStr = Math.floor(10000 + Math.random() * 90000).toString();
      const allEstates = await storage.getEstates(input.customer.lgaId || 0);
      const estate = allEstates.find(e => e.id === input.estateId);
      const abbreviation = estate?.abbreviation || "ORD";
      const orderCode = `${abbreviation}-${randomStr}`;

      // Calc total
      const totalAmount = input.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) + 400; 

      const order = await storage.createOrder({
        orderCode,
        customerId: user.id,
        estateId: input.estateId,
        lgaId: input.customer.lgaId || 0,
        stateId: input.customer.stateId || 0,
        staffId: null,
        totalAmount,
        deliveryFee: 400,
        status: 'pending_payment',
        vendorPaid: false,
        paymentReference: null,
        batchTime: '10AM',
      });

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    try {
      const input = api.orders.updateStatus.input.parse(req.body);
      const updated = await storage.updateOrderStatus(Number(req.params.id), input.status);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  return httpServer;
}
