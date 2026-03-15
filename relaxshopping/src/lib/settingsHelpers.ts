import { supabase } from './supabase';

export interface GlobalSettings {
  DELIVERY_FEE_NGN: number;
  BATCH_TIMES: string[];
  updatedAt: Date;
}

/**
 * Get global settings
 */
export async function getGlobalSettings(): Promise<GlobalSettings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'global')
    .maybeSingle();

  if (error) {
    console.error('Error fetching settings:', error);
  }

  if (data) {
    return {
      DELIVERY_FEE_NGN: data.delivery_fee_ngn || 400,
      BATCH_TIMES: data.batch_times || ['10:00', '13:00', '16:00'],
      updatedAt: new Date(data.updated_at),
    };
  }

  // Return default settings if none exist
  const defaultSettings: GlobalSettings = {
    DELIVERY_FEE_NGN: 400,
    BATCH_TIMES: ['10:00', '13:00', '16:00'],
    updatedAt: new Date(),
  };

  // Try to create default settings
  await supabase.from('settings').upsert({
    id: 'global',
    delivery_fee_ngn: defaultSettings.DELIVERY_FEE_NGN,
    batch_times: defaultSettings.BATCH_TIMES,
    updated_at: new Date().toISOString(),
  });

  return defaultSettings;
}

/**
 * Update delivery fee (admin/superadmin only)
 */
export async function updateDeliveryFee(newFee: number): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({
      id: 'global',
      delivery_fee_ngn: newFee,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error updating delivery fee:', error);
    throw error;
  }
}
