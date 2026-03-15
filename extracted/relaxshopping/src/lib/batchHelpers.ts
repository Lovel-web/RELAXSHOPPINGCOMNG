import { BatchSlot } from './types';

/**
 * Determines which batch slot an order belongs to based on current time
 * Nigeria timezone: Africa/Lagos
 * 
 * Batch Assignment Logic:
 * - Before 10:00 → 10:00 AM batch (same day)
 * - 10:00–12:59 → 1:00 PM batch (same day)
 * - 13:00–15:59 → 4:00 PM batch (same day)
 * - 16:00 onwards → 10:00 AM batch (next day)
 */
export function getCurrentBatchSlot(): { slot: BatchSlot; date: string } {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  // Convert times to minutes since midnight
  const batch1Cutoff = 10 * 60;  // 10:00 AM
  const batch2Cutoff = 13 * 60;  // 1:00 PM
  const batch3Cutoff = 16 * 60;  // 4:00 PM

  let slot: BatchSlot;
  let date = now.toISOString().split('T')[0]; // YYYY-MM-DD

  if (currentTime < batch1Cutoff) {
    // Before 10:00 AM → assign to 10:00 AM batch
    slot = '10:00';
  } else if (currentTime < batch2Cutoff) {
    // 10:00 AM - 12:59 PM → assign to 1:00 PM batch
    slot = '13:00';
  } else if (currentTime < batch3Cutoff) {
    // 1:00 PM - 3:59 PM → assign to 4:00 PM batch
    slot = '16:00';
  } else {
    // 4:00 PM onwards → next day 10:00 AM batch
    slot = '10:00';
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    date = tomorrow.toISOString().split('T')[0];
  }

  return { slot, date };
}

/**
 * Formats batch slot time for display
 */
export function formatBatchSlot(slot: BatchSlot): string {
  const slotLabels: Record<BatchSlot, string> = {
    '10:00': '10:00 AM',
    '13:00': '1:00 PM',
    '16:00': '4:00 PM',
  };
  return slotLabels[slot] || slot;
}

/**
 * Gets batch ID string for grouping orders
 */
export function getBatchId(date: string, slot: BatchSlot, lgaId: string): string {
  return `${date}_${slot}_${lgaId}`;
}

/**
 * Generates a unique serial code for an order package
 * Format: EST-XXX-YYY-NNN
 * Example: EST-BLK-A-023
 */
export function generateSerialCode(estatePrefix: string, orderIndex: number): string {
  const paddedIndex = String(orderIndex).padStart(3, '0');
  const prefix = estatePrefix.substring(0, 3).toUpperCase();
  return `EST-${prefix}-${paddedIndex}`;
}
