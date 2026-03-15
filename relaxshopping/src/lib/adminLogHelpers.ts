import { supabase } from './supabase';

export interface AdminLog {
  id?: string;
  actorUid: string;
  actorName: string;
  actionType: string;
  details: string;
  createdAt: Date;
}

/**
 * Create an admin log entry
 */
export async function createAdminLog(
  actorUid: string,
  actorName: string,
  actionType: string,
  details: string
): Promise<void> {
  const { error } = await supabase.from('admin_logs').insert({
    actor_uid: actorUid,
    actor_name: actorName,
    action_type: actionType,
    details,
  });

  if (error) {
    console.error('Error creating admin log:', error);
  }
}

/**
 * Get recent admin logs
 */
export async function getRecentAdminLogs(limitCount: number = 50): Promise<AdminLog[]> {
  const { data, error } = await supabase
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    console.error('Error fetching admin logs:', error);
    return [];
  }

  return (data || []).map((log: any) => ({
    id: log.id,
    actorUid: log.actor_uid,
    actorName: log.actor_name,
    actionType: log.action_type,
    details: log.details,
    createdAt: new Date(log.created_at),
  }));
}
