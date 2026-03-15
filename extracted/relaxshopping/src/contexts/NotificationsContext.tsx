import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Notification, UserRole } from '@/lib/types';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !userProfile) {
      setNotifications([]);
      return;
    }

    // Initial fetch
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .contains('target_roles', [userProfile.role])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      const notifs: Notification[] = (data || [])
        .filter((n: any) => !n.target_user_id || n.target_user_id === user.id)
        .map((n: any) => ({
          id: n.id,
          targetRoles: n.target_roles,
          targetUserId: n.target_user_id,
          message: n.message,
          meta: n.meta,
          seen: n.seen || false,
          createdAt: new Date(n.created_at),
        }));

      setNotifications(notifs);
    };

    fetchNotifications();

    // Set up realtime subscription
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          // Refetch on any change
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userProfile]);

  const unreadCount = notifications.filter((n) => !n.seen).length;

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ seen: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, seen: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.seen).map((n) => n.id);
    
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ seen: true })
      .in('id', unreadIds);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

// Helper function to create notifications
export async function createNotification(
  targetRoles: string[],
  message: string,
  meta?: Record<string, any>,
  targetUserId?: string
) {
  const { error } = await supabase.from('notifications').insert({
    target_roles: targetRoles,
    target_user_id: targetUserId,
    message,
    meta,
    seen: false,
  });

  if (error) {
    console.error('Error creating notification:', error);
  }
}
