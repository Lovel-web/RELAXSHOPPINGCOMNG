import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, Users, Store, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageTransition } from '@/components/PageTransition';

interface PendingUser {
  user_id: string;
  full_name: string;
  email: string;
  state: string;
  approved: boolean;
  role: 'vendor' | 'staff';
}

const AdminApprovals = () => {
  const { userProfile } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          state,
          approved,
          user_roles!inner(role)
        `)
        .eq('approved', false)
        .in('user_roles.role', ['vendor', 'staff']);

      if (error) {
        console.error('Error fetching pending users:', error);
        toast.error('Failed to load pending users');
        return;
      }

      const formattedData: PendingUser[] = (data || []).map((item: any) => ({
        user_id: item.user_id,
        full_name: item.full_name,
        email: item.email,
        state: item.state,
        approved: item.approved,
        role: item.user_roles.role,
      }));

      setPendingUsers(formattedData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId: string, role: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    
    try {
      // Update profiles table only
      const { error } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error approving user:', error);
        toast.error('Failed to approve user');
        return;
      }

      // Optional: Insert notification
      await supabase.from('notifications').insert({
        target_user_id: userId,
        target_roles: [role],
        message: 'Your account has been approved. You can now access your dashboard.',
      });

      toast.success('User approved successfully');
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to approve user');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    
    try {
      // ============================================================
      // REJECTION BEHAVIOR (INTENTIONAL - DO NOT CHANGE)
      // ============================================================
      // Option A (Safe Default): Rejection keeps user unapproved.
      // - User remains in database with approved = false
      // - User cannot access dashboard until manually approved later
      // - This is NOT a deletion - it's a permanent block unless reconsidered
      // - To implement deletion (Option B), use supabase.auth.admin.deleteUser()
      // ============================================================
      toast.info('User rejected and will remain unapproved');
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'vendor':
        return <Store className="h-4 w-4" />;
      case 'staff':
        return <UserCog className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'vendor':
        return 'default';
      case 'staff':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">User Approvals</h1>
              <p className="text-muted-foreground">
                Approve or reject pending vendor and staff accounts
              </p>
            </div>
          </div>

          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">All Caught Up!</h3>
                <p className="text-muted-foreground text-center">
                  No pending approval requests at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingUsers.map((pendingUser, index) => (
                <motion.div
                  key={pendingUser.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {pendingUser.full_name}
                          </CardTitle>
                          <CardDescription>{pendingUser.email}</CardDescription>
                        </div>
                        <Badge variant={getRoleBadgeVariant(pendingUser.role)} className="gap-1">
                          {getRoleIcon(pendingUser.role)}
                          {pendingUser.role.charAt(0).toUpperCase() + pendingUser.role.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            State: <span className="text-foreground">{pendingUser.state}</span>
                          </p>
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                            Pending
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(pendingUser.user_id)}
                            disabled={processingIds.has(pendingUser.user_id)}
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            {processingIds.has(pendingUser.user_id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(pendingUser.user_id, pendingUser.role)}
                            disabled={processingIds.has(pendingUser.user_id)}
                            className="gap-1"
                          >
                            {processingIds.has(pendingUser.user_id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AdminApprovals;
