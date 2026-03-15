import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { createNotification } from '@/contexts/NotificationsContext';

interface PayoutRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  orderId: string;
  batchId: string;
  status: 'pending' | 'approved' | 'refunded';
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

export default function PayoutApproval() {
  const { userProfile, user, role } = useAuth();
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    loadPayouts();
  }, [userProfile]);

  const loadPayouts = async () => {
    if (!userProfile) return;

    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('status', 'pending');
    
    if (error) {
      console.error('Error loading payouts:', error);
      setLoading(false);
      return;
    }
    
    const payoutsData = (data || []).map((item) => ({
      id: item.id,
      vendorId: item.vendor_id,
      vendorName: item.vendor_name,
      amount: item.amount,
      orderId: item.order_id,
      batchId: item.batch_id,
      status: item.status,
      createdAt: new Date(item.created_at),
      processedAt: item.processed_at ? new Date(item.processed_at) : undefined,
      processedBy: item.processed_by,
    })) as PayoutRequest[];
    
    setPayouts(payoutsData);
    setLoading(false);
  };

  const handleApprove = async (payout: PayoutRequest) => {
    if (!userProfile || !user) return;
    
    setProcessing(payout.id);
    try {
      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq('id', payout.id);
      
      if (error) throw error;

      // Create notification for vendor
      await createNotification(
        ['vendor'],
        `Your payout of ₦${payout.amount.toLocaleString()} has been approved!`,
        { payoutId: payout.id, amount: payout.amount },
        payout.vendorId
      );

      // Notify superadmin
      await createNotification(
        ['superadmin'],
        `Admin ${userProfile.fullName} approved payout of ₦${payout.amount.toLocaleString()} for ${payout.vendorName}`,
        { payoutId: payout.id, adminId: user.id }
      );

      toast({
        title: 'Success',
        description: 'Payout approved successfully',
      });
      loadPayouts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleRefund = async (payout: PayoutRequest) => {
    if (!userProfile || !user) return;
    
    setProcessing(payout.id);
    try {
      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'refunded',
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq('id', payout.id);
      
      if (error) throw error;

      // Create notification for vendor
      await createNotification(
        ['vendor'],
        `Your payout request of ₦${payout.amount.toLocaleString()} has been refunded`,
        { payoutId: payout.id, amount: payout.amount },
        payout.vendorId
      );

      // Notify superadmin
      await createNotification(
        ['superadmin'],
        `Admin ${userProfile.fullName} refunded payout of ₦${payout.amount.toLocaleString()} for ${payout.vendorName}`,
        { payoutId: payout.id, adminId: user.id }
      );

      toast({
        title: 'Success',
        description: 'Payout refunded successfully',
      });
      loadPayouts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  if (!userProfile || role !== 'admin') {
    return <div className="p-8 text-center">Access denied</div>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Payout Approval
          </h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payouts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No pending payout requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <Card key={payout.id} className="border-primary/10 shadow-lg shadow-primary/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{payout.vendorName}</CardTitle>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="text-2xl font-bold text-primary">
                          ₦{payout.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Order ID</p>
                        <p className="font-mono text-sm">{payout.orderId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Batch ID</p>
                        <p className="font-mono text-sm">{payout.batchId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Requested</p>
                        <p className="text-sm">{payout.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(payout)}
                        disabled={processing === payout.id}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        {processing === payout.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Approve Payout
                      </Button>
                      <Button
                        onClick={() => handleRefund(payout)}
                        disabled={processing === payout.id}
                        variant="destructive"
                        className="flex-1"
                      >
                        {processing === payout.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Refund
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
