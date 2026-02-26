import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Success from "@/pages/Success";
import VendorDashboard from "@/pages/VendorDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

// Temporary role check until auth is fully implemented
const useUser = () => ({ data: { role: 'customer', approved: true } });

function Router() {
  const { data: user } = useUser();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Home} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/success" component={Success} />
      
      <Route path="/vendor-dashboard">
        {() => user?.role === 'vendor' && user?.approved ? <VendorDashboard /> : <Redirect to="/" />}
      </Route>
      
      <Route path="/staff-dashboard">
        {() => user?.role === 'staff' && user?.approved ? <StaffDashboard /> : <Redirect to="/" />}
      </Route>
      
      <Route path="/admin-dashboard">
        {() => user?.role === 'admin' ? <AdminDashboard /> : <Redirect to="/" />}
      </Route>

      <Route path="/pending-approval">
        <div className="flex items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold">Your account is pending approval</h1>
        </div>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
