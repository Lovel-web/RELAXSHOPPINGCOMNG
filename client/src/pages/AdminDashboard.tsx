import { Navigation } from "@/components/Navigation";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useStates, useLgas } from "@/hooks/use-locations";
import {
  Users, Package, ShoppingCart, DollarSign, CheckCircle, Clock, UserCheck, Loader2,
  MapPin, Shield, Plus, Trash2, AlertTriangle, ChevronRight, ChevronLeft, Pause, Play,
  Eye, Ban, UserX, ArrowLeftRight
} from "lucide-react";
import { type Order, type Product, type User, type State, type Lga, type Estate } from "@shared/schema";

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

        {tab === "users" && <UsersPanel pendingUsers={pendingUsers} usersList={usersList} approveUser={approveUser} />}
        {tab === "locations" && <LocationManager />}
        {tab === "finance" && <FinancePanel />}
      </main>
    </div>
  );
}

function UsersPanel({ pendingUsers, usersList, approveUser }: {
  pendingUsers: User[];
  usersList: User[];
  approveUser: any;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const blockUser = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/block`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User blocked" });
    },
    onError: () => toast({ title: "Failed to block user", variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteConfirmId(null);
      setSelectedUserId(null);
      toast({ title: "User deactivated" });
    },
    onError: () => toast({ title: "Failed to delete user", variant: "destructive" }),
  });

  const filtered = roleFilter === "all" ? usersList : usersList.filter(u => u.role === roleFilter);

  if (selectedUserId) {
    return <UserDetailView userId={selectedUserId} onBack={() => setSelectedUserId(null)} />;
  }

  return (
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">All Users ({filtered.length})</h2>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36" data-testid="select-role-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          {filtered.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`row-user-${u.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{u.name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">{u.role}</Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{u.email || u.phone}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Badge variant={u.approved ? "default" : "destructive"} className="text-xs">
                  {u.approved ? "Active" : "Blocked"}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(u.id)} data-testid={`button-view-user-${u.id}`}>
                  <Eye className="w-4 h-4" />
                </Button>
                {u.role !== "admin" && (
                  <>
                    {u.approved ? (
                      <Button variant="ghost" size="sm" onClick={() => blockUser.mutate(u.id)} disabled={blockUser.isPending} data-testid={`button-block-${u.id}`}>
                        <Ban className="w-4 h-4 text-orange-500" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => approveUser.mutate(u.id)} disabled={approveUser.isPending} data-testid={`button-unblock-${u.id}`}>
                        <UserCheck className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    {deleteConfirmId === u.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="destructive" size="sm" onClick={() => deleteUser.mutate(u.id)} disabled={deleteUser.isPending} data-testid={`button-confirm-delete-${u.id}`}>
                          {deleteUser.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} data-testid={`button-cancel-delete-${u.id}`}>
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(u.id)} data-testid={`button-delete-${u.id}`}>
                        <UserX className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserDetailView({ userId, onBack }: { userId: number; onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: statesData } = useStates();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load user");
      return res.json();
    },
  });

  const { data: userOrders } = useQuery<Order[]>({
    queryKey: ["/api/users", userId, "orders"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/orders`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json();
    },
  });

  const [reassignStateId, setReassignStateId] = useState<number | undefined>();
  const [reassignLgaId, setReassignLgaId] = useState<number | undefined>();
  const { data: reassignLgas } = useLgas(reassignStateId);

  const reassignUser = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/reassign`, {
        stateId: reassignStateId,
        lgaId: reassignLgaId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      toast({ title: "User reassigned" });
    },
    onError: () => toast({ title: "Failed to reassign", variant: "destructive" }),
  });

  if (userLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const orders = Array.isArray(userOrders) ? userOrders : [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} data-testid="button-back-users">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Users
      </Button>

      <div className="bg-white rounded-xl border border-border/50 p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> {user.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium" data-testid="text-user-email">{user.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p className="font-medium" data-testid="text-user-phone">{user.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Role</p>
            <Badge variant="outline" data-testid="text-user-role">{user.role}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge variant={user.approved ? "default" : "destructive"} data-testid="text-user-status">
              {user.approved ? "Active" : "Blocked"}
            </Badge>
          </div>
          {user.bankName && (
            <>
              <div>
                <p className="text-muted-foreground">Bank</p>
                <p className="font-medium">{user.bankName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account</p>
                <p className="font-medium">{user.accountNumber}</p>
              </div>
              {user.accountNameVerified && (
                <div className="md:col-span-2">
                  <p className="text-muted-foreground">Verified Name</p>
                  <p className="font-medium">{user.accountNameVerified}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {user.role !== "admin" && (
        <div className="bg-white rounded-xl border border-border/50 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" /> Reassign Location
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={reassignStateId?.toString() || ""} onValueChange={(v) => { setReassignStateId(Number(v)); setReassignLgaId(undefined); }}>
              <SelectTrigger data-testid="select-reassign-state">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {((statesData as State[]) || []).map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reassignStateId && (
              <Select value={reassignLgaId?.toString() || ""} onValueChange={(v) => setReassignLgaId(Number(v))}>
                <SelectTrigger data-testid="select-reassign-lga">
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent>
                  {((reassignLgas as Lga[]) || []).map(l => (
                    <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={() => reassignUser.mutate()}
              disabled={!reassignStateId || !reassignLgaId || reassignUser.isPending}
              data-testid="button-reassign-save"
            >
              {reassignUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border/50 p-6">
        <h3 className="font-semibold mb-4">Order History ({orders.length})</h3>
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No orders found</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o: Order) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`row-user-order-${o.id}`}>
                <div>
                  <span className="font-bold text-primary text-sm">{o.orderCode}</span>
                  <p className="text-xs text-muted-foreground">₦{o.totalAmount.toLocaleString()}</p>
                </div>
                <Badge variant={o.status === "delivered" ? "default" : "outline"} className="text-xs">
                  {o.status.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LocationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [view, setView] = useState<"states" | "lgas" | "estates">("states");
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedLgaId, setSelectedLgaId] = useState<number | null>(null);
  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedLgaName, setSelectedLgaName] = useState("");

  const { data: adminStates } = useQuery<State[]>({
    queryKey: ["/api/admin/states"],
    queryFn: async () => {
      const res = await fetch("/api/admin/states", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load states");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: adminLgas } = useQuery<Lga[]>({
    queryKey: ["/api/admin/states", selectedStateId, "lgas"],
    enabled: !!selectedStateId,
    queryFn: async () => {
      const res = await fetch(`/api/admin/states/${selectedStateId}/lgas`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load LGAs");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: adminEstates } = useQuery<Estate[]>({
    queryKey: ["/api/admin/lgas", selectedLgaId, "estates"],
    enabled: !!selectedLgaId,
    queryFn: async () => {
      const res = await fetch(`/api/admin/lgas/${selectedLgaId}/estates`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load estates");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: stateSummary } = useQuery({
    queryKey: ["/api/states", selectedStateId, "summary"],
    enabled: !!selectedStateId && view === "lgas",
    queryFn: async () => {
      const res = await fetch(`/api/states/${selectedStateId}/summary`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load summary");
      return res.json();
    },
  });

  const { data: lgaSummary } = useQuery({
    queryKey: ["/api/lgas", selectedLgaId, "summary"],
    enabled: !!selectedLgaId && view === "estates",
    queryFn: async () => {
      const res = await fetch(`/api/lgas/${selectedLgaId}/summary`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load summary");
      return res.json();
    },
  });

  const pauseLocation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const res = await apiRequest("PATCH", `/api/${type}/${id}/pause`);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Location paused" });
    },
    onError: () => toast({ title: "Failed to pause", variant: "destructive" }),
  });

  const resumeLocation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const res = await apiRequest("PATCH", `/api/${type}/${id}/resume`);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Location resumed" });
    },
    onError: () => toast({ title: "Failed to resume", variant: "destructive" }),
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number; name: string } | null>(null);

  const hardDelete = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const res = await apiRequest("DELETE", `/api/${type}/${id}/permanent`);
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setDeleteConfirm(null);
      if (view === "estates") {
      } else if (view === "lgas") {
      } else {
      }
      toast({ title: "Location permanently deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/states"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/states", selectedStateId, "lgas"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/lgas", selectedLgaId, "estates"] });
    queryClient.invalidateQueries({ queryKey: ["/api/states"] });
    queryClient.invalidateQueries({ queryKey: ["/api/states", selectedStateId, "summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/lgas", selectedLgaId, "summary"] });
  }

  const [newStateName, setNewStateName] = useState("");
  const [newLgaName, setNewLgaName] = useState("");
  const [newLgaWhatsapp, setNewLgaWhatsapp] = useState("");
  const [newEstateName, setNewEstateName] = useState("");
  const [newEstateAbbr, setNewEstateAbbr] = useState("");

  const createState = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/states", { name: newStateName });
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "State created" });
      setNewStateName("");
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const createLga = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/lgas", {
        stateId: selectedStateId, name: newLgaName, whatsappLink: newLgaWhatsapp || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "LGA created" });
      setNewLgaName("");
      setNewLgaWhatsapp("");
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  const createEstate = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/estates", {
        lgaId: selectedLgaId, name: newEstateName, abbreviation: newEstateAbbr.toUpperCase(),
      });
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Estate created" });
      setNewEstateName("");
      setNewEstateAbbr("");
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold">Permanently Delete?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              This will permanently delete <strong>{deleteConfirm.name}</strong> and all child locations.
            </p>
            <p className="text-sm text-red-600 mb-4">
              Affected users will be unlinked and blocked. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-cancel-hard-delete">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => hardDelete.mutate({ type: deleteConfirm.type, id: deleteConfirm.id })}
                disabled={hardDelete.isPending}
                data-testid="button-confirm-hard-delete"
              >
                {hardDelete.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Forever"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {view === "states" && (
        <>
          <div className="bg-white rounded-xl border border-border/50 p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" /> States
            </h2>
            <div className="flex gap-2 mb-4">
              <Input
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                placeholder="New state name"
                data-testid="input-new-state"
              />
              <Button onClick={() => createState.mutate()} disabled={!newStateName || createState.isPending} data-testid="button-create-state">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {(Array.isArray(adminStates) ? adminStates : []).map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-3 px-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  data-testid={`row-state-${s.id}`}
                >
                  <div
                    className="flex-1 flex items-center gap-2"
                    onClick={() => {
                      setSelectedStateId(s.id);
                      setSelectedStateName(s.name);
                      setView("lgas");
                    }}
                  >
                    <span className="font-medium">{s.name}</span>
                    <Badge variant={s.isActive !== false ? "default" : "destructive"} className="text-xs">
                      {s.isActive !== false ? "Active" : "Paused"}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {s.isActive !== false ? (
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); pauseLocation.mutate({ type: "states", id: s.id }); }}
                        data-testid={`button-pause-state-${s.id}`}
                      >
                        <Pause className="w-4 h-4 text-orange-500" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); resumeLocation.mutate({ type: "states", id: s.id }); }}
                        data-testid={`button-resume-state-${s.id}`}
                      >
                        <Play className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: "states", id: s.id, name: s.name }); }}
                      data-testid={`button-delete-state-${s.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!adminStates || adminStates.length === 0) && (
                <p className="text-muted-foreground text-center py-6">No states yet. Add one above.</p>
              )}
            </div>
          </div>
        </>
      )}

      {view === "lgas" && selectedStateId && (
        <>
          <Button variant="ghost" onClick={() => { setView("states"); setSelectedStateId(null); }} data-testid="button-back-states">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to States
          </Button>

          {stateSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">{stateSummary.lgaCount}</p>
                <p className="text-xs text-muted-foreground">LGAs</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">{stateSummary.vendors}</p>
                <p className="text-xs text-muted-foreground">Vendors</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">{stateSummary.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">₦{(stateSummary.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-border/50 p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" /> LGAs in {selectedStateName}
            </h2>
            <div className="space-y-3 mb-4">
              <Input value={newLgaName} onChange={(e) => setNewLgaName(e.target.value)} placeholder="New LGA name" data-testid="input-new-lga" />
              <Input value={newLgaWhatsapp} onChange={(e) => setNewLgaWhatsapp(e.target.value)} placeholder="WhatsApp link (optional)" data-testid="input-lga-whatsapp" />
              <Button onClick={() => createLga.mutate()} disabled={!newLgaName || createLga.isPending} data-testid="button-create-lga">
                <Plus className="w-4 h-4 mr-1" /> Add LGA
              </Button>
            </div>
            <div className="space-y-2">
              {(Array.isArray(adminLgas) ? adminLgas : []).map(l => (
                <div
                  key={l.id}
                  className="flex items-center justify-between py-3 px-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  data-testid={`row-lga-${l.id}`}
                >
                  <div
                    className="flex-1 flex items-center gap-2"
                    onClick={() => {
                      setSelectedLgaId(l.id);
                      setSelectedLgaName(l.name);
                      setView("estates");
                    }}
                  >
                    <span className="font-medium">{l.name}</span>
                    <Badge variant={l.isActive !== false ? "default" : "destructive"} className="text-xs">
                      {l.isActive !== false ? "Active" : "Paused"}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {l.isActive !== false ? (
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); pauseLocation.mutate({ type: "lgas", id: l.id }); }}
                        data-testid={`button-pause-lga-${l.id}`}
                      >
                        <Pause className="w-4 h-4 text-orange-500" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); resumeLocation.mutate({ type: "lgas", id: l.id }); }}
                        data-testid={`button-resume-lga-${l.id}`}
                      >
                        <Play className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: "lgas", id: l.id, name: l.name }); }}
                      data-testid={`button-delete-lga-${l.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!adminLgas || adminLgas.length === 0) && (
                <p className="text-muted-foreground text-center py-6">No LGAs yet. Add one above.</p>
              )}
            </div>
          </div>
        </>
      )}

      {view === "estates" && selectedLgaId && (
        <>
          <Button variant="ghost" onClick={() => { setView("lgas"); setSelectedLgaId(null); }} data-testid="button-back-lgas">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to LGAs
          </Button>

          {lgaSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">{lgaSummary.estateCount}</p>
                <p className="text-xs text-muted-foreground">Estates</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">{lgaSummary.vendors}</p>
                <p className="text-xs text-muted-foreground">Vendors</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">{lgaSummary.customers}</p>
                <p className="text-xs text-muted-foreground">Customers</p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xl font-bold">₦{(lgaSummary.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-border/50 p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Estates in {selectedLgaName}
            </h2>
            <div className="space-y-3 mb-4">
              <Input value={newEstateName} onChange={(e) => setNewEstateName(e.target.value)} placeholder="New estate name" data-testid="input-new-estate" />
              <Input value={newEstateAbbr} onChange={(e) => setNewEstateAbbr(e.target.value)} placeholder="Abbreviation (e.g. HAW)" maxLength={5} data-testid="input-estate-abbr" />
              <Button onClick={() => createEstate.mutate()} disabled={!newEstateName || !newEstateAbbr || createEstate.isPending} data-testid="button-create-estate">
                <Plus className="w-4 h-4 mr-1" /> Add Estate
              </Button>
            </div>
            <div className="space-y-2">
              {(Array.isArray(adminEstates) ? adminEstates : []).map(e => (
                <div key={e.id} className="flex items-center justify-between py-3 px-3 border rounded-lg" data-testid={`row-estate-${e.id}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{e.name}</span>
                    <Badge variant="outline" className="text-xs">{e.abbreviation}</Badge>
                    <Badge variant={e.isActive !== false ? "default" : "destructive"} className="text-xs">
                      {e.isActive !== false ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {e.isActive !== false ? (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => pauseLocation.mutate({ type: "estates", id: e.id })}
                        data-testid={`button-pause-estate-${e.id}`}
                      >
                        <Pause className="w-4 h-4 text-orange-500" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => resumeLocation.mutate({ type: "estates", id: e.id })}
                        data-testid={`button-resume-estate-${e.id}`}
                      >
                        <Play className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setDeleteConfirm({ type: "estates", id: e.id, name: e.name })}
                      data-testid={`button-delete-estate-${e.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!adminEstates || adminEstates.length === 0) && (
                <p className="text-muted-foreground text-center py-6">No estates yet. Add one above.</p>
              )}
            </div>
          </div>
        </>
      )}
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
