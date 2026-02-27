import { Navigation } from "@/components/Navigation";
import { useCart } from "@/hooks/use-cart";
import { useStates, useLgas, useEstates } from "@/hooks/use-locations";
import { useCreateOrder } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import type { State, Lga, Estate } from "@shared/schema";

export default function Checkout() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total);
  const clearCart = useCart((s) => s.clearCart);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const createOrder = useCreateOrder();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [stateId, setStateId] = useState<number | undefined>();
  const [lgaId, setLgaId] = useState<number | undefined>();
  const [estateId, setEstateId] = useState<number | undefined>();

  const { data: statesData } = useStates();
  const { data: lgasData } = useLgas(stateId);
  const { data: estatesData } = useEstates(lgaId);

  const deliveryFee = 400;

  const handlePayment = () => {
    if (!name || !phone || !stateId || !lgaId || !estateId) {
      toast({ title: "Missing fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    createOrder.mutate(
      {
        customer: {
          name,
          phone,
          role: "customer",
          stateId,
          lgaId,
          approved: true,
        },
        estateId,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      },
      {
        onSuccess: (order: any) => {
          clearCart();
          navigate(`/success?code=${order.orderCode}`);
        },
        onError: () => {
          toast({ title: "Order failed", description: "Something went wrong. Try again.", variant: "destructive" });
        },
      }
    );
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container max-w-lg mx-auto px-4 py-20 text-center">
          <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
          <Link href="/">
            <Button data-testid="button-go-shop">Go Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/cart">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold" data-testid="text-checkout-title">Checkout</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
            <h2 className="font-semibold text-lg">Your Details</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                data-testid="input-name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                data-testid="input-phone"
                placeholder="08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
            <h2 className="font-semibold text-lg">Delivery Location</h2>

            <div className="space-y-2">
              <Label>State</Label>
              <Select
                value={stateId?.toString()}
                onValueChange={(v) => { setStateId(Number(v)); setLgaId(undefined); setEstateId(undefined); }}
              >
                <SelectTrigger data-testid="select-state">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {(statesData as State[] || []).map((s: State) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>LGA</Label>
              <Select
                value={lgaId?.toString()}
                onValueChange={(v) => { setLgaId(Number(v)); setEstateId(undefined); }}
                disabled={!stateId}
              >
                <SelectTrigger data-testid="select-lga">
                  <SelectValue placeholder="Select LGA" />
                </SelectTrigger>
                <SelectContent>
                  {(lgasData as Lga[] || []).map((l: Lga) => (
                    <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estate</Label>
              <Select
                value={estateId?.toString()}
                onValueChange={(v) => setEstateId(Number(v))}
                disabled={!lgaId}
              >
                <SelectTrigger data-testid="select-estate">
                  <SelectValue placeholder="Select your estate" />
                </SelectTrigger>
                <SelectContent>
                  {(estatesData as Estate[] || []).map((e: Estate) => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border/50 p-6 space-y-3">
            <h2 className="font-semibold text-lg">Order Summary</h2>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <hr />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₦{total().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span>₦{deliveryFee.toLocaleString()}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary" data-testid="text-checkout-total">
                ₦{(total() + deliveryFee).toLocaleString()}
              </span>
            </div>
          </div>

          <Button
            className="w-full h-14 text-base font-semibold"
            onClick={handlePayment}
            disabled={createOrder.isPending}
            data-testid="button-pay"
          >
            {createOrder.isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><ShieldCheck className="w-5 h-5 mr-2" /> Pay ₦{(total() + deliveryFee).toLocaleString()}</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Payment is simulated for this demo
          </p>
        </div>
      </main>
    </div>
  );
}
