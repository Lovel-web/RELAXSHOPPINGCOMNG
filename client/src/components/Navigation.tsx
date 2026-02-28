import { Link, useLocation } from "wouter";
import { ShoppingCart, Home, User, Settings, Truck, LogIn, LogOut } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [location, navigate] = useLocation();
  const cartItems = useCart((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Link href={href}>
      <div className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
        location === href 
          ? "text-primary font-bold" 
          : "text-muted-foreground hover:text-foreground"
      }`} data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}>
        <Icon className="w-6 h-6" />
        <span className="text-xs">{label}</span>
      </div>
    </Link>
  );

  const dashboardLink = user ? (
    user.role === "admin" ? { href: "/admin-dashboard", label: "Admin" } :
    user.role === "vendor" ? { href: "/vendor-dashboard", label: "Vendor" } :
    user.role === "staff" ? { href: "/staff-dashboard", label: "Staff" } :
    null
  ) : null;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md hidden md:block">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-display font-bold text-primary" data-testid="text-logo">RelaxShopping</span>
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/"><span className="text-sm font-medium hover:text-primary cursor-pointer" data-testid="link-marketplace">Marketplace</span></Link>
            {dashboardLink && (
              <Link href={dashboardLink.href}>
                <span className="text-sm font-medium hover:text-primary cursor-pointer" data-testid={`link-${dashboardLink.label.toLowerCase()}`}>
                  {dashboardLink.label} Dashboard
                </span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/cart">
              <Button variant="ghost" className="relative" data-testid="button-cart-desktop">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden lg:block" data-testid="text-user-name">{user.name}</span>
                <Button variant="ghost" size="icon" onClick={handleSignOut} data-testid="button-sign-out-desktop">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" data-testid="button-login-desktop">
                  <LogIn className="w-4 h-4 mr-2" /> Log In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

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
            <Button size="icon" variant="ghost" className="relative" data-testid="button-cart-mobile">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </Button>
          </Link>

          {user ? (
            <Button size="icon" variant="ghost" onClick={handleSignOut} data-testid="button-sign-out-mobile">
              <LogOut className="w-5 h-5" />
            </Button>
          ) : (
            <Link href="/login">
              <Button size="icon" variant="ghost" data-testid="button-login-mobile">
                <LogIn className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 md:hidden pb-safe">
        <div className="flex justify-around items-center h-16">
          <NavLink href="/" icon={Home} label="Shop" />
          <NavLink href="/cart" icon={ShoppingCart} label={`Cart (${cartCount})`} />
          {dashboardLink ? (
            dashboardLink.label === "Vendor" ? <NavLink href={dashboardLink.href} icon={User} label="Vendor" /> :
            dashboardLink.label === "Staff" ? <NavLink href={dashboardLink.href} icon={Truck} label="Staff" /> :
            dashboardLink.label === "Admin" ? <NavLink href={dashboardLink.href} icon={Settings} label="Admin" /> :
            <NavLink href="/login" icon={LogIn} label="Login" />
          ) : (
            <NavLink href="/login" icon={LogIn} label="Login" />
          )}
        </div>
      </nav>
      
      <div className="h-16 md:hidden" />
    </>
  );
}
