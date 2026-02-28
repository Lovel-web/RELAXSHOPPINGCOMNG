import { Navigation } from "@/components/Navigation";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Clock, CreditCard, Truck, Loader2, CheckCircle, Receipt } from "lucide-react";
import { type Order } from "@shared/schema";
import { Link } from "wouter";

function getBatchLabel(hour: number): string {
  if (hour < 12) return "10AM Batch";
  if (hour < 15) return "1PM Batch";
  return "4PM Batch";
}

interface VendorBreakdown {
  vendorId: number;
  vendorName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
}

interface PaymentResult {
  id: number;
  vendorName: string;
  amount: number;
  transferReference: string;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showPaySummary, setShowPaySummary] = useState(false);
  const [paying, setPaying] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [breakdown, setBreakdown] = useState<VendorBreakdown[]>([]);
  const [totalPayout, setTotalPayout] = useState(0);
  const [paymentResults, setPaymentResults] = useState<PaymentResult[]>([]);
  const [showReceipts, setShowReceipts] = useState(false);

  const staffLgaId = user?.lgaId;

  const paidOrders = (orders as Order[] || []).filter(
    (o: Order) => o.status === "paid" && !o.vendorPaid && (!staffLgaId || o.lgaId === staffLgaId)
  );

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedOrders = paidOrders.filter((o: Order) => selectedIds.has(o.id));

  const handleShowPaySummary = async () => {
    if (selectedOrders.length === 0) return;
    setLoadingPreview(true);
    try {
      const res = await apiRequest("POST", "/api/vendor-payout/preview", {
        orderIds: selectedOrders.map((o: Order) => o.id),
      });
      const data = await res.json();
      setBreakdown(data.breakdown || []);
      setTotalPayout(data.totalPayout || 0);
      setShowPaySummary(true);
    } catch {
      toast({ title: "Error", description: "Could not load payout preview", variant: "destructive" });
    }
    setLoadingPreview(false);
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await apiRequest("POST", "/api/vendor-payout", {
        orderIds: selectedOrders.map((o: Order) => o.id),
        staffId: user?.id || 0,
      });
      const data = await res.json();
      setPaymentResults(data.payments || []);
      setShowReceipts(true);
      setShowPaySummary(false);
      toast({
        title: "Vendor payment complete",
        description: `${data.ordersProcessed} orders settled.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    } catch {
      toast({ title: "Payment failed", description: "Could not process vendor payout", variant: "destructive" });
    }
    setPaying(false);
    setSelectedIds(new Set());
  };

  const batches: Record<string, Order[]> = {};
  paidOrders.forEach((o: Order) => {
    const created = o.createdAt ? new Date(o.createdAt) : new Date();
    const label = o.batchTime || getBatchLabel(created.getHours());
    if (!batches[label]) batches[label] = [];
    batches[label].push(o);
  });

  const maskAccount = (acc: string) => acc.length > 4 ? "****" + acc.slice(-4) : acc;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-staff-title">Staff Dashboard</h1>
            <p className="text-sm text-muted-foreground">LGA Orders &mdash; Paid & Ready to Pick</p>
          </div>
          {selectedIds.size > 0 && (
            <Button onClick={handleShowPaySummary} disabled={loadingPreview} data-testid="button-pay-vendors">
              {loadingPreview ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Pay Selected ({selectedIds.size})
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading orders...</p>
        ) : paidOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No paid orders awaiting pickup</p>
          </div>
        ) : (
          Object.entries(batches).map(([batchLabel, batchOrders]) => (
            <div key={batchLabel} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-lg" data-testid={`text-batch-${batchLabel}`}>{batchLabel}</h2>
                <Badge variant="secondary">{batchOrders.length} orders</Badge>
              </div>

              <div className="space-y-3">
                {batchOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`flex items-center gap-4 bg-white rounded-xl border p-4 transition-colors ${
                      selectedIds.has(order.id) ? "border-primary bg-primary/5" : "border-border/50"
                    }`}
                    data-testid={`card-order-${order.id}`}
                  >
                    <Checkbox
                      checked={selectedIds.has(order.id)}
                      onCheckedChange={() => toggleSelection(order.id)}
                      data-testid={`checkbox-order-${order.id}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-primary" data-testid={`text-order-code-${order.id}`}>
                          {order.orderCode}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {order.status === "paid" ? "Paid" : order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total: ₦{order.totalAmount.toLocaleString()} &middot; Delivery: ₦{order.deliveryFee.toLocaleString()}
                      </p>
                    </div>
                    <span className="font-bold">₦{(order.totalAmount - order.deliveryFee).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {showPaySummary && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-enter max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold">Vendor Settlement Summary</h2>
              <p className="text-sm text-muted-foreground">
                Breakdown of payments to each vendor for the selected orders.
              </p>

              <div className="space-y-3">
                {breakdown.map((vendor) => (
                  <div key={vendor.vendorId} className="bg-secondary/30 rounded-xl p-4 space-y-2" data-testid={`vendor-breakdown-${vendor.vendorId}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold" data-testid={`text-vendor-name-${vendor.vendorId}`}>{vendor.vendorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.bankName} &middot; {maskAccount(vendor.accountNumber)}
                        </p>
                      </div>
                      <span className="font-bold text-primary" data-testid={`text-vendor-amount-${vendor.vendorId}`}>
                        ₦{vendor.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Selected Orders</span>
                  <span className="font-medium">{selectedOrders.length}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Vendors</span>
                  <span className="font-medium">{breakdown.length}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total Vendor Payout</span>
                  <span className="text-primary" data-testid="text-vendor-payout">
                    ₦{totalPayout.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground bg-yellow-50 rounded-lg p-3">
                You cannot edit these values. Payment amounts are calculated from verified order data.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaySummary(false)}
                  data-testid="button-cancel-pay"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePay}
                  disabled={paying}
                  data-testid="button-confirm-pay"
                >
                  {paying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Confirm & Pay
                </Button>
              </div>
            </div>
          </div>
        )}

        {showReceipts && paymentResults.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-enter">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Settlement Complete</h2>
                <p className="text-sm text-muted-foreground mt-1">{paymentResults.length} vendor(s) paid successfully</p>
              </div>

              <div className="space-y-3">
                {paymentResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-secondary/30 rounded-xl p-4" data-testid={`receipt-row-${p.id}`}>
                    <div>
                      <p className="font-semibold">{p.vendorName}</p>
                      <p className="text-sm text-primary font-bold">₦{p.amount.toLocaleString()}</p>
                    </div>
                    <Link href={`/receipt/${p.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-receipt-${p.id}`}>
                        <Receipt className="w-4 h-4 mr-1" /> Receipt
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => { setShowReceipts(false); setPaymentResults([]); }}
                data-testid="button-close-receipts"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
