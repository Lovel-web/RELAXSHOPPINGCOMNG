import { Navigation } from "@/components/Navigation";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Clock, CreditCard, Truck, Loader2, CheckCircle } from "lucide-react";
import { type Order } from "@shared/schema";

function getBatchLabel(hour: number): string {
  if (hour < 12) return "10AM Batch";
  if (hour < 15) return "1PM Batch";
  return "4PM Batch";
}

export default function StaffDashboard() {
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showPaySummary, setShowPaySummary] = useState(false);
  const [paying, setPaying] = useState(false);

  const paidOrders = (orders as Order[] || []).filter(
    (o: Order) => o.status === "paid" && !o.vendorPaid
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
  const selectedTotal = selectedOrders.reduce((acc: number, o: Order) => acc + o.totalAmount - o.deliveryFee, 0);

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch("/api/vendor-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedOrders.map((o: Order) => o.id),
          staffId: 1,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Payout failed");
      const data = await res.json();
      toast({
        title: "Vendor payment complete",
        description: `${data.ordersProcessed} orders settled. Ref: ${data.transferReference}`,
      });
    } catch {
      toast({ title: "Payment failed", description: "Could not process vendor payout", variant: "destructive" });
    }
    setPaying(false);
    setSelectedIds(new Set());
    setShowPaySummary(false);
  };

  const batches: Record<string, Order[]> = {};
  paidOrders.forEach((o: Order) => {
    const created = o.createdAt ? new Date(o.createdAt) : new Date();
    const label = o.batchTime || getBatchLabel(created.getHours());
    if (!batches[label]) batches[label] = [];
    batches[label].push(o);
  });

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
            <Button onClick={() => setShowPaySummary(true)} data-testid="button-pay-vendors">
              <CreditCard className="w-4 h-4 mr-2" /> Pay Selected ({selectedIds.size})
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
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-enter">
              <h2 className="text-xl font-bold">Vendor Settlement Summary</h2>
              <p className="text-sm text-muted-foreground">
                The following amounts will be paid to vendors. All values are calculated automatically.
              </p>

              <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selected Orders</span>
                  <span className="font-medium">{selectedOrders.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order Codes</span>
                  <span className="font-medium text-right">{selectedOrders.map(o => o.orderCode).join(", ")}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Vendor Payout</span>
                  <span className="text-primary" data-testid="text-vendor-payout">
                    ₦{selectedTotal.toLocaleString()}
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
      </main>
    </div>
  );
}
