import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, Home, User, Settings } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const [location] = useLocation();
  const cartItems = useCart((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Link href={href}>
      <div className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
        location === href 
          ? "text-primary font-bold" 
          : "text-muted-foreground hover:text-foreground"
      }`}>
        <Icon className="w-6 h-6" />
        <span className="text-xs">{label}</span>
      </div>
    </Link>
  );

  return (
    <>
      {/* Top Bar for Desktop */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md hidden md:block">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-display font-bold text-primary">RelaxShopping</span>
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/"><span className="text-sm font-medium hover:text-primary cursor-pointer">Marketplace</span></Link>
            <Link href="/vendor"><span className="text-sm font-medium hover:text-primary cursor-pointer">Vendor</span></Link>
            <Link href="/staff"><span className="text-sm font-medium hover:text-primary cursor-pointer">Staff</span></Link>
            <Link href="/admin"><span className="text-sm font-medium hover:text-primary cursor-pointer">Admin</span></Link>
          </nav>

          <Link href="/cart">
            <Button variant="ghost" className="relative">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm md:hidden px-4 h-14 flex items-center justify-between">
         <Link href="/">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-lg font-display font-bold text-primary">RelaxShopping</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link href="/cart">
              <Button size="icon" variant="ghost" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
              </Button>
            </Link>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-medium">Marketplace</Link>
                  <Link href="/vendor" className="text-lg font-medium">Vendor Dashboard</Link>
                  <Link href="/staff" className="text-lg font-medium">Staff Dashboard</Link>
                  <Link href="/admin" className="text-lg font-medium">Admin Dashboard</Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden pb-safe">
        <div className="flex justify-around items-center h-16">
          <NavLink href="/" icon={Home} label="Shop" />
          <NavLink href="/vendor" icon={User} label="Vendor" />
          <NavLink href="/cart" icon={ShoppingCart} label={`Cart (${cartCount})`} />
          <NavLink href="/admin" icon={Settings} label="Admin" />
        </div>
      </nav>
      
      {/* Padding for bottom nav on mobile */}
      <div className="h-16 md:hidden" />
    </>
  );
}
