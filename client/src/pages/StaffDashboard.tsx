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
import { Package, Clock, CreditCard, Truck, Loader2, CheckCircle, Receipt, Lock, Unlock, Copy, MessageCircle, MapPin, BarChart3, CalendarIcon, History } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type Order, type OrderItem, type Product, type State, type Lga, type Estate } from "@shared/schema";
import { Link } from "wouter";

type TabId = "batch" | "vendor" | "delivery" | "whatsapp" | "stats" | "history";

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
  const [currentVendorIndex, setCurrentVendorIndex] = useState(0);
  const [paidVendors, setPaidVendors] = useState<any[]>([]);

  const [vendorSortBy, setVendorSortBy] = useState<"name" | "amount">("name");
  const [vendorPayTarget, setVendorPayTarget] = useState<{
    vendorId: number; vendorName: string; orderIds: number[];
    preview: any; orderItems: Record<number, { orderCode: string; items: EnrichedItem[] }>;
  } | null>(null);
  const [payingVendor, setPayingVendor] = useState(false);
  const [vendorPayResult, setVendorPayResult] = useState<any>(null);
  const [statsFrom, setStatsFrom] = useState<Date>(new Date());
  const [statsPeriod, setStatsPeriod] = useState<"week" | "twoWeek" | "month">("week");

  const statsFromISO = statsFrom.toISOString().slice(0, 10);
  const { data: deliveryStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/staff/delivery-stats', statsFromISO],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/staff/delivery-stats?from=${statsFromISO}`);
      return await res.json();
    },
    enabled: tab === "stats",
  });

  const { data: historyOrders, isLoading: historyLoading } = useQuery<Order[]>({
    queryKey: ['/api/staff/delivery-history'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/staff/delivery-history");
      return await res.json();
    },
    enabled: tab === "history",
  });

  const getStatsEndLabel = () => {
    const d = new Date(statsFrom);
    if (statsPeriod === "week") d.setDate(d.getDate() + 7);
    else if (statsPeriod === "twoWeek") d.setDate(d.getDate() + 14);
    else d.setDate(d.getDate() + 30);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  };

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
      setCurrentVendorIndex(0);
      setPaidVendors([]);
      setShowPaySummary(true);
    } catch {
      toast({ title: "Error", description: "Could not load payout preview", variant: "destructive" });
    }
    setLoadingPreview(false);
  };

  const handlePayCurrentVendor = async () => {
    const currentVendor = breakdown[currentVendorIndex];
    if (!currentVendor) return;
    setPaying(true);
    try {
      const res = await apiRequest("POST", "/api/vendor-payout", {
        orderIds: Array.from(selectedIds),
        vendorId: currentVendor.vendorId,
      });
      const data = await res.json();
      const result = data.payments?.[0] || { vendorId: currentVendor.vendorId, vendorName: currentVendor.vendorName, amount: currentVendor.amount, transferReference: "—" };
      const newPaid = [...paidVendors, result];
      setPaidVendors(newPaid);
      toast({ title: `Paid ${currentVendor.vendorName}`, description: `₦${currentVendor.amount.toLocaleString()} settled.` });

      const nextIndex = currentVendorIndex + 1;
      if (nextIndex >= breakdown.length) {
        setPaymentResults(newPaid);
        setShowReceipts(true);
        setShowPaySummary(false);
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders/items-bulk"] });
      } else {
        setCurrentVendorIndex(nextIndex);
      }
    } catch {
      toast({ title: "Payment failed", description: `Could not pay ${currentVendor.vendorName}. Try again.`, variant: "destructive" });
    }
    setPaying(false);
  };

  const handleSelectVendorToPay = async (vendorId: number) => {
    const group = vendorGroups[vendorId];
    if (!group) return;
    setLoadingPreview(true);
    try {
      const res = await apiRequest("POST", "/api/vendor-payout/preview", { orderIds: group.orders.map(o => o.id) });
      const data = await res.json();
      const vendorPreview = (data.breakdown || []).find((b: any) => b.vendorId === vendorId) || data.breakdown?.[0] || {};
      setVendorPayTarget({
        vendorId,
        vendorName: group.vendorName,
        orderIds: group.orders.map(o => o.id),
        preview: vendorPreview,
        orderItems: group.orderItems,
      });
      setVendorPayResult(null);
    } catch {
      toast({ title: "Error", description: "Could not load vendor details", variant: "destructive" });
    }
    setLoadingPreview(false);
  };

  const handleConfirmVendorPay = async () => {
    if (!vendorPayTarget) return;
    setPayingVendor(true);
    try {
      const res = await apiRequest("POST", "/api/vendor-payout", {
        orderIds: vendorPayTarget.orderIds,
        vendorId: vendorPayTarget.vendorId,
      });
      const data = await res.json();
      const result = data.payments?.[0] || { vendorName: vendorPayTarget.vendorName, amount: vendorPayTarget.preview?.amount, transferReference: "—" };
      setVendorPayResult(result);
      toast({ title: `Paid ${vendorPayTarget.vendorName}`, description: `₦${(result.amount || 0).toLocaleString()} settled.` });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/items-bulk"] });
    } catch {
      toast({ title: "Payment failed", description: `Could not pay ${vendorPayTarget.vendorName}. Try again.`, variant: "destructive" });
    }
    setPayingVendor(false);
  };

  const maskAccount = (acc: string) => acc && acc.length > 4 ? "****" + acc.slice(-4) : acc || "N/A";

  const batches: Record<string, Order[]> = {};
  for (const o of [...paidOrders, ...acceptedOrders]) {
    const label = o.batchTime || "Other";
    if (!batches[label]) batches[label] = [];
    batches[label].push(o);
  }

  const vendorGroups: Record<number, {
    vendorId: number; vendorName: string; orders: Order[]; items: EnrichedItem[];
    totalPayout: number; orderItems: Record<number, { orderCode: string; items: EnrichedItem[] }>;
  }> = {};
  for (const o of acceptedOrders) {
    const oItems = itemsByOrder.get(o.id) || [];
    for (const item of oItems) {
      if (item.vendorPaid) continue;
      const vId = (item.product as any)?.vendorId as number;
      if (!vId) continue;
      if (!vendorGroups[vId]) vendorGroups[vId] = { vendorId: vId, vendorName: item.vendorName || "Unknown", orders: [], items: [], totalPayout: 0, orderItems: {} };
      if (!vendorGroups[vId].orders.find(x => x.id === o.id)) vendorGroups[vId].orders.push(o);
      vendorGroups[vId].items.push(item);
      vendorGroups[vId].totalPayout += item.vendorCostSnapshot * item.quantity;
      if (!vendorGroups[vId].orderItems[o.id]) vendorGroups[vId].orderItems[o.id] = { orderCode: o.orderCode, items: [] };
      vendorGroups[vId].orderItems[o.id].items.push(item);
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
    const estateNames = new Set<string>();
    let batchTime = "";
    for (const o of myOrders) {
      estateNames.add(getEstateName(o.estateId));
      if (o.batchTime && !batchTime) batchTime = o.batchTime;
    }
    const lines = Array.from(estateNames).map(name => `📍 ${name}`).join("\n\n");
    const deliveryTime = batchTime ? `Estimated delivery: ${batchTime} batch` : "Estimated delivery: Today";
    return `📦 DELIVERY UPDATE\nOrders processed for:\n\n${lines}\n\n${deliveryTime}`;
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
    { id: "vendor", label: "Vendor Pay", icon: CreditCard, count: Object.keys(vendorGroups).length },
    { id: "delivery", label: "Delivery", icon: Truck, count: readyOrders.length },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { id: "history", label: "History", icon: History },
    { id: "stats", label: "Stats", icon: BarChart3 },
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
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary" data-testid={`text-order-code-${order.id}`}>{order.orderCode}</span>
                              <Badge variant={order.status === "accepted" ? "default" : "outline"} className="text-xs">
                                {order.status === "accepted" ? "Claimed" : "Paid"}
                              </Badge>
                            </div>
                            <span className="font-bold">₦{(order.totalAmount - order.deliveryFee).toLocaleString()}</span>
                          </div>
                          {order.createdAt && (
                            <p className="text-xs text-muted-foreground mb-2" data-testid={`text-order-date-${order.id}`}>
                              {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}

                          {oItems.length > 0 && (
                            <div className="text-sm space-y-1 mb-3">
                              {oItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span><strong className="text-foreground">{item.product?.name}</strong> x{item.quantity} <span className="text-xs text-muted-foreground">({item.vendorName})</span></span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold">₦{(item.priceSnapshot * item.quantity).toLocaleString()}</span>
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

            {!vendorPayTarget && (
              <>
                {Object.keys(vendorGroups).length === 0 ? (
                  <div className="text-center py-16">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No unpaid vendor items</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground font-medium">
                        {Object.keys(vendorGroups).length} vendor{Object.keys(vendorGroups).length !== 1 ? "s" : ""} to pay — choose who to pay first
                      </p>
                      <div className="flex gap-1">
                        <Button size="sm" variant={vendorSortBy === "name" ? "default" : "outline"} onClick={() => setVendorSortBy("name")} className="h-7 text-xs px-2">
                          A–Z
                        </Button>
                        <Button size="sm" variant={vendorSortBy === "amount" ? "default" : "outline"} onClick={() => setVendorSortBy("amount")} className="h-7 text-xs px-2">
                          ₦ Highest
                        </Button>
                      </div>
                    </div>

                    {Object.values(vendorGroups)
                      .sort((a, b) => vendorSortBy === "name"
                        ? a.vendorName.localeCompare(b.vendorName)
                        : b.totalPayout - a.totalPayout)
                      .map(group => (
                        <div key={group.vendorId} className="bg-white rounded-xl border border-border/50 p-4" data-testid={`vendor-group-${group.vendorId}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-base">{group.vendorName}</p>
                              <p className="text-xs text-muted-foreground">
                                {group.orders.length} customer order{group.orders.length !== 1 ? "s" : ""} · {group.items.length} item line{group.items.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <span className="font-bold text-primary text-lg">₦{group.totalPayout.toLocaleString()}</span>
                          </div>

                          <div className="space-y-3 mb-3">
                            {Object.entries(group.orderItems).map(([orderId, od]) => (
                              <div key={orderId} className="bg-muted/40 rounded-lg p-2.5">
                                <p className="text-xs font-semibold text-muted-foreground mb-1.5">{od.orderCode}</p>
                                <div className="space-y-1">
                                  {od.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                      <span className="text-foreground">{item.product?.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                                      <span className="font-medium">₦{(item.vendorCostSnapshot * item.quantity).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleSelectVendorToPay(group.vendorId)}
                            disabled={loadingPreview}
                            data-testid={`button-pay-vendor-${group.vendorId}`}
                          >
                            {loadingPreview ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CreditCard className="w-3 h-3 mr-1" />}
                            Pay {group.vendorName}
                          </Button>
                        </div>
                      ))}
                  </>
                )}
              </>
            )}

            {vendorPayTarget && !vendorPayResult && (
              <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setVendorPayTarget(null)} className="p-1 h-auto">
                    ← Back
                  </Button>
                  <h2 className="font-bold text-lg">Confirm Payment</h2>
                </div>

                <div className="border-2 border-primary/20 rounded-xl p-4 space-y-3 bg-primary/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-base">{vendorPayTarget.vendorName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {vendorPayTarget.preview?.accountNameVerified || vendorPayTarget.preview?.bankName || "—"} · {maskAccount(vendorPayTarget.preview?.accountNumber)}
                      </p>
                      {vendorPayTarget.preview?.recipientCode && (
                        <Badge variant="outline" className="text-xs mt-1">Verified ✓</Badge>
                      )}
                    </div>
                    <span className="font-bold text-primary text-xl">₦{(vendorPayTarget.preview?.amount || 0).toLocaleString()}</span>
                  </div>

                  <div className="border-t border-primary/10 pt-3 space-y-3">
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Items by Customer Order</p>
                    {Object.entries(vendorPayTarget.orderItems).map(([orderId, od]) => (
                      <div key={orderId} className="bg-white rounded-lg p-2.5 border border-primary/10">
                        <p className="text-xs font-semibold text-primary mb-1.5">{od.orderCode}</p>
                        <div className="space-y-1">
                          {od.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                              <span>{item.product?.name} × {item.quantity}</span>
                              <span className="font-medium text-foreground">₦{(item.vendorCostSnapshot * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground bg-yellow-50 rounded-lg p-3">
                  Payment is row-locked per vendor to prevent duplicates. Only items for {vendorPayTarget.vendorName} will be settled.
                </p>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setVendorPayTarget(null)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleConfirmVendorPay} disabled={payingVendor} data-testid={`button-confirm-vendor-pay-${vendorPayTarget.vendorId}`}>
                    {payingVendor ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    Confirm — Pay {vendorPayTarget.vendorName}
                  </Button>
                </div>
              </div>
            )}

            {vendorPayTarget && vendorPayResult && (
              <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Payment Sent!</h2>
                  <p className="text-sm text-muted-foreground mt-1">{vendorPayResult.vendorName} has been settled</p>
                </div>
                <div className="bg-secondary/30 rounded-xl p-4 text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-bold text-primary">₦{(vendorPayResult.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Reference</span>
                    <span className="text-xs font-medium">{vendorPayResult.transferReference}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => { setVendorPayTarget(null); setVendorPayResult(null); }}
                    data-testid="button-pay-another-vendor"
                  >
                    Pay Another Vendor
                  </Button>
                </div>
              </div>
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
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-primary">{order.orderCode}</span>
                          <span className="font-bold">₦{order.totalAmount.toLocaleString()}</span>
                        </div>
                        {order.createdAt && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
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

        {tab === "history" && (
          <div className="space-y-4" data-testid="section-delivery-history">
            <h2 className="font-semibold text-lg">Delivery History</h2>
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !historyOrders || historyOrders.length === 0 ? (
              <div className="text-center py-16">
                <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No deliveries yet</p>
              </div>
            ) : (() => {
              const grouped: Record<string, Record<string, Order[]>> = {};
              for (const o of historyOrders) {
                const dayKey = o.createdAt
                  ? new Date(o.createdAt).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
                  : "Unknown Date";
                const batchKey = o.batchTime || "No Batch";
                if (!grouped[dayKey]) grouped[dayKey] = {};
                if (!grouped[dayKey][batchKey]) grouped[dayKey][batchKey] = [];
                grouped[dayKey][batchKey].push(o);
              }
              return Object.entries(grouped).map(([day, batches]) => {
                const dayTotal = Object.values(batches).flat().length;
                return (
                  <div key={day} className="bg-white dark:bg-card rounded-xl border border-border/50 overflow-hidden">
                    <div className="bg-primary/5 px-4 py-3 flex items-center justify-between border-b border-border/30">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">{day}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{dayTotal} {dayTotal === 1 ? "order" : "orders"}</Badge>
                    </div>
                    <div className="divide-y divide-border/30">
                      {Object.entries(batches).map(([batch, batchOrders]) => (
                        <div key={batch} className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase">{batch} Batch</span>
                            <Badge variant="outline" className="text-xs">{batchOrders.length}</Badge>
                          </div>
                          <div className="space-y-2">
                            {batchOrders.map((order) => (
                              <div key={order.id} className="flex items-center justify-between py-1" data-testid={`history-order-${order.id}`}>
                                <div>
                                  <span className="font-bold text-primary text-sm">{order.orderCode}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {getEstateName(order.estateId)}
                                  </span>
                                </div>
                                <span className="font-semibold text-sm">₦{(order.totalAmount - order.deliveryFee).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {tab === "stats" && (
          <div className="space-y-4" data-testid="section-delivery-stats">
            <h2 className="font-semibold text-lg">Delivery Performance</h2>

            <div className="bg-white dark:bg-card rounded-xl border border-border/50 p-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Start from</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="button-stats-calendar">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {statsFrom.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={statsFrom}
                    onSelect={(d) => d && setStatsFrom(d)}
                    disabled={(d) => d > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <p className="text-sm font-medium text-muted-foreground">Sort by period</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "week" as const, label: "Weekly" },
                  { key: "twoWeek" as const, label: "Bi-weekly" },
                  { key: "month" as const, label: "Monthly" },
                ]).map(p => (
                  <Button
                    key={p.key}
                    size="sm"
                    variant={statsPeriod === p.key ? "default" : "outline"}
                    onClick={() => setStatsPeriod(p.key)}
                    data-testid={`button-stats-${p.key}`}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : deliveryStats ? (
              <div className="space-y-3">
                <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 text-center">
                  <div className="text-5xl font-bold text-primary mb-1" data-testid="text-stats-count">
                    {deliveryStats[statsPeriod] ?? 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    deliveries from{" "}
                    <span className="font-medium text-foreground">
                      {statsFrom.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                    </span>
                    {" "}to{" "}
                    <span className="font-medium text-foreground">{getStatsEndLabel()}</span>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className={`rounded-xl border p-4 text-center transition-colors ${statsPeriod === "week" ? "border-primary bg-primary/5" : "border-border/50 bg-white dark:bg-card"}`}>
                    <p className="text-2xl font-bold" data-testid="text-stats-week">{deliveryStats.week ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">7 days</p>
                  </div>
                  <div className={`rounded-xl border p-4 text-center transition-colors ${statsPeriod === "twoWeek" ? "border-primary bg-primary/5" : "border-border/50 bg-white dark:bg-card"}`}>
                    <p className="text-2xl font-bold" data-testid="text-stats-twoweek">{deliveryStats.twoWeek ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">14 days</p>
                  </div>
                  <div className={`rounded-xl border p-4 text-center transition-colors ${statsPeriod === "month" ? "border-primary bg-primary/5" : "border-border/50 bg-white dark:bg-card"}`}>
                    <p className="text-2xl font-bold" data-testid="text-stats-month">{deliveryStats.month ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">30 days</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-card rounded-xl border border-border/50 p-4">
                  <p className="text-sm font-medium mb-1">Total from selected date</p>
                  <p className="text-lg font-bold text-primary" data-testid="text-stats-total">{deliveryStats.total ?? 0} deliveries</p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {showPaySummary && breakdown.length > 0 && (() => {
          const currentVendor = breakdown[currentVendorIndex];
          const totalVendors = breakdown.length;
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Vendor Settlement</h2>
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {currentVendorIndex + 1} of {totalVendors}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">
                  Pay each vendor one at a time. Confirm each payment before moving to the next.
                </p>

                {paidVendors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Already Paid</p>
                    {paidVendors.map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm font-medium text-green-800">{v.vendorName}</span>
                        </div>
                        <span className="text-sm font-bold text-green-700">₦{v.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-2 border-primary/20 rounded-xl p-4 space-y-3 bg-primary/5" data-testid={`vendor-breakdown-${currentVendor.vendorId}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-base">{currentVendor.vendorName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {currentVendor.accountNameVerified || currentVendor.bankName} &middot; {maskAccount(currentVendor.accountNumber)}
                      </p>
                      {currentVendor.recipientCode && (
                        <Badge variant="outline" className="text-xs mt-1">Verified ✓</Badge>
                      )}
                    </div>
                    <span className="font-bold text-primary text-lg">₦{currentVendor.amount.toLocaleString()}</span>
                  </div>
                  {currentVendor.items && (
                    <div className="border-t border-primary/10 pt-3 text-xs space-y-1.5 text-muted-foreground">
                      <p className="font-semibold text-foreground mb-1">Items</p>
                      {currentVendor.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.productName} × {it.qty}</span>
                          <span className="font-medium">₦{(it.unitCost * it.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-primary/5 rounded-xl px-4 py-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining after this</span>
                  <span className="font-bold text-primary">
                    ₦{(totalPayout - paidVendors.reduce((s: number, v: any) => s + v.amount, 0) - currentVendor.amount).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground bg-yellow-50 rounded-lg p-3">
                  Row-locked to prevent duplicate payments. Each vendor is paid independently.
                </p>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setShowPaySummary(false); setPaidVendors([]); setCurrentVendorIndex(0); }} data-testid="button-cancel-pay">
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handlePayCurrentVendor} disabled={paying} data-testid="button-confirm-pay">
                    {paying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    Pay {currentVendor.vendorName}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

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
