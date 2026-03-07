import { Navigation } from "@/components/Navigation";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { useStates, useLgas, useEstates } from "@/hooks/use-locations";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Clock, CreditCard, Truck, Loader2, CheckCircle, Receipt, Lock, Unlock, Copy, MessageCircle, MapPin } from "lucide-react";
import { type Order, type OrderItem, type Product, type State, type Lga, type Estate } from "@shared/schema";
import { Link } from "wouter";

type TabId = "batch" | "vendor" | "delivery" | "whatsapp";

interface EnrichedItem extends OrderItem {
  product: Product;
  vendorName: string;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();

  const { data: statesData } = useStates();
  const { data: lgasData } = useLgas(user?.stateId || undefined);
  const { data: estatesData } = useEstates(user?.lgaId || undefined);

  const stateName = user?.stateId && statesData
    ? (statesData as State[]).find((s) => s.id === user.stateId)?.name || "—"
    : "—";
  const lgaName = user?.lgaId && lgasData
    ? (lgasData as Lga[]).find((l) => l.id === user.lgaId)?.name || "—"
    : "—";

  const estateMap = new Map<number, string>();
  if (estatesData) {
    for (const e of estatesData as Estate[]) {
      estateMap.set(e.id, e.name);
    }
  }
  const getEstateName = (estateId: number) => estateMap.get(estateId) || `Estate ${estateId}`;
  const [tab, setTab] = useState<TabId>("batch");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showPaySummary, setShowPaySummary] = useState(false);
  const [paying, setPaying] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [totalPayout, setTotalPayout] = useState(0);
  const [paymentResults, setPaymentResults] = useState<any[]>([]);
  const [showReceipts, setShowReceipts] = useState(false);

  const allOrders = (orders as Order[] || []);

  const paidOrders = allOrders.filter((o) => o.status === "paid");
  const acceptedOrders = allOrders.filter((o) => o.status === "accepted");
  const readyOrders = allOrders.filter((o) => o.status === "ready_for_delivery");
  const activeOrders = [...paidOrders, ...acceptedOrders, ...readyOrders];
  const claimedOrders = activeOrders.filter((o) => o.claimedByStaffId === user?.id);

  const orderIdsForItems = activeOrders.map(o => o.id);

  const { data: itemsData } = useQuery({
    queryKey: ['/api/orders/items-bulk', orderIdsForItems.join(',')],
    enabled: orderIdsForItems.length > 0,
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/orders/items-bulk", { orderIds: orderIdsForItems });
      return await res.json();
    },
  });

  const { data: batchStatus } = useQuery({
    queryKey: ['/api/batches/status'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/batches/status");
      return await res.json();
    },
  });

  const enrichedItems = (itemsData || []) as EnrichedItem[];

  const itemsByOrder = new Map<number, EnrichedItem[]>();
  for (const item of enrichedItems) {
    const list = itemsByOrder.get(item.orderId) || [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  const handleAccept = async (orderId: number) => {
    updateStatus.mutate(
      { id: orderId, status: "accepted" },
      {
        onSuccess: () => {
          toast({ title: "Order accepted", description: "You have claimed this order." });
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        },
        onError: (err: any) => {
          toast({ title: "Failed", description: err.message || "Could not accept order", variant: "destructive" });
        },
      }
    );
  };

  const handleMarkDelivered = async (orderId: number) => {
    updateStatus.mutate(
      { id: orderId, status: "delivered" },
      {
        onSuccess: () => {
          toast({ title: "Delivered!", description: "Order marked as delivered." });
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        },
        onError: (err: any) => {
          toast({ title: "Failed", description: err.message || "Could not mark delivered", variant: "destructive" });
        },
      }
    );
  };

  const handleLockBatch = async () => {
    try {
      await apiRequest("POST", "/api/batches/lock");
      toast({ title: "Batch locked", description: "New orders will go to next batch." });
      queryClient.invalidateQueries({ queryKey: ["/api/batches/status"] });
    } catch {
      toast({ title: "Failed", description: "Could not lock batch", variant: "destructive" });
    }
  };

  const handleUnlockBatch = async () => {
    try {
      await apiRequest("POST", "/api/batches/unlock");
      toast({ title: "Batch unlocked" });
      queryClient.invalidateQueries({ queryKey: ["/api/batches/status"] });
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleShowPaySummary = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setLoadingPreview(true);
    try {
      const res = await apiRequest("POST", "/api/vendor-payout/preview", { orderIds: ids });
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
      const res = await apiRequest("POST", "/api/vendor-payout", { orderIds: Array.from(selectedIds) });
      const data = await res.json();
      setPaymentResults(data.payments || []);
      setShowReceipts(true);
      setShowPaySummary(false);
      toast({ title: "Vendor payment complete", description: `${data.ordersProcessed} orders settled.` });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/items-bulk"] });
    } catch {
      toast({ title: "Payment failed", description: "Could not process vendor payout", variant: "destructive" });
    }
    setPaying(false);
    setSelectedIds(new Set());
  };

  const maskAccount = (acc: string) => acc && acc.length > 4 ? "****" + acc.slice(-4) : acc || "N/A";

  const batches: Record<string, Order[]> = {};
  for (const o of [...paidOrders, ...acceptedOrders]) {
    const label = o.batchTime || "Other";
    if (!batches[label]) batches[label] = [];
    batches[label].push(o);
  }

  const vendorGroups: Record<string, { vendorName: string; orders: Order[]; items: EnrichedItem[]; totalPayout: number }> = {};
  for (const o of acceptedOrders) {
    const oItems = itemsByOrder.get(o.id) || [];
    for (const item of oItems) {
      if (item.vendorPaid) continue;
      const key = item.vendorName || "Unknown";
      if (!vendorGroups[key]) vendorGroups[key] = { vendorName: key, orders: [], items: [], totalPayout: 0 };
      if (!vendorGroups[key].orders.find(x => x.id === o.id)) vendorGroups[key].orders.push(o);
      vendorGroups[key].items.push(item);
      vendorGroups[key].totalPayout += item.vendorCostSnapshot * item.quantity;
    }
  }

  const estateGroups: Record<string, Order[]> = {};
  for (const o of readyOrders) {
    const key = getEstateName(o.estateId);
    if (!estateGroups[key]) estateGroups[key] = [];
    estateGroups[key].push(o);
  }

  const generatePickupMessage = () => {
    const myOrders = claimedOrders.filter(o => o.status === "accepted");
    if (myOrders.length === 0) return "";
    const codes = myOrders.map(o => o.orderCode).join("\n");
    return `📦 DELIVERY UPDATE\nOrders processed:\n${codes}\n\nEstimated delivery: Today`;
  };

  const generateDeliveryMessage = () => {
    const delivered = allOrders.filter(o => o.status === "delivered" && o.claimedByStaffId === user?.id);
    if (delivered.length === 0) return "";
    const estateNames = new Set<string>();
    for (const o of delivered) {
      estateNames.add(getEstateName(o.estateId));
    }
    const lines = Array.from(estateNames).map(name => `📍 ${name}`).join("\n\n");
    return `✅ DELIVERY COMPLETED\n\n${lines}\n\nThank you for shopping with RelaxShopping!`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Message copied to clipboard" });
  };

  const tabs: { id: TabId; label: string; icon: any; count?: number }[] = [
    { id: "batch", label: "Batch Board", icon: Clock, count: paidOrders.length + acceptedOrders.length },
    { id: "vendor", label: "Vendor Pickup", icon: CreditCard, count: Object.keys(vendorGroups).length },
    { id: "delivery", label: "Delivery", icon: Truck, count: readyOrders.length },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-1" data-testid="text-staff-title">Staff Dashboard</h1>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4" data-testid="text-staff-location">
          <MapPin className="w-3.5 h-3.5" />
          <span>{stateName}</span>
          <span>→</span>
          <span>{lgaName}</span>
        </div>

        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {tabs.map(t => (
            <Button
              key={t.id}
              variant={tab === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.id)}
              className="whitespace-nowrap"
              data-testid={`button-tab-${t.id}`}
            >
              <t.icon className="w-4 h-4 mr-1" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">{t.count}</Badge>
              )}
            </Button>
          ))}
        </div>

        {isLoading && <p className="text-muted-foreground">Loading orders...</p>}

        {tab === "batch" && !isLoading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {batchStatus?.isCurrentLocked ? (
                  <Badge variant="destructive" className="gap-1"><Lock className="w-3 h-3" /> Current batch locked</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1"><Unlock className="w-3 h-3" /> Batch open</Badge>
                )}
              </div>
              <div className="flex gap-2">
                {batchStatus?.isCurrentLocked ? (
                  <Button size="sm" variant="outline" onClick={handleUnlockBatch} data-testid="button-unlock-batch">
                    <Unlock className="w-3 h-3 mr-1" /> Unlock
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={handleLockBatch} data-testid="button-lock-batch">
                    <Lock className="w-3 h-3 mr-1" /> Lock Batch
                  </Button>
                )}
                {selectedIds.size > 0 && (
                  <Button size="sm" onClick={handleShowPaySummary} disabled={loadingPreview} data-testid="button-pay-vendors">
                    {loadingPreview ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CreditCard className="w-3 h-3 mr-1" />}
                    Pay Vendors ({selectedIds.size})
                  </Button>
                )}
              </div>
            </div>

            {Object.keys(batches).length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No orders in current batches</p>
              </div>
            ) : (
              Object.entries(batches).map(([batchLabel, batchOrders]) => (
                <div key={batchLabel}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <h2 className="font-semibold" data-testid={`text-batch-${batchLabel}`}>{batchLabel} Batch</h2>
                    <Badge variant="secondary">{batchOrders.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {batchOrders.map((order) => {
                      const oItems = itemsByOrder.get(order.id) || [];
                      return (
                        <div
                          key={order.id}
                          className={`bg-white rounded-xl border p-4 ${selectedIds.has(order.id) ? "border-primary bg-primary/5" : "border-border/50"}`}
                          data-testid={`card-order-${order.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary" data-testid={`text-order-code-${order.id}`}>{order.orderCode}</span>
                              <Badge variant={order.status === "accepted" ? "default" : "outline"} className="text-xs">
                                {order.status === "accepted" ? "Claimed" : "Paid"}
                              </Badge>
                            </div>
                            <span className="font-bold">₦{(order.totalAmount - order.deliveryFee).toLocaleString()}</span>
                          </div>

                          {oItems.length > 0 && (
                            <div className="text-sm text-muted-foreground space-y-1 mb-3">
                              {oItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{item.product?.name} x{item.quantity} <span className="text-xs">({item.vendorName})</span></span>
                                  <div className="flex items-center gap-1">
                                    <span>₦{(item.priceSnapshot * item.quantity).toLocaleString()}</span>
                                    {item.vendorPaid && <CheckCircle className="w-3 h-3 text-green-500" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            {order.status === "paid" && (
                              <Button size="sm" onClick={() => handleAccept(order.id)} disabled={updateStatus.isPending} data-testid={`button-accept-${order.id}`}>
                                Accept
                              </Button>
                            )}
                            {order.status === "accepted" && (
                              <Button
                                size="sm" variant="outline"
                                onClick={() => toggleSelection(order.id)}
                                data-testid={`button-select-${order.id}`}
                              >
                                {selectedIds.has(order.id) ? "Deselect" : "Select for Payout"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "vendor" && !isLoading && (
          <div className="space-y-4">
            {Object.keys(vendorGroups).length === 0 ? (
              <div className="text-center py-16">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No unpaid vendor items</p>
              </div>
            ) : (
              Object.entries(vendorGroups).map(([vendorName, group]) => (
                <div key={vendorName} className="bg-white rounded-xl border border-border/50 p-4" data-testid={`vendor-group-${vendorName}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">{vendorName}</p>
                      <p className="text-xs text-muted-foreground">{group.orders.length} orders</p>
                    </div>
                    <span className="font-bold text-primary">₦{group.totalPayout.toLocaleString()}</span>
                  </div>

                  <div className="text-sm space-y-1 mb-3">
                    {group.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span>{item.product?.name} x{item.quantity}</span>
                        <span>₦{(item.vendorCostSnapshot * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground mb-2">
                    Orders: {group.orders.map(o => o.orderCode).join(", ")}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      const ids = group.orders.map(o => o.id);
                      setSelectedIds(new Set(ids));
                      handleShowPaySummary();
                    }}
                    data-testid={`button-pay-${vendorName}`}
                  >
                    <CreditCard className="w-3 h-3 mr-1" /> Pay Vendor
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "delivery" && !isLoading && (
          <div className="space-y-4">
            {readyOrders.length === 0 ? (
              <div className="text-center py-16">
                <Truck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No orders ready for delivery</p>
              </div>
            ) : (
              Object.entries(estateGroups).map(([estateName, eOrders]) => (
                <div key={estateName}>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{estateName}</h3>
                    <Badge variant="secondary">{eOrders.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {eOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-xl border border-border/50 p-4" data-testid={`delivery-order-${order.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-primary">{order.orderCode}</span>
                          <span className="font-bold">₦{order.totalAmount.toLocaleString()}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleMarkDelivered(order.id)}
                          disabled={updateStatus.isPending || order.claimedByStaffId !== user?.id}
                          data-testid={`button-deliver-${order.id}`}
                        >
                          <Truck className="w-3 h-3 mr-1" /> Mark Delivered
                        </Button>
                        {order.claimedByStaffId !== user?.id && (
                          <p className="text-xs text-muted-foreground mt-1">Only the claiming staff can deliver</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "whatsapp" && !isLoading && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-border/50 p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" /> Pickup Update
              </h3>
              <pre className="bg-secondary/30 rounded-lg p-4 text-sm whitespace-pre-wrap mb-3" data-testid="text-pickup-template">
                {generatePickupMessage() || "No claimed orders to announce"}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(generatePickupMessage())}
                disabled={!generatePickupMessage()}
                data-testid="button-copy-pickup"
              >
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-border/50 p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Delivery Complete
              </h3>
              <pre className="bg-secondary/30 rounded-lg p-4 text-sm whitespace-pre-wrap mb-3" data-testid="text-delivery-template">
                {generateDeliveryMessage() || "No delivered orders yet"}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(generateDeliveryMessage())}
                disabled={!generateDeliveryMessage()}
                data-testid="button-copy-delivery"
              >
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>
          </div>
        )}

        {showPaySummary && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold">Vendor Settlement Summary</h2>
              <p className="text-sm text-muted-foreground">
                Item-level breakdown of payments to each vendor.
              </p>

              <div className="space-y-3">
                {breakdown.map((vendor: any) => (
                  <div key={vendor.vendorId} className="bg-secondary/30 rounded-xl p-4 space-y-2" data-testid={`vendor-breakdown-${vendor.vendorId}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{vendor.vendorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.accountNameVerified || vendor.bankName} &middot; {maskAccount(vendor.accountNumber)}
                        </p>
                        {vendor.recipientCode && (
                          <Badge variant="outline" className="text-xs mt-1">Verified</Badge>
                        )}
                      </div>
                      <span className="font-bold text-primary">₦{vendor.amount.toLocaleString()}</span>
                    </div>
                    {vendor.items && (
                      <div className="text-xs space-y-1 text-muted-foreground">
                        {vendor.items.map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>{it.productName} x{it.qty}</span>
                            <span>₦{(it.unitCost * it.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 rounded-xl p-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Vendor Payout</span>
                  <span className="text-primary">₦{totalPayout.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground bg-yellow-50 rounded-lg p-3">
                Payment amounts calculated from verified order data. Row-locked to prevent duplicate payments.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowPaySummary(false)} data-testid="button-cancel-pay">
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handlePay} disabled={paying} data-testid="button-confirm-pay">
                  {paying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Confirm & Pay
                </Button>
              </div>
            </div>
          </div>
        )}

        {showReceipts && paymentResults.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Settlement Complete</h2>
                <p className="text-sm text-muted-foreground mt-1">{paymentResults.length} vendor(s) paid</p>
              </div>

              <div className="space-y-3">
                {paymentResults.map((p: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-secondary/30 rounded-xl p-4" data-testid={`receipt-row-${idx}`}>
                    <div>
                      <p className="font-semibold">{p.vendorName}</p>
                      <p className="text-sm text-primary font-bold">₦{p.amount.toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{p.transferReference.slice(0, 15)}...</Badge>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={() => { setShowReceipts(false); setPaymentResults([]); }} data-testid="button-close-receipts">
                Done
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
