import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { useStates, useLgas, useEstates } from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import { type InsertUser } from "@shared/schema";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [selectedEstate, setSelectedEstate] = useState("");

  // Location Data
  const { data: states } = useStates();
  const { data: lgas } = useLgas(selectedState ? parseInt(selectedState) : undefined);
  const { data: estates } = useEstates(selectedLga ? parseInt(selectedLga) : undefined);

  const deliveryFee = 400;
  const grandTotal = total() + deliveryFee;

  const handleCheckout = async () => {
    if (!name || !phone || !selectedEstate) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all details to proceed."
      });
      return;
    }

    try {
      // 1. Prepare User Data
      const customer: InsertUser = {
        name,
        phone,
        role: 'customer',
        stateId: parseInt(selectedState),
        lgaId: parseInt(selectedLga),
        approved: true
      };

      // 2. Create Order via API
      await createOrder.mutateAsync({
        customer,
        estateId: parseInt(selectedEstate),
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      });

      // 3. Clear Cart & Redirect
      clearCart();
      setLocation("/success");
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: "Something went wrong. Please try again."
      });
    }
  };

  if (items.length === 0) {
    setLocation("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navigation />
      
      <main className="container max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-display font-bold mb-6 text-center">Complete Your Order</h1>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-border/50 space-y-6">
          <div className="space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</span>
              Contact Info
            </h2>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                placeholder="08012345678" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-gray-50 border-gray-200 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">2</span>
              Delivery Location
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full bg-gray-50 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states?.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedLga} 
                onValueChange={setSelectedLga}
                disabled={!selectedState}
              >
                <SelectTrigger className="w-full bg-gray-50 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent>
                  {lgas?.map((l: any) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedEstate} 
                onValueChange={setSelectedEstate}
                disabled={!selectedLga}
              >
                <SelectTrigger className="w-full bg-gray-50 border-gray-200 rounded-xl">
                  <SelectValue placeholder="Select Estate" />
                </SelectTrigger>
                <SelectContent>
                  {estates?.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between font-bold text-lg">
              <span>Total to Pay</span>
              <span className="text-primary">₦{grandTotal.toLocaleString()}</span>
            </div>

            <Button 
              className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-green-500/20 bg-[#25D366] hover:bg-[#20bd5a] hover:scale-[1.02] transition-all"
              onClick={handleCheckout}
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Pay Now with Paystack
                </div>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Secured by Paystack
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
