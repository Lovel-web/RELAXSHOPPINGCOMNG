import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { PageTransition } from '@/components/PageTransition';
import { motion } from 'framer-motion';
import { Shield, MapPin, DollarSign, Users, UserCheck } from 'lucide-react';
import { LGAManagement } from './LGAManagement';
import { DeliveryFeeSettings } from './DeliveryFeeSettings';
import Approvals from './Approvals';

export default function AdminDashboard() {
  const { userProfile, role } = useAuth();
  const [stats, setStats] = useState({
    totalLGAs: 0,
    totalEstates: 0,
    totalVendors: 0,
    totalStaff: 0,
  });

  useEffect(() => {
    if (role === 'admin' && userProfile?.state) {
      fetchStats();
    }
  }, [userProfile, role]);

  const fetchStats = async () => {
    if (!userProfile?.state) return;
    try {
      // Get LGAs for this state
      const { data: lgas } = await supabase
        .from('lgas')
        .select('id')
        .eq('state', userProfile.state);
      
      const lgaIds = lgas?.map(l => l.id) || [];
      
      // Get estates count
      let estatesCount = 0;
      if (lgaIds.length > 0) {
        const { count } = await supabase
          .from('estates')
          .select('*', { count: 'exact', head: true })
          .in('lga_id', lgaIds);
        estatesCount = count || 0;
      }

      // Get profiles with roles for this state
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('state', userProfile.state);
      
      const profileIds = profiles?.map(p => p.id) || [];
      
      let vendorCount = 0;
      let staffCount = 0;
      
      if (profileIds.length > 0) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', profileIds);
        
        vendorCount = roles?.filter(r => r.role === 'vendor').length || 0;
        staffCount = roles?.filter(r => r.role === 'staff').length || 0;
      }

      setStats({
        totalLGAs: lgas?.length || 0,
        totalEstates: estatesCount,
        totalVendors: vendorCount,
        totalStaff: staffCount,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!userProfile || role !== 'admin') {
    return <div className="flex min-h-screen items-center justify-center"><Card><CardContent className="p-6"><p className="text-destructive font-semibold">Access denied</p></CardContent></Card></div>;
  }

  if (!userProfile.approved) {
    return <div className="flex min-h-screen items-center justify-center p-4"><Card className="max-w-md"><CardContent className="p-6 text-center"><Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" /><h2 className="text-2xl font-bold mb-2">Pending Approval</h2><p className="text-muted-foreground">Your admin account is pending superadmin approval.</p></CardContent></Card></div>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen py-8">
        <div className="container max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl font-bold text-gradient mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage {userProfile.state} state operations</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="gradient-card hover-lift"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">LGAs</CardTitle><MapPin className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalLGAs}</div><p className="text-xs text-muted-foreground">Local Government Areas</p></CardContent></Card>
            <Card className="gradient-card hover-lift"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Estates</CardTitle><MapPin className="h-4 w-4 text-secondary" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalEstates}</div><p className="text-xs text-muted-foreground">Estates/Hotels</p></CardContent></Card>
            <Card className="gradient-card hover-lift"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Vendors</CardTitle><Users className="h-4 w-4 text-accent" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalVendors}</div><p className="text-xs text-muted-foreground">In your state</p></CardContent></Card>
            <Card className="gradient-card hover-lift"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Staff</CardTitle><Users className="h-4 w-4 text-success" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalStaff}</div><p className="text-xs text-muted-foreground">Delivery staff</p></CardContent></Card>
          </div>

          <Tabs defaultValue="locations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="approvals" className="flex items-center gap-1">
                <UserCheck className="h-4 w-4" />
                User Approvals
              </TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="locations"><LGAManagement /></TabsContent>
            <TabsContent value="approvals"><Approvals /></TabsContent>
            <TabsContent value="settings"><DeliveryFeeSettings /></TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}
