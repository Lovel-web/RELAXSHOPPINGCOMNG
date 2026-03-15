import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Order, Estate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Package, CheckCircle, Clock, Loader2, MapPin } from 'lucide-react';
import { formatBatchSlot } from '@/lib/batchHelpers';
import { createNotification } from '@/contexts/NotificationsContext';

interface GroupedBatch {
  batchId: string;
  batchDate: string;
  batchSlot: string;
  orders: Order[];
  estates: { [key: string]: Order[] };
}

export default function StaffDashboard() {
  const { userProfile, user, role } = useAuth();
  const { toast } = useToast();
  const [batches, setBatches] = useState<GroupedBatch[]>([]);
  const [estates, setEstates] = useState<{ [key: string]: Estate }>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    loadData();
  }, [userProfile]);

  const loadData = async () => {
    if (!userProfile) return;

    // Fetch orders for this LGA
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('lga_id', userProfile.lgaId)
      .eq('payment_status', 'paid');

    if (ordersError) {
      console.error('Error loading orders:', ordersError);
      setLoading(false);
      return;
    }

    const orders = (ordersData || []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      items: item.items,
      subtotal: item.subtotal,
      deliveryFee: item.delivery_fee,
      vat: item.vat,
      total: item.total,
      estateId: item.estate_id,
      lgaId: item.lga_id,
      batchId: item.batch_id,
      batchDate: item.batch_date,
      batchSlot: item.batch_slot,
      paymentRef: item.payment_ref,
      paymentStatus: item.payment_status,
      status: item.status,
      serialCode: item.serial_code,
      createdAt: new Date(item.created_at),
    })) as Order[];

    // Fetch estates for this LGA
    const { data: estatesData } = await supabase
      .from('estates')
      .select('*')
      .eq('lga_id', userProfile.lgaId);

    const estatesMap: { [key: string]: Estate } = {};
    (estatesData || []).forEach((item) => {
      estatesMap[item.id] = {
        id: item.id,
        name: item.name,
        lgaId: item.lga_id,
        createdByAdminId: item.created_by_admin_id,
      };
    });
    setEstates(estatesMap);

    // Group orders by batch
    const batchMap: { [key: string]: GroupedBatch } = {};
    orders.forEach((order) => {
      if (!order.batchId) return;
      if (!batchMap[order.batchId]) {
        batchMap[order.batchId] = {
          batchId: order.batchId,
          batchDate: order.batchDate || '',
          batchSlot: order.batchSlot || '',
          orders: [],
          estates: {},
        };
      }
      batchMap[order.batchId].orders.push(order);
      const estateId = order.estateId || 'unknown';
      if (!batchMap[order.batchId].estates[estateId]) {
        batchMap[order.batchId].estates[estateId] = [];
      }
      batchMap[order.batchId].estates[estateId].push(order);
    });

    setBatches(Object.values(batchMap));
    setLoading(false);
  };

  const markBatchProcessing = async (batchId: string) => {
    setProcessing(batchId);
    try {
      const batch = batches.find((b) => b.batchId === batchId);
      if (!batch) return;

      // Update all orders in this batch
      const orderIds = batch.orders.map((o) => o.id);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .in('id', orderIds);

      if (error) throw error;

      // Notify customers
      const uniqueUserIds = [...new Set(batch.orders.map((o) => o.userId))];
      await Promise.all(
        uniqueUserIds.map((userId) =>
          createNotification(['customer'], `Your order is now being processed for delivery`, { batchId }, userId)
        )
      );

      toast({ title: 'Success', description: 'Batch marked as processing' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const markEstateDelivered = async (batchId: string, estateId: string) => {
    setProcessing(`${batchId}-${estateId}`);
    try {
      const batch = batches.find((b) => b.batchId === batchId);
      if (!batch || !batch.estates[estateId]) return;

      const estateOrders = batch.estates[estateId];
      const estateName = estates[estateId]?.name || 'Estate';
      const orderIds = estateOrders.map((o) => o.id);

      // Update orders to delivered
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered', updated_at: new Date().toISOString() })
        .in('id', orderIds);

      if (error) throw error;

      // Notify customers
      const uniqueUserIds = [...new Set(estateOrders.map((o) => o.userId))];
      await Promise.all(
        uniqueUserIds.map((userId) =>
          createNotification(['customer'], `Your order to ${estateName} has been delivered`, { estateId }, userId)
        )
      );

      // Create payout requests
      for (const order of estateOrders) {
        await supabase.from('payouts').insert({
          vendor_id: 'vendor-placeholder',
          vendor_name: 'Vendor',
          amount: order.subtotal,
          order_id: order.id,
          batch_id: batchId,
          status: 'pending',
        });
      }

      toast({ title: 'Success', description: `Marked ${estateName} as delivered` });
      loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  if (!userProfile || role !== 'staff') {
    return <div className="p-8 text-center">Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          Staff Dashboard
        </h1>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : batches.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No batches available</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-6">
            {batches.map((batch) => {
              const allDelivered = batch.orders.every((o) => o.status === 'delivered');
              const someProcessing = batch.orders.some((o) => o.status === 'processing');
              return (
                <Card key={batch.batchId} className="border-primary/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Batch: {formatBatchSlot(batch.batchSlot as any)} - {new Date(batch.batchDate).toLocaleDateString()}</CardTitle>
                      <Badge>{allDelivered ? 'Completed' : someProcessing ? 'Processing' : 'Pending'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!someProcessing && !allDelivered && (
                      <Button onClick={() => markBatchProcessing(batch.batchId)} disabled={processing === batch.batchId} className="w-full">
                        {processing === batch.batchId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                        Start Delivery
                      </Button>
                    )}
                    {Object.entries(batch.estates).map(([estateId, estateOrders]) => {
                      const estateDelivered = estateOrders.every((o) => o.status === 'delivered');
                      return (
                        <Card key={estateId} className="border-muted"><CardContent className="py-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">{estates[estateId]?.name || estateId}</span>
                            {estateDelivered && <Badge className="bg-green-500">Delivered</Badge>}
                          </div>
                          {!estateDelivered && someProcessing && (
                            <Button onClick={() => markEstateDelivered(batch.batchId, estateId)} disabled={processing === `${batch.batchId}-${estateId}`} variant="outline" className="w-full">
                              <CheckCircle className="mr-2 h-4 w-4" />Mark Delivered
                            </Button>
                          )}
                        </CardContent></Card>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
