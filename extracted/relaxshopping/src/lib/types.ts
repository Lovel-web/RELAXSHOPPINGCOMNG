export type UserRole = 'customer' | 'vendor' | 'staff' | 'admin' | 'superadmin';

export interface User {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  state: string;
  lgaId: string;
  estateId?: string;
  approved: boolean;
  bankAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  uid: string;
  shopName: string;
  state: string;
  lgaId: string;
  bankAccount: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
  approved: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  imageBase64?: string;
  lgaId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LGA {
  id: string;
  name: string;
  state: string;
  createdByAdminId: string;
}

export interface Estate {
  id: string;
  name: string;
  lgaId: string;
  createdByAdminId: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  vat: number;
  total: number;
  estateId: string;
  lgaId: string;
  batchId?: string;
  batchDate?: string;
  batchSlot?: string;
  paymentRef: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  status: 'pending' | 'processing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  serialCode?: string; // Unique package serial code (e.g., EST-BLK-A-023)
  createdAt: Date;
}

export type BatchSlot = '10:00' | '13:00' | '16:00';

export interface EstateGroup {
  estateId: string;
  orderIds: string[];
  delivered: boolean;
}

export interface Batch {
  id: string;
  date: string;
  slot: BatchSlot;
  lgaId: string;
  estateGroups: EstateGroup[];
  status: 'open' | 'processing' | 'ready' | 'out_for_delivery' | 'completed';
  assignedStaffId?: string;
  threshold: number;
  adminNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  targetRoles: UserRole[];
  targetUserId?: string;
  message: string;
  meta?: Record<string, any>;
  seen: boolean;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
