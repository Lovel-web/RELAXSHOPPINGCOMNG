import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Order, BatchSlot } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, CheckCircle, XCircle, Truck, QrCode } from 'lucide-react';
import { formatBatchSlot } from '@/lib/batchHelpers';
import { motion } from 'framer-motion';

export default function Orders() {
  const { userProfile, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchOrders();

    // Set up realtime subscription
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
      return;
    }

    const ordersData = (data || []).map((item) => ({
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

    setOrders(ordersData);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-primary" />;
      case 'processing':
      case 'ready':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      ready: 'Ready',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'badge-success';
      case 'processing':
      case 'ready':
        return 'badge-processing';
      case 'out_for_delivery':
        return 'badge-processing';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'badge-pending';
    }
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <h1 className="text-3xl font-medium text-center mb-2">My Orders</h1>
        <p className="text-center text-muted-foreground mb-8">Track your deliveries</p>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="h-32 bg-muted rounded-xl mb-4" />
              <div className="h-32 bg-muted rounded-xl" />
            </div>
          </div>
        ) : orders.length === 0 ? (
          <Card className="card-calm border-dashed">
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your orders will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Card className="card-calm hover-calm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          {/* Serial Code - prominent display */}
                          {order.serialCode ? (
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-primary" />
                              {order.serialCode}
                            </CardTitle>
                          ) : (
                            <CardTitle className="text-base font-medium">
                              Order #{order.id.slice(0, 8)}
                            </CardTitle>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {order.createdAt.toLocaleDateString('en-NG', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusClass(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Batch/Delivery Schedule */}
                    {order.batchSlot && (
                      <div className="flex items-center gap-4 p-3 bg-accent/50 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">
                            Delivery: {formatBatchSlot(order.batchSlot as BatchSlot)}
                          </p>
                          {order.batchDate && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.batchDate).toLocaleDateString('en-NG', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.name} × {item.qty}
                          </span>
                          <span className="font-medium">₦{(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order Total */}
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="font-medium text-primary">₦{order.total.toLocaleString()}</span>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Payment:</span>
                      <Badge variant="outline" className={
                        order.paymentStatus === 'paid' ? 'badge-success' : 'badge-pending'
                      }>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
