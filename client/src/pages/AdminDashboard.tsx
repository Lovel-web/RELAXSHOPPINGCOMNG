import { Navigation } from "@/components/Navigation";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useStates, useLgas } from "@/hooks/use-locations";
import { Users, Package, ShoppingCart, DollarSign, CheckCircle, Clock, UserCheck, Loader2, MapPin, Shield, Plus, Trash2, AlertTriangle } from "lucide-react";
import { type Order, type Product, type User, type State, type Lga } from "@shared/schema";

type AdminTab = "overview" | "orders" | "users" | "locations" | "finance";

export default function AdminDashboard() {
  const { data: orders } = useOrders();
  const { data: products } = useProducts();
  const { data: allUsers } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const [tab, setTab] = useState<AdminTab>("overview");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const allOrders = (orders as Order[]) || [];
  const allProducts = (products as Product[]) || [];
  const usersList = allUsers || [];

  const pendingUsers = usersList.filter((u) => !u.approved && (u.role === "vendor" || u.role === "staff"));

  const paidOrders = allOrders.filter((o) => o.status === "paid" || o.status === "ready_for_delivery" || o.status === "delivered");
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const deliveredOrders = allOrders.filter((o) => o.status === "delivered");

  const approveUser = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User approved" });
    },
    onError: () => {
      toast({ title: "Failed", variant: "destructive" });
    },
  });

  const stats = [
    { label: "Total Orders", value: allOrders.length, icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
    { label: "Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
    { label: "Products", value: allProducts.length, icon: Package, color: "text-purple-600 bg-purple-50" },
    { label: "Delivered", value: deliveredOrders.length, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" data-testid="text-admin-title">Admin Dashboard</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(["overview", "orders", "users", "locations", "finance"] as AdminTab[]).map(t => (
            <Button key={t} variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)} data-testid={`button-tab-${t}`}>
              {t === "users" && pendingUsers.length > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold mr-1">
                  {pendingUsers.length}
                </span>
              )}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-border/50 p-4" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-border/50 p-6">
              <h2 className="font-semibold text-lg mb-4">Recent Orders</h2>
              {allOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`row-order-${order.id}`}>
                  <div>
                    <span className="font-bold text-primary">{order.orderCode}</span>
                    <p className="text-sm text-muted-foreground">₦{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <Badge variant={order.status === "delivered" ? "default" : order.status === "paid" ? "secondary" : "outline"}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
              {allOrders.length === 0 && <p className="text-muted-foreground text-center py-8">No orders yet</p>}
            </div>
          </>
        )}

        {tab === "orders" && (
          <div className="bg-white rounded-xl border border-border/50 p-6">
            <h2 className="font-semibold text-lg mb-4">All Orders ({allOrders.length})</h2>
            <div className="space-y-3">
              {allOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`row-admin-order-${order.id}`}>
                  <div>
                    <span className="font-bold text-primary">{order.orderCode}</span>
                    <p className="text-sm text-muted-foreground">₦{order.totalAmount.toLocaleString()}</p>
                  </div>
                  <Badge variant={order.status === "delivered" ? "default" : order.status === "paid" ? "secondary" : "outline"}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-6">
            {pendingUsers.length > 0 && (
              <div className="bg-white rounded-xl border border-border/50 p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Pending Approval ({pendingUsers.length})
                </h2>
                <div className="space-y-3">
                  {pendingUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`row-pending-user-${u.id}`}>
                      <div>
                        <span className="font-semibold">{u.name}</span>
                        <p className="text-sm text-muted-foreground">{u.email || u.phone} &middot; {u.role}</p>
                        {u.accountNameVerified && (
                          <Badge variant="outline" className="text-xs mt-1">Bank: {u.accountNameVerified}</Badge>
                        )}
                      </div>
                      <Button size="sm" onClick={() => approveUser.mutate(u.id)} disabled={approveUser.isPending} data-testid={`button-approve-${u.id}`}>
                        {approveUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4 mr-1" />}
                        Approve
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-border/50 p-6">
              <h2 className="font-semibold text-lg mb-4">All Users ({usersList.length})</h2>
              <div className="space-y-3">
                {usersList.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`row-user-${u.id}`}>
                    <div>
                      <span className="font-semibold">{u.name}</span>
                      <p className="text-sm text-muted-foreground">{u.email || u.phone} &middot; {u.role}</p>
                    </div>
                    <Badge variant={u.approved ? "default" : "destructive"}>
                      {u.approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "locations" && <LocationManager />}
        {tab === "finance" && <FinancePanel />}
      </main>
    </div>
  );
}

function LocationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: statesData } = useStates();
  const [selectedStateId, setSelectedStateId] = useState<number | undefined>();
  const { data: lgasData } = useLgas(selectedStateId);

  const [newStateName, setNewStateName] = useState("");
  const [newLgaName, setNewLgaName] = useState("");
  const [newLgaWhatsapp, setNewLgaWhatsapp] = useState("");
  const [newLgaStateId, setNewLgaStateId] = useState<number | undefined>();
  const [newEstateName, setNewEstateName] = useState("");
  const [newEstateAbbr, setNewEstateAbbr] = useState("");
  const [newEstateLgaId, setNewEstateLgaId] = useState<number | undefined>();

  const { data: estatesData } = useQuery({
    queryKey: ['/api/lgas', newEstateLgaId, 'estates'],
    enabled: !!newEstateLgaId,
    queryFn: async () => {
      const res = await fetch(`/api/lgas/${newEstateLgaId}/estates`);
      return res.json();
    },
  });

  const createState = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/states", { name: newStateName });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/states"] });
      toast({ title: "State created" });
      setNewStateName("");
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const createLga = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/lgas", {
        stateId: newLgaStateId, name: newLgaName, whatsappLink: newLgaWhatsapp || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/states"] });
      toast({ title: "LGA created" });
      setNewLgaName(""); setNewLgaWhatsapp("");
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const createEstate = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/estates", {
        lgaId: newEstateLgaId, name: newEstateName, abbreviation: newEstateAbbr.toUpperCase(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lgas', newEstateLgaId, 'estates'] });
      toast({ title: "Estate created" });
      setNewEstateName(""); setNewEstateAbbr("");
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border/50 p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" /> Add State
        </h2>
        <div className="flex gap-2">
          <Input
            value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            placeholder="State name (e.g. Lagos)"
            data-testid="input-new-state"
          />
          <Button onClick={() => createState.mutate()} disabled={!newStateName || createState.isPending} data-testid="button-create-state">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
        {statesData && (
          <div className="mt-3 space-y-1">
            {(statesData as State[]).map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                <span>{s.name}</span>
                <Badge variant="outline">ID: {s.id}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border/50 p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" /> Add LGA
        </h2>
        <div className="space-y-3">
          <Select value={newLgaStateId?.toString()} onValueChange={(v) => setNewLgaStateId(Number(v))}>
            <SelectTrigger data-testid="select-lga-state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {(statesData as State[] || []).map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={newLgaName} onChange={(e) => setNewLgaName(e.target.value)} placeholder="LGA name" data-testid="input-new-lga" />
          <Input value={newLgaWhatsapp} onChange={(e) => setNewLgaWhatsapp(e.target.value)} placeholder="WhatsApp group link (optional)" data-testid="input-lga-whatsapp" />
          <Button onClick={() => createLga.mutate()} disabled={!newLgaStateId || !newLgaName || createLga.isPending} data-testid="button-create-lga">
            <Plus className="w-4 h-4 mr-1" /> Add LGA
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/50 p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" /> Add Estate
        </h2>
        <div className="space-y-3">
          <Select value={selectedStateId?.toString()} onValueChange={(v) => { setSelectedStateId(Number(v)); setNewEstateLgaId(undefined); }}>
            <SelectTrigger data-testid="select-estate-state">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {(statesData as State[] || []).map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedStateId && (
            <Select value={newEstateLgaId?.toString()} onValueChange={(v) => setNewEstateLgaId(Number(v))}>
              <SelectTrigger data-testid="select-estate-lga">
                <SelectValue placeholder="Select LGA" />
              </SelectTrigger>
              <SelectContent>
                {(lgasData as Lga[] || []).map(l => (
                  <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input value={newEstateName} onChange={(e) => setNewEstateName(e.target.value)} placeholder="Estate name" data-testid="input-new-estate" />
          <Input value={newEstateAbbr} onChange={(e) => setNewEstateAbbr(e.target.value)} placeholder="Abbreviation (e.g. HAW)" maxLength={5} data-testid="input-estate-abbr" />
          <Button onClick={() => createEstate.mutate()} disabled={!newEstateLgaId || !newEstateName || !newEstateAbbr || createEstate.isPending} data-testid="button-create-estate">
            <Plus className="w-4 h-4 mr-1" /> Add Estate
          </Button>
          {estatesData && (
            <div className="mt-3 space-y-1">
              {(estatesData as any[]).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <span>{e.name} ({e.abbreviation})</span>
                  <Badge variant={e.isActive !== false ? "outline" : "destructive"}>{e.isActive !== false ? "Active" : "Inactive"}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FinancePanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments } = useQuery({
    queryKey: ["/api/vendor-payments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/vendor-payments");
      return res.json();
    },
  });

  const { data: settlementSetting } = useQuery({
    queryKey: ["/api/settings", "settlement_enabled"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/settings/settlement_enabled");
        return res.json();
      } catch { return { value: "true" }; }
    },
  });

  const { data: systemModeSetting } = useQuery({
    queryKey: ["/api/settings", "system_mode"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/settings/system_mode");
        return res.json();
      } catch { return { value: "normal" }; }
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("PATCH", `/api/settings/${key}`, { value });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings", vars.key] });
      toast({ title: "Setting updated" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const settlementEnabled = settlementSetting?.value === "true";
  const systemMode = systemModeSetting?.value || "normal";
  const paymentsList = (payments || []) as any[];
  const totalSettled = paymentsList.reduce((sum: number, p: any) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border/50 p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" /> System Controls
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Settlement Enabled</p>
              <p className="text-xs text-muted-foreground">Toggle vendor payouts on/off</p>
            </div>
            <Switch
              checked={settlementEnabled}
              onCheckedChange={(checked) => updateSetting.mutate({ key: "settlement_enabled", value: checked ? "true" : "false" })}
              data-testid="switch-settlement"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">System Mode</p>
              <p className="text-xs text-muted-foreground">Controls checkout and settlement availability</p>
            </div>
            <Select
              value={systemMode}
              onValueChange={(v) => updateSetting.mutate({ key: "system_mode", value: v })}
            >
              <SelectTrigger className="w-40" data-testid="select-system-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {systemMode !== "normal" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">
                  {systemMode === "maintenance" ? "Maintenance Mode" : "Emergency Mode"}
                </p>
                <p className="text-yellow-700 text-xs">
                  {systemMode === "maintenance"
                    ? "Checkout is disabled. Deliveries still allowed."
                    : "Checkout and settlements are blocked. Only deliveries allowed."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Vendor Settlements</h2>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">₦{totalSettled.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total settled</p>
          </div>
        </div>

        <div className="space-y-3">
          {paymentsList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No settlements yet</p>
          ) : (
            paymentsList.map((p: any) => (
              <div key={p.id} className="border-b last:border-0 py-3" data-testid={`row-payment-${p.id}`}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-semibold">{p.vendorName}</p>
                    <p className="text-xs text-muted-foreground">By: {p.staffName} &middot; {p.transferReference}</p>
                  </div>
                  <span className="font-bold text-primary">₦{p.amount.toLocaleString()}</span>
                </div>
                {p.itemsSnapshot && (
                  <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    {p.itemsSnapshot.map((item: any, idx: number) => (
                      <div key={idx}>{item.productName} x{item.qty} — ₦{(item.vendorCost * item.qty).toLocaleString()}</div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
