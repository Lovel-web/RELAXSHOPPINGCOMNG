import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, Users, LogIn } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.15),transparent_60%),radial-gradient(ellipse_at_bottom_left,hsl(var(--accent)/0.1),transparent_60%)]" />

        <div className="relative z-10 flex flex-col items-center gap-8 px-4 py-16 text-center max-w-2xl mx-auto animate-enter">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-10 w-10 text-primary" data-testid="icon-logo" />
            <h1 className="text-4xl sm:text-5xl font-extrabold" data-testid="text-brand">
              Relax<span className="text-primary">Shopping</span>
            </h1>
          </div>

          <p className="text-xl sm:text-2xl text-muted-foreground max-w-md" data-testid="text-tagline">
            Shop Smarter In Your Estate.
          </p>

          <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
            <Link href="/join">
              <Button className="w-full gap-2" size="lg" data-testid="link-join">
                <Users className="h-4 w-4" />
                Join
              </Button>
            </Link>

            <Link href="/vendor-signup">
              <Button className="w-full gap-2" variant="outline" size="lg" data-testid="link-vendor-signup">
                <Store className="h-4 w-4" />
                Vendor
              </Button>
            </Link>

            <Link href="/staff-signup">
              <Button className="w-full gap-2" variant="outline" size="lg" data-testid="link-staff-signup">
                <ShoppingBag className="h-4 w-4" />
                Staff
              </Button>
            </Link>

            <Link href="/login">
              <Button className="w-full gap-2" variant="secondary" size="lg" data-testid="link-login">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
