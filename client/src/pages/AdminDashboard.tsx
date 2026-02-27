import { Navigation } from "@/components/Navigation";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Users, Package, ShoppingCart, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import { type Order, type Product } from "@shared/schema";

export default function AdminDashboard() {
  const { data: orders } = useOrders();
  const { data: products } = useProducts();
  const [tab, setTab] = useState<"overview" | "orders" | "products">("overview");

  const allOrders = (orders as Order[]) || [];
  const allProducts = (products as Product[]) || [];

  const paidOrders = allOrders.filter((o) => o.status === "paid" || o.status === "ready_for_delivery" || o.status === "delivered");
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const pendingOrders = allOrders.filter((o) => o.status === "pending_payment");
  const deliveredOrders = allOrders.filter((o) => o.status === "delivered");

  const stats = [
    { label: "Total Orders", value: allOrders.length, icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
    { label: "Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
    { label: "Products Listed", value: allProducts.length, icon: Package, color: "text-purple-600 bg-purple-50" },
    { label: "Delivered", value: deliveredOrders.length, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" data-testid="text-admin-title">Admin Dashboard</h1>

        <div className="flex gap-2 mb-6">
          <Button variant={tab === "overview" ? "default" : "outline"} onClick={() => setTab("overview")} data-testid="button-tab-overview">
            Overview
          </Button>
          <Button variant={tab === "orders" ? "default" : "outline"} onClick={() => setTab("orders")} data-testid="button-tab-orders">
            All Orders
          </Button>
          <Button variant={tab === "products" ? "default" : "outline"} onClick={() => setTab("products")} data-testid="button-tab-products">
            All Products
          </Button>
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
                  <Badge variant={
                    order.status === "delivered" ? "default" :
                    order.status === "paid" ? "secondary" : "outline"
                  }>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
              {allOrders.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              )}
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
                    <p className="text-sm text-muted-foreground">
                      ₦{order.totalAmount.toLocaleString()} &middot; Delivery: ₦{order.deliveryFee.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.vendorPaid && <Badge className="bg-green-100 text-green-800">Vendor Paid</Badge>}
                    <Badge variant={
                      order.status === "delivered" ? "default" :
                      order.status === "ready_for_delivery" ? "secondary" :
                      order.status === "paid" ? "outline" : "destructive"
                    }>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              ))}
              {allOrders.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              )}
            </div>
          </div>
        )}

        {tab === "products" && (
          <div className="bg-white rounded-xl border border-border/50 p-6">
            <h2 className="font-semibold text-lg mb-4">All Products ({allProducts.length})</h2>
            <div className="space-y-3">
              {allProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`row-admin-product-${p.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 opacity-20" /></div>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">{p.name}</span>
                      <p className="text-sm text-muted-foreground">{p.category} &middot; Stock: {p.stock}</p>
                    </div>
                  </div>
                  <span className="font-bold text-primary">₦{p.price.toLocaleString()}</span>
                </div>
              ))}
              {allProducts.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No products yet</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
