import { useSearch } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Copy, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Success() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderCode = params.get("code") || "CHAN-XXXXX";
  const { toast } = useToast();

  const copyCode = () => {
    navigator.clipboard.writeText(orderCode);
    toast({ title: "Code copied!", duration: 1000 });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="container max-w-lg mx-auto px-4 py-20 text-center">
        <div className="mb-8 relative inline-block">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
            <span className="text-[10px] text-white font-bold">✓</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">Order Successful!</h1>
        <p className="text-muted-foreground mb-10">
          Your payment has been received. Your groceries will be delivered in the next available batch.
        </p>

        <Card className="border-none shadow-md mb-10 bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-primary/5 py-3 border-b border-primary/10">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Your Pickup Code</span>
            </div>
            <div className="p-8">
              <div className="text-4xl font-mono font-bold text-slate-800 tracking-tighter mb-4">
                {orderCode}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5"
                onClick={copyCode}
              >
                <Copy className="w-4 h-4" /> Copy Code
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Link href="/">
            <Button className="w-full rounded-full h-12 gap-2">
              <ShoppingBag className="w-5 h-5" /> Back to Marketplace
            </Button>
          </Link>
          <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-primary">
            View Order Receipt <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
