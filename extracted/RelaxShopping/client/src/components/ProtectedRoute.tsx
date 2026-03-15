import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, PauseCircle } from "lucide-react";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if ((user.role === "vendor" || user.role === "staff") && !user.approved) {
      navigate("/pending-approval");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      switch (user.role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "vendor":
          navigate("/vendor-dashboard");
          break;
        case "staff":
          navigate("/staff-dashboard");
          break;
        default:
          navigate("/");
          break;
      }
    }
  }, [user, loading, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if ((user.role === "vendor" || user.role === "staff") && !user.approved) return null;

  if (!allowedRoles.includes(user.role)) return null;

  if ((user as any).locationPaused && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-md mx-auto text-center px-6 py-12">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
            <PauseCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3" data-testid="text-location-paused">Your area is currently on hold</h1>
          <p className="text-muted-foreground mb-6" data-testid="text-location-paused-desc">
            Shopping and deliveries are temporarily paused in your location. We'll be back soon — please check again later.
          </p>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, contact support via your estate's WhatsApp group.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
