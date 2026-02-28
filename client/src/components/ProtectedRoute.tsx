import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
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

  return <>{children}</>;
}
