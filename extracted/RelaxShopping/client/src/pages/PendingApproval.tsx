import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function PendingApproval() {
  const { user, signOut, refreshProfile } = useAuth();
  const [, navigate] = useLocation();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (user?.approved) {
      switch (user.role) {
        case "vendor":
          navigate("/vendor-dashboard");
          break;
        case "staff":
          navigate("/staff-dashboard");
          break;
        default:
          navigate("/");
      }
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-background px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2" data-testid="text-pending-title">Account Pending Approval</h1>
        <p className="text-muted-foreground mb-6">
          Your {user?.role} account is being reviewed by an admin. You'll be able to access your dashboard once approved.
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={handleCheckStatus} disabled={checking} data-testid="button-check-status">
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
            Check Approval Status
          </Button>
          <Button variant="outline" onClick={handleSignOut} data-testid="button-sign-out">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
