import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { optionalAuth, requireAuth, requireRole } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import crypto from "crypto";
import { pool } from "./db";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || PAYSTACK_SECRET_KEY;

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

const VALID_TRANSITIONS: Record<string, string[]> = {
  'pending_payment': ['paid'],
  'paid': ['accepted'],
  'accepted': ['ready_for_delivery'],
  'ready_for_delivery': ['delivered'],
};

function getBatchTime(): string {
  const hour = new Date().getHours();
  if (hour < 10) return '10AM';
  if (hour < 13) return '1PM';
  return '4PM';
}

function getBatchKey(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  return `${date}-${getBatchTime()}`;
}

async function generateUniqueOrderCode(abbreviation: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = `${abbreviation}-${Math.floor(10000 + Math.random() * 90000)}`;
    const existing = await storage.getOrderByCode(code);
    if (!existing) return code;
  }
  return `${abbreviation}-${Date.now().toString().slice(-5)}`;
}

async function createOrderFromSession(session: any): Promise<any> {
  const items = JSON.parse(session.items) as Array<{
    productId: number; quantity: number; priceSnapshot: number;
    vendorCostSnapshot: number; vendorId: number;
  }>;

  const estate = await storage.getEstate(session.estateId);
  const abbreviation = estate?.abbreviation || "ORD";
  const orderCode = await generateUniqueOrderCode(abbreviation);

  let batchTime = getBatchTime();
  const lockedBatchesStr = await storage.getSetting('locked_batches');
  if (lockedBatchesStr) {
    try {
      const locked = JSON.parse(lockedBatchesStr) as string[];
      const currentKey = getBatchKey();
      if (locked.includes(currentKey)) {
        const batches = ['10AM', '1PM', '4PM'];
        const currentIdx = batches.indexOf(batchTime);
        batchTime = batches[Math.min(currentIdx + 1, batches.length - 1)];
      }
    } catch { }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let customerId = session.customerId;
    if (!customerId) {
      const userResult = await client.query(
        `INSERT INTO users (name, phone, role, state_id, lga_id, approved, email)
         VALUES ($1, $2, 'customer', $3, $4, true, $5) RETURNING id`,
        [session.customerName, session.customerPhone, session.stateId, session.lgaId, session.customerEmail]
      );
      customerId = userResult.rows[0].id;
    }

    const orderResult = await client.query(
      `INSERT INTO orders (order_code, customer_id, estate_id, lga_id, state_id, total_amount, delivery_fee, status, vendor_paid, payment_reference, batch_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'paid', false, $8, $9) RETURNING *`,
      [orderCode, customerId, session.estateId, session.lgaId, session.stateId, session.totalAmount, session.deliveryFee, session.sessionRef, batchTime]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_snapshot, vendor_cost_snapshot, vendor_paid)
         VALUES ($1, $2, $3, $4, $5, false)`,
        [order.id, item.productId, item.quantity, item.priceSnapshot, item.vendorCostSnapshot]
      );
    }

    for (const item of items) {
      const stockResult = await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
        [item.quantity, item.productId]
      );
      if (stockResult.rowCount === 0) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    await client.query(
      `UPDATE checkout_sessions SET status = 'completed' WHERE id = $1`,
      [session.id]
    );

    await client.query('COMMIT');

    return {
      id: order.id,
      orderCode: order.order_code,
      status: order.status,
      totalAmount: order.total_amount,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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

  const adminExists = (await storage.getUsers('admin')).length > 0;
  if (!adminExists) {
    const adminSupabaseId = process.env.ADMIN_SUPABASE_ID || null;
    const adminEmail = process.env.ADMIN_EMAIL || 'gameunpareil@gmail.com';
    await storage.createUser({
      name: 'Admin',
      phone: '00000000000',
      role: 'admin',
      approved: true,
      supabaseId: adminSupabaseId,
      email: adminEmail,
      stateId: null,
      lgaId: null,
      bankName: null,
      accountNumber: null,
      paystackRecipientCode: null,
      accountNameVerified: null,
    });
    console.log('Admin user bootstrapped');
  }
}

function startReconciler() {
  setInterval(async () => {
    try {
      const staleSessions = await storage.getStaleCheckoutSessions();
      for (const session of staleSessions) {
        try {
          const result = await paystackRequest(`/transaction/verify/${encodeURIComponent(session.sessionRef)}`, 'GET');
          if (result.status && result.data?.status === 'success') {
            const amountPaid = result.data.amount / 100;
            if (amountPaid >= session.totalAmount) {
              await createOrderFromSession(session);
              console.log(`Reconciler: created order for session ${session.sessionRef}`);
            }
          } else if (result.data?.status === 'failed' || result.data?.status === 'abandoned') {
            await storage.updateCheckoutSession(session.id, { status: 'expired' });
          }
        } catch (err) {
          console.error(`Reconciler error for ${session.sessionRef}:`, err);
        }
      }
    } catch (err) {
      console.error('Reconciler cycle error:', err);
    }
  }, 5 * 60 * 1000);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  seedDatabase().catch(console.error);
  startReconciler();

  app.use("/uploads", (_req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  }, express.static(uploadDir));

  // === PUBLIC ROUTES ===

  app.get('/api/states', async (_req, res) => {
    const allStates = await storage.getStates();
    res.json(allStates);
  });

  app.get('/api/states/:stateId/lgas', async (req, res) => {
    const lgaList = await storage.getLgas(Number(req.params.stateId));
    res.json(lgaList);
  });

  app.get('/api/lgas/:lgaId/estates', async (req, res) => {
    const estateList = await storage.getEstates(Number(req.params.lgaId));
    res.json(estateList);
  });

  app.get('/api/lgas/:id', async (req, res) => {
    const lga = await storage.getLga(Number(req.params.id));
    if (!lga) return res.status(404).json({ message: "LGA not found" });
    const estateList = await storage.getEstates(lga.id);
    res.json({ ...lga, estates: estateList });
  });

  app.get('/api/products', async (req, res) => {
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

      let paystackRecipientCode: string | null = null;
      let accountNameVerified: string | null = null;

      if (role === "vendor" && bankName && accountNumber && PAYSTACK_SECRET_KEY) {
        try {
          const resolveResult = await paystackRequest(
            `/bank/resolve?account_number=${accountNumber}&bank_code=${bankName}`, 'GET'
          );
          if (resolveResult.status && resolveResult.data?.account_name) {
            accountNameVerified = resolveResult.data.account_name;

            const recipientResult = await paystackRequest('/transferrecipient', 'POST', {
              type: "nuban",
              name: resolveResult.data.account_name,
              account_number: accountNumber,
              bank_code: bankName,
              currency: "NGN",
            });
            if (recipientResult.status && recipientResult.data?.recipient_code) {
              paystackRecipientCode = recipientResult.data.recipient_code;
            }
          }
        } catch (err) {
          console.warn("Bank verification failed during signup:", err);
        }
      }

      const newUser = await storage.createUser({
        supabaseId, email, name, phone, role,
        stateId: stateId || null,
        lgaId: lgaId || null,
        approved,
        bankName: bankName || null,
        accountNumber: accountNumber || null,
        paystackRecipientCode,
        accountNameVerified,
      });

      res.status(201).json(newUser);
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Failed to create user profile" });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    const user = req.user!;
    let locationPaused = false;
    if (user.stateId) {
      const state = await storage.getStatesAll().then(ss => ss.find(s => s.id === user.stateId));
      if (state && state.isActive === false) locationPaused = true;
    }
    if (!locationPaused && user.lgaId) {
      const lga = await storage.getLga(user.lgaId);
      if (lga && lga.isActive === false) locationPaused = true;
    }
    res.json({ ...user, locationPaused });
  });

  // === FILE UPLOAD ===

  app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // === PRODUCTS ===

  app.post('/api/products', requireAuth, requireRole("vendor"), async (req, res) => {
    try {
      if (!req.user!.lgaId) {
        return res.status(400).json({ message: "Your location is not configured. Contact admin." });
      }
      const { name, price, vendorCost, stock, category, imageUrl } = req.body;
      if (!name || !price) {
        return res.status(400).json({ message: "Name and price are required" });
      }
      const product = {
        vendorId: req.user!.id,
        name,
        price: Number(price),
        vendorCost: Number(vendorCost || Math.round(Number(price) * 0.9)),
        stock: Number(stock || 0),
        lgaId: req.user!.lgaId,
        category: category || null,
        imageUrl: imageUrl || null,
      };
      const newProd = await storage.createProduct(product);
      res.status(201).json(newProd);
    } catch (err) {
      console.error("Product create error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch('/api/products/:id', requireAuth, requireRole("vendor"), async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.vendorId !== req.user!.id) return res.status(403).json({ message: "Not your product" });
      const { name, price, vendorCost, stock, category, imageUrl } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (price !== undefined) {
        updates.price = Number(price);
        updates.vendorCost = vendorCost !== undefined ? Number(vendorCost) : Math.round(Number(price) * 0.9);
      } else if (vendorCost !== undefined) {
        updates.vendorCost = Number(vendorCost);
      }
      if (stock !== undefined) updates.stock = Number(stock);
      if (category !== undefined) updates.category = category;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;
      const updated = await storage.updateProduct(productId, updates);
      res.json(updated);
    } catch (err) {
      console.error("Product update error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/products/:id', requireAuth, requireRole("vendor"), async (req, res) => {
    try {
      const productId = Number(req.params.id);
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (product.vendorId !== req.user!.id) return res.status(403).json({ message: "Not your product" });
      const { rows } = await pool.query(
        `SELECT COUNT(*) as cnt FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.product_id = $1 AND o.status NOT IN ('delivered', 'cancelled')`,
        [productId]
      );
      if (rows[0]?.cnt > 0) {
        return res.status(400).json({ message: "Cannot delete product with active orders. Wait until all orders are delivered." });
      }
      await storage.deleteProduct(productId);
      res.json({ success: true });
    } catch (err) {
      console.error("Product delete error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/vendor/payments', requireAuth, requireRole("vendor"), async (req, res) => {
    try {
      const payments = await storage.getVendorPaymentsByVendor(req.user!.id);
      payments.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
      res.json(payments);
    } catch (err) {
      console.error("Vendor payments fetch error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch('/api/profile/bank', requireAuth, requireRole("vendor"), async (req, res) => {
    try {
      const { bankName, accountNumber } = req.body;
      if (!bankName || !accountNumber) {
        return res.status(400).json({ message: "Bank name and account number are required" });
      }
      let paystackRecipientCode: string | null = null;
      let accountNameVerified: string | null = null;
      if (PAYSTACK_SECRET_KEY) {
        try {
          const resolveResult = await paystackRequest(
            `/bank/resolve?account_number=${accountNumber}&bank_code=${bankName}`, 'GET'
          );
          if (resolveResult.status && resolveResult.data?.account_name) {
            accountNameVerified = resolveResult.data.account_name;
            const recipientResult = await paystackRequest('/transferrecipient', 'POST', {
              type: "nuban",
              name: resolveResult.data.account_name,
              account_number: accountNumber,
              bank_code: bankName,
              currency: "NGN",
            });
            if (recipientResult.status && recipientResult.data?.recipient_code) {
              paystackRecipientCode = recipientResult.data.recipient_code;
            }
          }
        } catch (err) {
          console.warn("Bank verification failed during update:", err);
        }
      }
      const updated = await storage.updateUser(req.user!.id, {
        bankName,
        accountNumber,
        accountNameVerified,
        paystackRecipientCode,
      });
      res.json(updated);
    } catch (err) {
      console.error("Bank update error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === ORDERS ===

  app.get('/api/orders', requireAuth, async (req, res) => {
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

  app.get('/api/staff/delivery-stats', requireAuth, requireRole("staff"), async (req, res) => {
    try {
      const staffOrders = await storage.getOrdersByStaffId(req.user!.id);
      const delivered = staffOrders.filter(o => o.status === "delivered");
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const twoWeeks = 14 * 24 * 60 * 60 * 1000;
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      const week = delivered.filter(o => o.createdAt && (now - new Date(o.createdAt).getTime()) <= oneWeek).length;
      const twoWeek = delivered.filter(o => o.createdAt && (now - new Date(o.createdAt).getTime()) <= twoWeeks).length;
      const month = delivered.filter(o => o.createdAt && (now - new Date(o.createdAt).getTime()) <= oneMonth).length;
      const total = delivered.length;
      res.json({ week, twoWeek, month, total });
    } catch (err) {
      console.error("Staff delivery stats error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch('/api/orders/:id/status', requireAuth, requireRole("staff", "admin"), async (req, res) => {
    try {
      const { status } = req.body;
      const orderId = Number(req.params.id);
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (req.user!.role === "staff" && order.lgaId !== req.user!.lgaId) {
        return res.status(403).json({ message: "This order is not in your LGA" });
      }

      const allowed = VALID_TRANSITIONS[order.status];
      if (!allowed || !allowed.includes(status)) {
        return res.status(400).json({ message: `Cannot transition from ${order.status} to ${status}` });
      }

      if (status === 'accepted') {
        if (order.claimedByStaffId && order.claimedByStaffId !== req.user!.id) {
          return res.status(400).json({ message: "This order is already claimed by another staff member" });
        }
        await storage.updateOrder(orderId, {
          status: 'accepted',
          claimedByStaffId: req.user!.id,
          claimedAt: new Date(),
        });
      } else if (status === 'delivered') {
        if (order.claimedByStaffId !== req.user!.id && req.user!.role !== "admin") {
          return res.status(400).json({ message: "Only the claiming staff can mark as delivered" });
        }
        const items = await storage.getOrderItems(orderId);
        const allPaid = items.every(i => i.vendorPaid);
        if (!allPaid) {
          return res.status(400).json({ message: "Cannot deliver: not all vendors have been paid" });
        }
        await storage.updateOrderStatus(orderId, 'delivered');
      } else {
        await storage.updateOrderStatus(orderId, status);
      }

      const updated = await storage.getOrder(orderId);
      res.json(updated);
    } catch (err) {
      console.error("Status update error:", err);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post('/api/orders/items-bulk', requireAuth, requireRole("staff", "admin"), async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "orderIds required" });
      }

      if (req.user!.role === "staff") {
        const ordersData = await Promise.all(orderIds.map((id: number) => storage.getOrder(id)));
        for (const o of ordersData) {
          if (o && o.lgaId !== req.user!.lgaId) {
            return res.status(403).json({ message: "Cannot access orders outside your LGA" });
          }
        }
      }

      const items = await storage.getOrderItemsForOrders(orderIds);
      const vendorIds = [...new Set(items.map(i => i.product.vendorId))];
      const vendors = await Promise.all(vendorIds.map(id => storage.getUserById(id)));
      const vendorMap = new Map(vendors.filter(Boolean).map(v => [v!.id, v!]));

      const enriched = items.map(item => ({
        ...item,
        vendorName: vendorMap.get(item.product.vendorId)?.name || "Unknown",
      }));

      res.json(enriched);
    } catch (err) {
      console.error("Bulk items error:", err);
      res.status(500).json({ message: "Failed to load items" });
    }
  });

  // === CHECKOUT & PAYMENT (WEBHOOK-OWNED) ===

  app.post('/api/checkout/initialize', optionalAuth, async (req, res) => {
    try {
      const systemMode = await storage.getSetting('system_mode');
      if (systemMode === 'maintenance') {
        return res.status(503).json({ message: "System is under maintenance. Please try again later." });
      }
      if (systemMode === 'emergency') {
        return res.status(503).json({ message: "System is temporarily unavailable." });
      }

      const { customer, estateId, items, email } = req.body;
      if (!customer || !estateId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const estate = await storage.getEstate(estateId);
      if (!estate) return res.status(400).json({ message: "Invalid estate" });
      if (estate.isActive === false) return res.status(400).json({ message: "This estate is currently paused. Shopping is temporarily unavailable." });

      const lga = await storage.getLga(estate.lgaId);
      if (!lga) return res.status(400).json({ message: "Invalid LGA" });
      if (lga.isActive === false) return res.status(400).json({ message: "This area is currently paused. Shopping is temporarily unavailable." });

      const stateCheck = (await storage.getStatesAll()).find(s => s.id === lga.stateId);
      if (stateCheck && stateCheck.isActive === false) return res.status(400).json({ message: "This region is currently paused. Shopping is temporarily unavailable." });

      if (customer.lgaId && customer.lgaId !== estate.lgaId) {
        return res.status(400).json({ message: "Estate does not belong to the selected LGA" });
      }
      if (customer.stateId && customer.stateId !== lga.stateId) {
        return res.status(400).json({ message: "LGA does not belong to the selected State" });
      }

      const sessionItems: Array<{
        productId: number; quantity: number; priceSnapshot: number;
        vendorCostSnapshot: number; vendorId: number;
      }> = [];
      let itemsTotal = 0;

      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }
        const activeReservations = await storage.getActiveReservations(product.id);
        const availableStock = product.stock - activeReservations;
        if (availableStock < item.quantity) {
          return res.status(400).json({ message: `${product.name}: only ${Math.max(0, availableStock)} available (${activeReservations} reserved)` });
        }
        sessionItems.push({
          productId: product.id,
          quantity: item.quantity,
          priceSnapshot: product.price,
          vendorCostSnapshot: product.vendorCost,
          vendorId: product.vendorId,
        });
        itemsTotal += product.price * item.quantity;
      }

      const deliveryFee = 400;
      const totalAmount = itemsTotal + deliveryFee;

      const abbreviation = estate.abbreviation || "ORD";
      const sessionRef = `${abbreviation}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const customerEmail = email || customer.email || `${customer.phone || 'guest'}@relaxshopping.ng`;

      const callbackUrl = `${req.protocol}://${req.get('host')}/payment/callback`;

      const paystackResult = await paystackRequest('/transaction/initialize', 'POST', {
        amount: totalAmount * 100,
        email: customerEmail,
        reference: sessionRef,
        callback_url: callbackUrl,
        metadata: { session_ref: sessionRef },
      });

      if (!paystackResult.status) {
        return res.status(400).json({ message: paystackResult.message || "Failed to initialize payment" });
      }

      await storage.createCheckoutSession({
        sessionRef,
        customerId: req.user?.id || null,
        customerName: customer.name || "Guest",
        customerPhone: customer.phone || "",
        customerEmail,
        estateId,
        lgaId: estate.lgaId,
        stateId: lga.stateId,
        items: JSON.stringify(sessionItems),
        totalAmount,
        deliveryFee,
        status: 'pending',
        orderId: null,
      });

      res.json({
        authorizationUrl: paystackResult.data.authorization_url,
        reference: paystackResult.data.reference,
        accessCode: paystackResult.data.access_code,
      });
    } catch (err) {
      console.error("Checkout init error:", err);
      res.status(500).json({ message: "Failed to initialize checkout" });
    }
  });

  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const rawBody = (req as any).rawBody ? (req as any).rawBody.toString('utf8') : JSON.stringify(req.body);
      const signature = req.headers['x-paystack-signature'] as string;

      if (PAYSTACK_WEBHOOK_SECRET && signature) {
        const hash = crypto.createHmac('sha512', PAYSTACK_WEBHOOK_SECRET).update(rawBody).digest('hex');
        if (hash !== signature) {
          console.warn('Invalid webhook signature');
          return res.status(401).json({ message: "Invalid signature" });
        }
      }

      const event = JSON.parse(rawBody);
      if (event.event !== 'charge.success') {
        return res.sendStatus(200);
      }

      const reference = event.data?.reference;
      if (!reference) return res.sendStatus(200);

      const session = await storage.getCheckoutSessionByRef(reference);
      if (!session) {
        console.warn(`Webhook: no session for ref ${reference}`);
        return res.sendStatus(200);
      }

      if (session.status === 'completed') {
        return res.sendStatus(200);
      }

      const amountPaid = event.data.amount / 100;
      if (amountPaid < session.totalAmount) {
        console.warn(`Amount mismatch: paid ${amountPaid}, expected ${session.totalAmount}`);
        return res.sendStatus(200);
      }

      await createOrderFromSession(session);
      res.sendStatus(200);
    } catch (err) {
      console.error("Webhook error:", err);
      res.sendStatus(200);
    }
  });

  app.get('/api/payments/status/:reference', async (req, res) => {
    try {
      const reference = req.params.reference;
      const session = await storage.getCheckoutSessionByRef(reference);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.status === 'completed' && session.orderId) {
        const order = await storage.getOrder(session.orderId);
        return res.json({
          status: 'completed',
          orderCode: order?.orderCode,
          orderId: session.orderId,
        });
      }

      if (session.status === 'pending') {
        const result = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, 'GET');
        if (result.status && result.data?.status === 'success') {
          const amountPaid = result.data.amount / 100;
          if (amountPaid >= session.totalAmount) {
            const order = await createOrderFromSession(session);
            return res.json({
              status: 'completed',
              orderCode: order.orderCode,
              orderId: order.id,
            });
          }
        }
        return res.json({ status: 'pending' });
      }

      return res.json({ status: session.status });
    } catch (err) {
      console.error("Payment status error:", err);
      res.status(500).json({ message: "Failed to check status" });
    }
  });

  // === VENDOR PAYOUT (ITEM-LEVEL) ===

  app.post('/api/vendor-payout/preview', requireAuth, requireRole("staff"), async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "orderIds required" });
      }

      for (const oid of orderIds) {
        const order = await storage.getOrder(oid);
        if (order && order.lgaId !== req.user!.lgaId) {
          return res.status(403).json({ message: "Cannot access orders outside your LGA" });
        }
      }

      const items = await storage.getOrderItemsForOrders(orderIds);
      const unpaidItems = items.filter(i => !i.vendorPaid);

      const vendorTotals: Record<number, {
        vendorId: number; vendorName: string; bankName: string;
        accountNumber: string; accountNameVerified: string | null;
        recipientCode: string | null; amount: number;
        items: Array<{ productName: string; qty: number; unitCost: number }>;
      }> = {};

      for (const item of unpaidItems) {
        const vendorId = item.product.vendorId;
        if (!vendorTotals[vendorId]) {
          const vendor = await storage.getUserById(vendorId);
          vendorTotals[vendorId] = {
            vendorId,
            vendorName: vendor?.name || "Unknown Vendor",
            bankName: vendor?.bankName || "N/A",
            accountNumber: vendor?.accountNumber || "N/A",
            accountNameVerified: vendor?.accountNameVerified || null,
            recipientCode: vendor?.paystackRecipientCode || null,
            amount: 0,
            items: [],
          };
        }
        vendorTotals[vendorId].amount += item.vendorCostSnapshot * item.quantity;
        vendorTotals[vendorId].items.push({
          productName: item.product.name,
          qty: item.quantity,
          unitCost: item.vendorCostSnapshot,
        });
      }

      const breakdown = Object.values(vendorTotals);
      const totalPayout = breakdown.reduce((sum, v) => sum + v.amount, 0);

      res.json({ breakdown, totalPayout, orderCount: orderIds.length });
    } catch (err) {
      console.error("Payout preview error:", err);
      res.status(500).json({ message: "Failed to generate preview" });
    }
  });

  app.post('/api/vendor-payout', requireAuth, requireRole("staff"), async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "orderIds required" });
      }

      const settlementEnabled = await storage.getSetting('settlement_enabled');
      if (settlementEnabled === 'false') {
        return res.status(400).json({ message: "Settlements are temporarily disabled by admin" });
      }

      const systemMode = await storage.getSetting('system_mode');
      if (systemMode === 'emergency') {
        return res.status(400).json({ message: "Settlements blocked during emergency mode" });
      }

      for (const oid of orderIds) {
        const order = await storage.getOrder(oid);
        if (order && order.lgaId !== req.user!.lgaId) {
          return res.status(403).json({ message: "Cannot access orders outside your LGA" });
        }
      }

      const client = await pool.connect();
      const paymentResults = [];

      try {
        await client.query('BEGIN');

        const itemsResult = await client.query(
          `SELECT oi.*, p.vendor_id, p.name as product_name
           FROM order_items oi
           JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = ANY($1) AND oi.vendor_paid = false
           FOR UPDATE OF oi`,
          [orderIds]
        );

        if (itemsResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: "No unpaid items found" });
        }

        const vendorGroups: Record<number, {
          vendorId: number; amount: number;
          itemIds: number[];
          snapshotItems: Array<{ productName: string; qty: number; vendorCost: number }>;
          orderIdsSet: Set<number>;
        }> = {};

        for (const row of itemsResult.rows) {
          const vendorId = row.vendor_id;
          if (!vendorGroups[vendorId]) {
            vendorGroups[vendorId] = { vendorId, amount: 0, itemIds: [], snapshotItems: [], orderIdsSet: new Set() };
          }
          vendorGroups[vendorId].amount += row.vendor_cost_snapshot * row.quantity;
          vendorGroups[vendorId].itemIds.push(row.id);
          vendorGroups[vendorId].orderIdsSet.add(row.order_id);
          vendorGroups[vendorId].snapshotItems.push({
            productName: row.product_name,
            qty: row.quantity,
            vendorCost: row.vendor_cost_snapshot,
          });
        }

        for (const group of Object.values(vendorGroups)) {
          const vendor = await storage.getUserById(group.vendorId);
          const transferRef = `STL-${group.vendorId}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

          const existingCheck = await client.query(
            'SELECT id FROM vendor_payments WHERE transfer_reference = $1', [transferRef]
          );
          if (existingCheck.rows.length > 0) continue;

          let finalRef = transferRef;

          if (PAYSTACK_SECRET_KEY && vendor?.paystackRecipientCode) {
            try {
              const transferResult = await paystackRequest('/transfer', 'POST', {
                source: "balance",
                amount: group.amount * 100,
                recipient: vendor.paystackRecipientCode,
                reason: `Vendor payout - ${group.itemIds.length} items`,
                reference: transferRef,
              });
              if (transferResult.status && transferResult.data?.transfer_code) {
                finalRef = transferResult.data.transfer_code;
              }
            } catch (err) {
              console.error(`Transfer failed for vendor ${group.vendorId}:`, err);
            }
          }

          const itemsSnapshot = JSON.stringify(group.snapshotItems);

          await client.query(
            `INSERT INTO vendor_payments (vendor_id, staff_id, amount, transfer_reference, items_snapshot)
             VALUES ($1, $2, $3, $4, $5)`,
            [group.vendorId, req.user!.id, group.amount, finalRef, itemsSnapshot]
          );

          await client.query(
            `UPDATE order_items SET vendor_paid = true WHERE id = ANY($1)`,
            [group.itemIds]
          );

          for (const orderId of group.orderIdsSet) {
            const unpaidCheck = await client.query(
              `SELECT COUNT(*) FROM order_items WHERE order_id = $1 AND vendor_paid = false`,
              [orderId]
            );
            if (parseInt(unpaidCheck.rows[0].count) === 0) {
              await client.query(
                `UPDATE orders SET status = 'ready_for_delivery' WHERE id = $1 AND status = 'accepted'`,
                [orderId]
              );
            }
          }

          paymentResults.push({
            vendorId: group.vendorId,
            vendorName: vendor?.name || "Unknown",
            amount: group.amount,
            transferReference: finalRef,
          });
        }

        await client.query('COMMIT');

        res.json({
          success: true,
          payments: paymentResults,
          ordersProcessed: orderIds.length,
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Payout error:", err);
      res.status(400).json({ message: "Payout failed" });
    }
  });

  // === BATCH MANAGEMENT ===

  app.post('/api/batches/lock', requireAuth, requireRole("staff"), async (req, res) => {
    try {
      const batchKey = getBatchKey();
      const lockedStr = await storage.getSetting('locked_batches') || '[]';
      const locked = JSON.parse(lockedStr) as string[];
      if (!locked.includes(batchKey)) {
        locked.push(batchKey);
        await storage.setSetting('locked_batches', JSON.stringify(locked));
      }
      res.json({ locked: true, batchKey });
    } catch (err) {
      res.status(500).json({ message: "Failed to lock batch" });
    }
  });

  app.post('/api/batches/unlock', requireAuth, requireRole("staff"), async (req, res) => {
    try {
      const batchKey = getBatchKey();
      const lockedStr = await storage.getSetting('locked_batches') || '[]';
      const locked = JSON.parse(lockedStr) as string[];
      const filtered = locked.filter(k => k !== batchKey);
      await storage.setSetting('locked_batches', JSON.stringify(filtered));
      res.json({ locked: false, batchKey });
    } catch (err) {
      res.status(500).json({ message: "Failed to unlock batch" });
    }
  });

  app.get('/api/batches/status', requireAuth, requireRole("staff", "admin"), async (_req, res) => {
    try {
      const lockedStr = await storage.getSetting('locked_batches') || '[]';
      const locked = JSON.parse(lockedStr) as string[];
      const currentKey = getBatchKey();
      res.json({ locked, currentBatch: currentKey, isCurrentLocked: locked.includes(currentKey) });
    } catch (err) {
      res.status(500).json({ message: "Failed to get batch status" });
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
        accountNameVerified: vendor?.accountNameVerified || null,
        staffName: staff?.name || "Unknown",
        amount: payment.amount,
        transferReference: payment.transferReference,
        itemsSnapshot: payment.itemsSnapshot ? JSON.parse(payment.itemsSnapshot) : null,
        createdAt: payment.createdAt,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to load receipt" });
    }
  });

  // === SETTINGS (ADMIN) ===

  app.get('/api/settings/:key', requireAuth, requireRole("admin"), async (req, res) => {
    const value = await storage.getSetting(req.params.key);
    if (value === undefined) return res.status(404).json({ message: "Setting not found" });
    res.json({ key: req.params.key, value });
  });

  app.patch('/api/settings/:key', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { value } = req.body;
      if (value === undefined) return res.status(400).json({ message: "value required" });
      await storage.setSetting(req.params.key, String(value));
      res.json({ key: req.params.key, value: String(value) });
    } catch (err) {
      res.status(500).json({ message: "Failed to update setting" });
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

  app.get('/api/vendor-payments', requireAuth, requireRole("admin"), async (_req, res) => {
    try {
      const payments = await storage.getVendorPayments();
      const enriched = await Promise.all(payments.map(async (p) => {
        const vendor = await storage.getUserById(p.vendorId);
        const staff = await storage.getUserById(p.staffId);
        return {
          ...p,
          vendorName: vendor?.name || "Unknown",
          staffName: staff?.name || "Unknown",
          itemsSnapshot: p.itemsSnapshot ? JSON.parse(p.itemsSnapshot) : null,
        };
      }));
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ message: "Failed to load payments" });
    }
  });

  app.post('/api/states', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Name required" });
      const state = await storage.createState(name);
      res.status(201).json(state);
    } catch (err) {
      res.status(500).json({ message: "Failed to create state" });
    }
  });

  app.post('/api/lgas', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { stateId, name, whatsappLink } = req.body;
      if (!stateId || !name) return res.status(400).json({ message: "stateId and name required" });
      const lga = await storage.createLga({ stateId, name, whatsappLink });
      res.status(201).json(lga);
    } catch (err) {
      res.status(500).json({ message: "Failed to create LGA" });
    }
  });

  app.post('/api/estates', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const { lgaId, name, abbreviation } = req.body;
      if (!lgaId || !name || !abbreviation) return res.status(400).json({ message: "lgaId, name, and abbreviation required" });
      const estate = await storage.createEstate({ lgaId, name, abbreviation });
      res.status(201).json(estate);
    } catch (err) {
      res.status(500).json({ message: "Failed to create estate" });
    }
  });

  app.delete('/api/states/:id', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.deactivateState(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to deactivate state" });
    }
  });

  app.delete('/api/lgas/:id', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const lgaId = Number(req.params.id);
      if (await storage.hasActiveVendorsInLga(lgaId)) {
        return res.status(400).json({ message: "Cannot deactivate: active vendors exist in this LGA" });
      }
      if (await storage.hasPendingOrdersInLga(lgaId)) {
        return res.status(400).json({ message: "Cannot deactivate: pending orders exist in this LGA" });
      }
      await storage.deactivateLga(lgaId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to deactivate LGA" });
    }
  });

  app.delete('/api/estates/:id', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.deactivateEstate(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to deactivate estate" });
    }
  });

  // === ADMIN USER MANAGEMENT ===

  app.get('/api/users/:id', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const user = await storage.getUserById(Number(req.params.id));
      if (!user) return res.status(404).json({ message: "User not found" });
      const state = user.stateId ? await storage.getEstate(user.stateId) : null;
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.delete('/api/users/:id', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot deactivate your own account" });
      }
      await storage.deactivateUser(userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  app.delete('/api/users/:id/permanent', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const targetUser = await storage.getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceRoleKey && targetUser.email) {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });
          let matchingUsers: any[] = [];
          let page = 1;
          let hasMore = true;
          const targetEmail = targetUser.email!.toLowerCase();
          while (hasMore) {
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
            const users = listData?.users || [];
            const found = users.filter((u: any) => u.email?.toLowerCase() === targetEmail);
            matchingUsers.push(...found);
            hasMore = users.length === 100;
            page++;
            if (page > 10) break;
          }
          if (matchingUsers.length > 0) {
            for (const authUser of matchingUsers) {
              console.log(`Deleting Supabase Auth user: ${authUser.id} (email: ${authUser.email})`);
              const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
              if (delErr) {
                console.error(`Failed to delete Supabase Auth user ${authUser.id}:`, delErr.message);
              }
            }
          } else if (targetUser.supabaseId) {
            console.log(`No Supabase Auth user found by email, trying by supabaseId: ${targetUser.supabaseId}`);
            const { error: fallbackErr } = await supabaseAdmin.auth.admin.deleteUser(targetUser.supabaseId);
            if (fallbackErr) {
              console.error("Supabase Auth fallback delete warning:", fallbackErr.message);
            }
          } else {
            console.log("No Supabase Auth user found for email:", targetUser.email);
          }
        } catch (supaErr: any) {
          console.error("Supabase Auth delete exception:", supaErr?.message || supaErr);
        }
      }
      await storage.deleteUserPermanent(userId);
      res.json({ success: true });
    } catch (err) {
      console.error("Permanent delete error:", err);
      res.status(500).json({ message: "Failed to permanently delete user" });
    }
  });

  app.patch('/api/users/:id/block', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot block your own account" });
      }
      const updated = await storage.updateUser(userId, { approved: false });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Failed to block user" });
    }
  });

  app.patch('/api/users/:id/reassign', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { stateId, lgaId } = req.body;
      if (!stateId || !lgaId) {
        return res.status(400).json({ message: "stateId and lgaId required" });
      }
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const updated = await storage.updateUser(userId, { stateId, lgaId });

      if (user.role === 'vendor') {
        const client = await pool.connect();
        try {
          await client.query('UPDATE products SET lga_id = $1 WHERE vendor_id = $2', [lgaId, userId]);
        } finally {
          client.release();
        }
      }

      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Failed to reassign user" });
    }
  });

  app.get('/api/users/:id/orders', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      let userOrders: any[] = [];
      if (user.role === 'customer') {
        userOrders = await storage.getOrdersByCustomerId(userId);
      } else if (user.role === 'staff') {
        userOrders = await storage.getOrdersByStaffId(userId);
      } else if (user.role === 'vendor') {
        const allOrders = await storage.getOrders();
        const vendorOrderIds = new Set<number>();
        for (const order of allOrders) {
          const items = await storage.getOrderItems(order.id);
          for (const item of items) {
            const prod = await storage.getProduct(item.productId);
            if (prod && prod.vendorId === userId) {
              vendorOrderIds.add(order.id);
            }
          }
        }
        userOrders = allOrders.filter(o => vendorOrderIds.has(o.id));
      }

      res.json(userOrders);
    } catch (err) {
      res.status(500).json({ message: "Failed to load user orders" });
    }
  });

  // === ADMIN LOCATION SUMMARIES ===

  app.get('/api/states/:id/summary', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const stateId = Number(req.params.id);
      const stateUsers = await storage.getUsersByState(stateId);
      const stateLgas = await storage.getLgasAll(stateId);
      const stateOrders = await storage.getOrders();
      const ordersInState = stateOrders.filter(o => o.stateId === stateId);
      const deliveredInState = ordersInState.filter(o => o.status === 'delivered');

      let estateCount = 0;
      for (const lga of stateLgas) {
        const lgaEstates = await storage.getEstatesAll(lga.id);
        estateCount += lgaEstates.length;
      }

      res.json({
        stateId,
        lgaCount: stateLgas.length,
        estateCount,
        vendors: stateUsers.filter(u => u.role === 'vendor').length,
        staff: stateUsers.filter(u => u.role === 'staff').length,
        customers: stateUsers.filter(u => u.role === 'customer').length,
        totalOrders: ordersInState.length,
        deliveredOrders: deliveredInState.length,
        totalRevenue: ordersInState.reduce((sum, o) => sum + o.totalAmount, 0),
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to load state summary" });
    }
  });

  app.get('/api/lgas/:id/summary', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const lgaId = Number(req.params.id);
      const lgaUsers = await storage.getUsersByLga(lgaId);
      const lgaEstates = await storage.getEstatesAll(lgaId);
      const lgaOrders = (await storage.getOrders()).filter(o => o.lgaId === lgaId);
      const deliveredInLga = lgaOrders.filter(o => o.status === 'delivered');

      res.json({
        lgaId,
        estateCount: lgaEstates.length,
        vendors: lgaUsers.filter(u => u.role === 'vendor').length,
        staff: lgaUsers.filter(u => u.role === 'staff').length,
        customers: lgaUsers.filter(u => u.role === 'customer').length,
        totalOrders: lgaOrders.length,
        deliveredOrders: deliveredInLga.length,
        totalRevenue: lgaOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to load LGA summary" });
    }
  });

  // === LOCATION PAUSE / RESUME ===

  app.patch('/api/states/:id/pause', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const stateId = Number(req.params.id);
      await storage.deactivateState(stateId);
      const stateLgas = await storage.getLgasAll(stateId);
      for (const lga of stateLgas) {
        await storage.deactivateLga(lga.id);
        const lgaEstates = await storage.getEstatesAll(lga.id);
        for (const estate of lgaEstates) {
          await storage.deactivateEstate(estate.id);
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to pause state" });
    }
  });

  app.patch('/api/states/:id/resume', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const stateId = Number(req.params.id);
      await storage.reactivateState(stateId);
      const stateLgas = await storage.getLgasAll(stateId);
      for (const lga of stateLgas) {
        await storage.reactivateLga(lga.id);
        const lgaEstates = await storage.getEstatesAll(lga.id);
        for (const estate of lgaEstates) {
          await storage.reactivateEstate(estate.id);
        }
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to resume state" });
    }
  });

  app.patch('/api/lgas/:id/pause', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const lgaId = Number(req.params.id);
      await storage.deactivateLga(lgaId);
      const lgaEstates = await storage.getEstatesAll(lgaId);
      for (const estate of lgaEstates) {
        await storage.deactivateEstate(estate.id);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to pause LGA" });
    }
  });

  app.patch('/api/lgas/:id/resume', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const lgaId = Number(req.params.id);
      await storage.reactivateLga(lgaId);
      const lgaEstates = await storage.getEstatesAll(lgaId);
      for (const estate of lgaEstates) {
        await storage.reactivateEstate(estate.id);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to resume LGA" });
    }
  });

  app.patch('/api/estates/:id/pause', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.deactivateEstate(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to pause estate" });
    }
  });

  app.patch('/api/estates/:id/resume', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      await storage.reactivateEstate(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to resume estate" });
    }
  });

  // === LOCATION HARD DELETE ===

  app.delete('/api/states/:id/permanent', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const stateId = Number(req.params.id);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE users SET state_id = NULL, lga_id = NULL, approved = false WHERE state_id = $1', [stateId]);
        const lgasResult = await client.query('SELECT id FROM lgas WHERE state_id = $1', [stateId]);
        for (const row of lgasResult.rows) {
          await client.query('DELETE FROM estates WHERE lga_id = $1', [row.id]);
        }
        await client.query('DELETE FROM lgas WHERE state_id = $1', [stateId]);
        await client.query('DELETE FROM states WHERE id = $1', [stateId]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to permanently delete state" });
    }
  });

  app.delete('/api/lgas/:id/permanent', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const lgaId = Number(req.params.id);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('UPDATE users SET lga_id = NULL, approved = false WHERE lga_id = $1', [lgaId]);
        await client.query('DELETE FROM estates WHERE lga_id = $1', [lgaId]);
        await client.query('DELETE FROM lgas WHERE id = $1', [lgaId]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to permanently delete LGA" });
    }
  });

  app.delete('/api/estates/:id/permanent', requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const estateId = Number(req.params.id);
      await pool.query('DELETE FROM estates WHERE id = $1', [estateId]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to permanently delete estate" });
    }
  });

  // === ADMIN: Location status info (includes paused) ===

  app.get('/api/admin/states', requireAuth, requireRole("admin"), async (_req, res) => {
    const allStates = await storage.getStatesAll();
    res.json(allStates);
  });

  app.get('/api/admin/states/:stateId/lgas', requireAuth, requireRole("admin"), async (req, res) => {
    const lgaList = await storage.getLgasAll(Number(req.params.stateId));
    res.json(lgaList);
  });

  app.get('/api/admin/lgas/:lgaId/estates', requireAuth, requireRole("admin"), async (req, res) => {
    const estateList = await storage.getEstatesAll(Number(req.params.lgaId));
    res.json(estateList);
  });

  return httpServer;
}
