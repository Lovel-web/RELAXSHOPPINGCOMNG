import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Success from "@/pages/Success";
import Auth from "@/pages/Auth";
import PendingApproval from "@/pages/PendingApproval";
import VendorDashboard from "@/pages/VendorDashboard";
import StaffDashboard from "@/pages/StaffDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import PaymentCallback from "@/pages/PaymentCallback";
import Receipt from "@/pages/Receipt";
import VendorSignup from "@/pages/VendorSignup";
import StaffSignup from "@/pages/StaffSignup";
import Landing from "@/pages/Landing";
import JoinCustomer from "@/pages/JoinCustomer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/join" component={JoinCustomer} />
      <Route path="/shop" component={Home} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/success" component={Success} />
      <Route path="/payment/callback" component={PaymentCallback} />
      <Route path="/receipt/:id" component={Receipt} />
      <Route path="/login" component={Auth} />
      <Route path="/vendor-signup" component={VendorSignup} />
      <Route path="/staff-signup" component={StaffSignup} />
      <Route path="/pending-approval" component={PendingApproval} />
      <Route path="/vendor-dashboard">
        <ProtectedRoute allowedRoles={["vendor"]}>
          <VendorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/staff-dashboard">
        <ProtectedRoute allowedRoles={["staff"]}>
          <StaffDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin-dashboard">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
