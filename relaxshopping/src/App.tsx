import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Header } from "./components/Header";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Shops from "./pages/Shops";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import PendingApproval from "./pages/auth/PendingApproval";
import CustomerProfile from "./pages/customer/Profile";
import CustomerOrders from "./pages/customer/Orders";
import VendorDashboard from "./pages/vendor/Dashboard";
import VendorProfile from "./pages/vendor/Profile";
import StaffDashboard from "./pages/staff/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminApprovals from "./pages/admin/Approvals";
import PayoutApproval from "./pages/admin/PayoutApproval";
import SuperadminDashboard from "./pages/superadmin/Dashboard";
import NotFound from "./pages/NotFound";

const App = () => {
  const location = useLocation();
  const { loading } = useAuth();

  // PROTOTYPE BYPASS: Force render Home for visibility
  // To restore auth logic, uncomment the loading block below.
  /*
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }
  */

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Header />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/shops" element={<Shops />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
              
              {/* Auth Routes */}
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/pending-approval" element={<PendingApproval />} />
              
              {/* Customer Routes */}
              <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfile /></ProtectedRoute>} />
              <Route path="/customer/orders" element={<ProtectedRoute allowedRoles={['customer']}><CustomerOrders /></ProtectedRoute>} />
              
              {/* Vendor Routes */}
              <Route path="/vendor/dashboard" element={<ProtectedRoute allowedRoles={['vendor']} requireApproval><VendorDashboard /></ProtectedRoute>} />
              <Route path="/vendor/profile" element={<ProtectedRoute allowedRoles={['vendor']} requireApproval><VendorProfile /></ProtectedRoute>} />
              
              {/* Staff Routes */}
              <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={['staff']} requireApproval><StaffDashboard /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminApprovals /></ProtectedRoute>} />
              <Route path="/admin/payouts" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><PayoutApproval /></ProtectedRoute>} />
              
              {/* Superadmin Routes */}
              <Route path="/superadmin/dashboard" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperadminDashboard /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </TooltipProvider>
  );
};

export default App;
