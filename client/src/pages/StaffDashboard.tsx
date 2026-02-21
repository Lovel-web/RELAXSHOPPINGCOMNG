import { Navigation } from "@/components/Navigation";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Package, Truck, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StaffDashboard() {
  const { data: orders, isLoading } = useOrders('1'); // Mock Staff ID
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: "Updated", description: `Order marked as ${status}` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  const statusColors: Record<string, string> = {
    pending_payment: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    picked: "bg-purple-100 text-purple-800",
    out_for_delivery: "bg-orange-100 text-orange-800",
    delivered: "bg-green-100 text-green-800"
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation />
      
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold">Logistics Hub</h1>
          <p className="text-muted-foreground">Manage your assigned deliveries</p>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid gap-6">
            {orders?.map((order: any) => (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-border/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold font-mono text-primary">{order.orderCode}</h3>
                    <p className="text-sm text-muted-foreground">Placed {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge className={`px-3 py-1 rounded-full border-none ${statusColors[order.status] || 'bg-gray-100'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>Estate ID: #{order.estateId}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>Customer ID: #{order.customerId}</span>
                     </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm font-semibold mb-2 text-muted-foreground">Order Items</p>
                    <p className="font-medium text-gray-900">
                      {order.totalAmount} NGN Total Value
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusUpdate(order.id, 'picked')}
                    disabled={order.status !== 'paid'}
                    className="gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Confirm Pickup
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}
                    disabled={order.status !== 'picked'}
                    className="gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Start Delivery
                  </Button>
                  
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleStatusUpdate(order.id, 'delivered')}
                    disabled={order.status !== 'out_for_delivery'}
                    className="gap-2 ml-auto"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Delivered
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
