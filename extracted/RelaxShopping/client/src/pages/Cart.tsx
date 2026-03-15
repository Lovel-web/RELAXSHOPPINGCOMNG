import { Navigation } from "@/components/Navigation";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Cart() {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const total = useCart((s) => s.total);
  const [, navigate] = useLocation();

  const deliveryFee = 400;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold" data-testid="text-cart-title">Your Cart</h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold mb-2">Cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some items from the marketplace</p>
            <Link href="/">
              <Button data-testid="button-shop-now">Shop Now</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-white rounded-xl border border-border/50 p-4"
                  data-testid={`card-cart-item-${item.id}`}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingCart className="w-6 h-6 opacity-30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-primary font-bold">
                      ₦{item.price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      data-testid={`button-decrease-${item.id}`}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-semibold" data-testid={`text-qty-${item.id}`}>
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      data-testid={`button-increase-${item.id}`}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-destructive"
                      onClick={() => removeItem(item.id)}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-border/50 p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium" data-testid="text-subtotal">₦{total().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="font-medium">₦{deliveryFee.toLocaleString()}</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary" data-testid="text-total">
                  ₦{(total() + deliveryFee).toLocaleString()}
                </span>
              </div>

              <Button
                className="w-full mt-4 h-12 text-base font-semibold"
                onClick={() => navigate("/checkout")}
                data-testid="button-checkout"
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
