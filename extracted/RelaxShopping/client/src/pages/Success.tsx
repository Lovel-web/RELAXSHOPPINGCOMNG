import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Success() {
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const orderCode = params.get("code") || "N/A";

  const copyCode = () => {
    navigator.clipboard.writeText(orderCode);
    toast({ title: "Copied!", description: "Order code copied to clipboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-lg mx-auto px-4 py-16 text-center">
        <div className="animate-enter">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold mb-2" data-testid="text-success-title">
            Order Placed!
          </h1>
          <p className="text-muted-foreground mb-8">
            Your order has been confirmed and will be delivered to your estate.
          </p>

          <div className="bg-white rounded-xl border border-border/50 p-6 mb-6">
            <p className="text-sm text-muted-foreground mb-2">Your Order Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold text-primary tracking-wider" data-testid="text-order-code">
                {orderCode}
              </span>
              <Button variant="ghost" size="icon" onClick={copyCode} data-testid="button-copy-code">
                <Copy className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Share this code with the delivery staff upon arrival
            </p>
          </div>

          <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 mb-8 text-left">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm" data-testid="text-whatsapp-notice">Wait for delivery updates in your WhatsApp group.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your estate's WhatsApp group will have live updates on batch deliveries.
                </p>
              </div>
            </div>
          </div>

          <Link href="/shop">
            <Button className="h-12 px-8" data-testid="button-continue-shopping">
              <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
