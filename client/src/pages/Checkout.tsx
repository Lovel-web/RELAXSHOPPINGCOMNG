import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useEstates } from "@/hooks/use-locations";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [estateId, setEstateId] = useState<number>();

  // Use a default LGA for demo (usually passed from home via state or URL)
  const defaultLgaId = 1; 
  const { data: estates } = useEstates(defaultLgaId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estateId) {
      toast({ title: "Please select your estate", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/orders", {
        customer: {
          name,
          phone,
          stateId: 1, // Lagos
          lgaId: defaultLgaId,
        },
        estateId,
        items: items.map(i => ({
          productId: i.id,
          quantity: i.quantity,
          price: i.price,
        }))
      });
      
      const order = await res.json();
      
      // Simulate Paystack Payment
      toast({ title: "Payment Successful", description: "Redirecting to success page..." });
      
      setTimeout(() => {
        clearCart();
        setLocation(`/success?code=${order.orderCode}`);
      }, 1500);
      
    } catch (err) {
      toast({ title: "Order failed", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    setLocation("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      required 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08012345678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select Estate</Label>
                    <Select onValueChange={(v) => setEstateId(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Which estate do you live in?" />
                      </SelectTrigger>
                      <SelectContent>
                        {estates?.map((e: any) => (
                          <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">LGA: IKEJA (Fixed Delivery ₦400)</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-green-50 shadow-sm border-l-4 border-l-primary">
                <CardContent className="p-4 flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-green-800">
                    Your payment is secure. We use Paystack for all transactions.
                  </p>
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg rounded-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay ₦{(total() + 400).toLocaleString()}
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>
            <Card className="border-none shadow-sm sticky top-24">
              <CardContent className="p-6">
                <div className="space-y-4 mb-6">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                      <span className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <Separator className="mb-4" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">₦{total().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-semibold">₦400</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-primary pt-2">
                    <span>Total</span>
                    <span>₦{(total() + 400).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
