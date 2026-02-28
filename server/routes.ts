import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { optionalAuth, requireAuth, requireRole } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

async function paystackRequest(endpoint: string, method: string, body?: any) {
  const res = await fetch(`https://api.paystack.co${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return await res.json();
}

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

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  }, express.static(uploadDir));

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

  // === FILE UPLOAD ===

  app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
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

      const allProducts = await storage.getProducts();
      const productMap = new Map(allProducts.map(p => [p.id, p]));

      let itemsTotal = 0;
      const orderItemsData: Array<{ productId: number; quantity: number; priceSnapshot: number; vendorCostSnapshot: number }> = [];
      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }
        const price = product.price;
        const vendorCost = product.vendorCost;
        itemsTotal += price * item.quantity;
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          priceSnapshot: price,
          vendorCostSnapshot: vendorCost,
        });
      }

      const totalAmount = itemsTotal + 400;

      const order = await storage.createOrder({
        orderCode, customerId, estateId: input.estateId,
        lgaId: input.customer.lgaId || 0, stateId: input.customer.stateId || 0,
        staffId: null, totalAmount, deliveryFee: 400,
        status: 'pending_payment', vendorPaid: false,
        paymentReference: null, batchTime: '10AM',
      });

      await storage.createOrderItems(
        orderItemsData.map(item => ({ ...item, orderId: order.id }))
      );

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error("Order create error:", err);
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

  // === PAYSTACK PAYMENT ===

  app.post('/api/payments/initialize', optionalAuth, async (req, res) => {
    try {
      const { orderId, email } = req.body;
      if (!orderId) {
        return res.status(400).json({ message: "orderId is required" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status !== 'pending_payment') {
        return res.status(400).json({ message: "Order already paid or processed" });
      }

      const customerEmail = email || `customer-${order.customerId}@relaxshopping.ng`;

      const callbackUrl = `${req.protocol}://${req.get('host')}/payment/callback`;

      const result = await paystackRequest('/transaction/initialize', 'POST', {
        amount: order.totalAmount * 100,
        email: customerEmail,
        reference: `${order.orderCode}-${Date.now()}`,
        callback_url: callbackUrl,
        metadata: {
          order_id: order.id,
          order_code: order.orderCode,
        },
      });

      if (!result.status) {
        return res.status(400).json({ message: result.message || "Failed to initialize payment" });
      }

      res.json({
        authorizationUrl: result.data.authorization_url,
        reference: result.data.reference,
        accessCode: result.data.access_code,
      });
    } catch (err) {
      console.error("Payment init error:", err);
      res.status(500).json({ message: "Failed to initialize payment" });
    }
  });

  app.post('/api/payments/verify', async (req, res) => {
    try {
      const { reference } = req.body;
      if (!reference) {
        return res.status(400).json({ message: "reference is required" });
      }

      const result = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, 'GET');

      if (!result.status || result.data.status !== 'success') {
        return res.status(400).json({
          message: "Payment not successful",
          paystackStatus: result.data?.status,
        });
      }

      const orderId = result.data.metadata?.order_id;
      const orderCode = result.data.metadata?.order_code;

      if (orderId) {
        await storage.updateOrder(orderId, {
          status: 'paid',
          paymentReference: reference,
        });
      }

      res.json({
        success: true,
        orderCode,
        orderId,
        amount: result.data.amount / 100,
      });
    } catch (err) {
      console.error("Payment verify error:", err);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // === VENDOR PAYOUT ===

  app.post('/api/vendor-payout/preview', requireAuth, requireRole("staff"), async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "orderIds required" });
      }

      const items = await storage.getOrderItemsForOrders(orderIds);
      
      const vendorTotals: Record<number, { vendorId: number; vendorName: string; bankName: string; accountNumber: string; amount: number }> = {};

      for (const item of items) {
        const vendorId = item.product.vendorId;
        if (!vendorTotals[vendorId]) {
          const vendor = await storage.getUserById(vendorId);
          vendorTotals[vendorId] = {
            vendorId,
            vendorName: vendor?.name || "Unknown Vendor",
            bankName: vendor?.bankName || "N/A",
            accountNumber: vendor?.accountNumber || "N/A",
            amount: 0,
          };
        }
        vendorTotals[vendorId].amount += item.vendorCostSnapshot * item.quantity;
      }

      const breakdown = Object.values(vendorTotals);
      const totalPayout = breakdown.reduce((sum, v) => sum + v.amount, 0);

      res.json({ breakdown, totalPayout, orderCount: orderIds.length });
    } catch (err) {
      console.error("Payout preview error:", err);
      res.status(500).json({ message: "Failed to generate preview" });
    }
  });

  app.post(api.vendorPayout.path, requireAuth, requireRole("staff"), async (req, res) => {
    try {
      const input = api.vendorPayout.input.parse(req.body);

      const items = await storage.getOrderItemsForOrders(input.orderIds);
      
      const vendorTotals: Record<number, { vendorId: number; amount: number; bankName: string; accountNumber: string; vendorName: string }> = {};

      for (const item of items) {
        const vendorId = item.product.vendorId;
        if (!vendorTotals[vendorId]) {
          const vendor = await storage.getUserById(vendorId);
          vendorTotals[vendorId] = {
            vendorId,
            amount: 0,
            bankName: vendor?.bankName || "",
            accountNumber: vendor?.accountNumber || "",
            vendorName: vendor?.name || "Unknown",
          };
        }
        vendorTotals[vendorId].amount += item.vendorCostSnapshot * item.quantity;
      }

      const paymentResults = [];

      for (const vendor of Object.values(vendorTotals)) {
        let transferRef = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        if (PAYSTACK_SECRET_KEY && vendor.bankName && vendor.accountNumber) {
          try {
            const recipientResult = await paystackRequest('/transferrecipient', 'POST', {
              type: "nuban",
              name: vendor.vendorName,
              account_number: vendor.accountNumber,
              bank_code: vendor.bankName,
              currency: "NGN",
            });

            if (recipientResult.status && recipientResult.data?.recipient_code) {
              const transferResult = await paystackRequest('/transfer', 'POST', {
                source: "balance",
                amount: vendor.amount * 100,
                recipient: recipientResult.data.recipient_code,
                reason: `Vendor payout for ${input.orderIds.length} orders`,
              });

              if (transferResult.status && transferResult.data?.transfer_code) {
                transferRef = transferResult.data.transfer_code;
              } else {
                console.warn(`Transfer failed for vendor ${vendor.vendorId}:`, transferResult.message);
              }
            } else {
              console.warn(`Transfer recipient creation failed for vendor ${vendor.vendorId}:`, recipientResult.message);
            }
          } catch (err) {
            console.error(`Paystack transfer failed for vendor ${vendor.vendorId}:`, err);
          }
        } else if (!vendor.bankName || !vendor.accountNumber) {
          console.warn(`Vendor ${vendor.vendorId} missing bank details, using local reference`);
        }

        const payment = await storage.createVendorPayment({
          vendorId: vendor.vendorId,
          staffId: req.user!.id,
          amount: vendor.amount,
          transferReference: transferRef,
          receiptUrl: null,
        });

        paymentResults.push({
          ...payment,
          vendorName: vendor.vendorName,
          bankName: vendor.bankName,
          accountNumber: vendor.accountNumber,
        });
      }

      for (const orderId of input.orderIds) {
        await storage.markOrderVendorPaid(orderId);
      }

      res.json({
        success: true,
        payments: paymentResults,
        ordersProcessed: input.orderIds.length,
      });
    } catch (err) {
      console.error("Payout error:", err);
      res.status(400).json({ message: "Payout failed" });
    }
  });

  // === RECEIPT ===

  app.get('/api/vendor-payments/:id/receipt', requireAuth, async (req, res) => {
    try {
      const payment = await storage.getVendorPayment(Number(req.params.id));
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      const vendor = await storage.getUserById(payment.vendorId);
      const staff = await storage.getUserById(payment.staffId);

      res.json({
        id: payment.id,
        vendorName: vendor?.name || "Unknown",
        vendorBank: vendor?.bankName || "N/A",
        vendorAccount: vendor?.accountNumber || "N/A",
        staffName: staff?.name || "Unknown",
        amount: payment.amount,
        transferReference: payment.transferReference,
        createdAt: payment.createdAt,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to load receipt" });
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
