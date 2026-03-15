import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { getRecentAdminLogs, AdminLog, createAdminLog } from '@/lib/adminLogHelpers';
import { toast } from 'sonner';
import { UserCheck, UserX, Shield, Activity, Users, Store } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface PendingAdmin {
  id: string;
  full_name: string;
  email: string;
  state: string;
  created_at: Date;
}

const SuperadminDashboard = () => {
  const { userProfile, user, role } = useAuth();
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalVendors: 0,
    totalStaff: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === 'superadmin') {
      fetchData();
    }
  }, [role]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all profiles with their roles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, state, approved, created_at');
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      
      // Find pending admins (approved = false and role = admin)
      const pending = (profiles || [])
        .filter(p => !p.approved && roleMap.get(p.id) === 'admin')
        .map(p => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          state: p.state,
          created_at: new Date(p.created_at),
        }));
      setPendingAdmins(pending);

      // Calculate stats
      const approvedProfiles = profiles?.filter(p => p.approved) || [];
      const roleCounts = {
        admin: 0,
        vendor: 0,
        staff: 0,
        customer: 0,
      };
      
      approvedProfiles.forEach(p => {
        const r = roleMap.get(p.id);
        if (r && r in roleCounts) {
          roleCounts[r as keyof typeof roleCounts]++;
        }
      });

      setStats({
        totalAdmins: roleCounts.admin,
        totalVendors: roleCounts.vendor,
        totalStaff: roleCounts.staff,
        totalCustomers: roleCounts.customer,
      });

      // Fetch admin logs
      const logs = await getRecentAdminLogs(50);
      setAdminLogs(logs);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAdmin = async (admin: PendingAdmin) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('id', admin.id);

      if (error) throw error;

      await createAdminLog(
        user!.id,
        userProfile!.fullName,
        'ADMIN_APPROVED',
        `Approved admin: ${admin.full_name} (${admin.email}) for state: ${admin.state}`
      );

      toast.success(`Approved ${admin.full_name} as admin`);
      fetchData();
    } catch (error) {
      console.error('Error approving admin:', error);
      toast.error('Failed to approve admin');
    }
  };

  const handleRejectAdmin = async (admin: PendingAdmin) => {
    try {
      // Update profile approval and change role to customer
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ approved: false })
        .eq('id', admin.id);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'customer' })
        .eq('user_id', admin.id);

      if (roleError) throw roleError;

      await createAdminLog(
        user!.id,
        userProfile!.fullName,
        'ADMIN_REJECTED',
        `Rejected admin application: ${admin.full_name} (${admin.email})`
      );

      toast.success(`Rejected ${admin.full_name}'s admin application`);
      fetchData();
    } catch (error) {
      console.error('Error rejecting admin:', error);
      toast.error('Failed to reject admin');
    }
  };

  if (!userProfile || role !== 'superadmin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive font-semibold">Access denied. Superadmin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen py-8">
        <div className="container max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gradient mb-2">Superadmin Dashboard</h1>
            <p className="text-muted-foreground">System overview and administrative controls</p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="gradient-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <Shield className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAdmins}</div>
                <p className="text-xs text-muted-foreground">Active state admins</p>
              </CardContent>
            </Card>

            <Card className="gradient-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vendors</CardTitle>
                <Store className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVendors}</div>
                <p className="text-xs text-muted-foreground">Total vendors</p>
              </CardContent>
            </Card>

            <Card className="gradient-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Staff</CardTitle>
                <Users className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStaff}</div>
                <p className="text-xs text-muted-foreground">Delivery staff</p>
              </CardContent>
            </Card>

            <Card className="gradient-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Active customers</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="pending">
                Pending Approvals {pendingAdmins.length > 0 && `(${pendingAdmins.length})`}
              </TabsTrigger>
              <TabsTrigger value="logs">Admin Logs</TabsTrigger>
            </TabsList>

            {/* Pending Admins */}
            <TabsContent value="pending">
              <Card className="gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Admin Approval Requests
                  </CardTitle>
                  <CardDescription>
                    Review and approve state admin applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : pendingAdmins.length === 0 ? (
                    <p className="text-muted-foreground">No pending admin approvals</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingAdmins.map((admin) => (
                        <Card key={admin.id} className="border-2">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h3 className="font-semibold">{admin.full_name}</h3>
                                <p className="text-sm text-muted-foreground">{admin.email}</p>
                                <p className="text-sm">
                                  <span className="font-medium">State:</span> {admin.state}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Applied {formatDistanceToNow(admin.created_at, { addSuffix: true })}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveAdmin(admin)}
                                  className="bg-success hover:bg-success/90"
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectAdmin(admin)}
                                >
                                  <UserX className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Logs */}
            <TabsContent value="logs">
              <Card className="gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Audit Logs
                  </CardTitle>
                  <CardDescription>
                    Recent administrative actions and changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-muted-foreground">Loading logs...</p>
                  ) : adminLogs.length === 0 ? (
                    <p className="text-muted-foreground">No admin logs yet</p>
                  ) : (
                    <div className="space-y-3">
                      {adminLogs.map((log) => (
                        <div key={log.id} className="border-l-4 border-primary pl-4 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{log.actionType}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{log.details}</p>
                          <p className="text-xs text-muted-foreground">By: {log.actorName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
};

export default SuperadminDashboard;
