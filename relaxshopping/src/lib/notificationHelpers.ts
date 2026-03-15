import { createNotification } from '@/contexts/NotificationsContext';
import { UserRole } from './types';

export async function notifyAdminApproval(adminName: string, action: string) {
  await createNotification(
    ['superadmin'],
    `Admin ${adminName} ${action}`
  );
}

export async function notifyBatchStatusChange(batchId: string, status: string, lgaName: string) {
  await createNotification(
    ['customer', 'staff'],
    `Batch ${batchId} in ${lgaName} is now ${status}`,
    { batchId, status }
  );
}

export async function notifyPaymentSuccess(orderId: string, userId: string) {
  await createNotification(
    ['customer'],
    `Payment successful for order ${orderId}`,
    { orderId },
    userId
  );
}

export async function notifyDeliveryComplete(orderId: string, userId: string) {
  await createNotification(
    ['customer'],
    `Your order ${orderId} has been delivered!`,
    { orderId },
    userId
  );
}

export async function notifyVendorApproval(vendorName: string, approved: boolean) {
  await createNotification(
    ['superadmin', 'admin'],
    `Vendor ${vendorName} has been ${approved ? 'approved' : 'rejected'}`,
    { vendorName, approved }
  );
}

export async function notifyPayoutRequest(vendorName: string, amount: number) {
  await createNotification(
    ['admin', 'superadmin'],
    `Vendor ${vendorName} requested payout of ₦${amount.toLocaleString()}`,
    { vendorName, amount }
  );
}

export async function notifyOrderCreated(orderId: string, customerName: string, vendorUid: string, lgaId: string) {
  await createNotification(
    ['vendor', 'staff', 'admin'],
    `New order #${orderId} from ${customerName}`,
    { orderId, lgaId }
  );
}

export async function notifyOrderProcessing(orderId: string, userId: string) {
  await createNotification(
    ['customer'],
    `Your order #${orderId} is now being processed`,
    { orderId },
    userId
  );
}

export async function notifyProductUpload(productName: string, vendorName: string, lgaId: string) {
  await createNotification(
    ['customer', 'staff', 'admin'],
    `New product available: ${productName} from ${vendorName}`,
    { productName, lgaId }
  );
}

export async function notifyAdminAction(actionType: string, details: string) {
  await createNotification(
    ['superadmin'],
    `Admin action: ${actionType}`,
    { actionType, details }
  );
}

export async function notifySuperadminApprovalRequired(adminName: string, adminEmail: string) {
  await createNotification(
    ['superadmin'],
    `New admin signup requires approval: ${adminName} (${adminEmail})`,
    { adminName, adminEmail }
  );
}
