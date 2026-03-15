import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireApproval?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireApproval = false,
}) => {
  // IMPORTANT: role comes from user_roles table via AuthContext, NOT from profile
  const { user, userProfile, role, loading } = useAuth();

  // Block rendering until auth resolves
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // No session - redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Still loading profile after auth
  if (!userProfile || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Check approval status for vendors and staff BEFORE anything else
  // Role source = user_roles table (via AuthContext)
  // Approval source = profiles.approved
  if (
    (role === 'vendor' || role === 'staff') &&
    !userProfile.approved
  ) {
    return <Navigate to="/auth/pending-approval" replace />;
  }

  // If route requires approval (for any role that needs it)
  if (requireApproval && !userProfile.approved) {
    return <Navigate to="/auth/pending-approval" replace />;
  }

  // Check if user has required role (using role from user_roles table)
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    switch (role) {
      case 'customer':
        return <Navigate to="/customer/orders" replace />;
      case 'vendor':
        return <Navigate to="/vendor/dashboard" replace />;
      case 'staff':
        return <Navigate to="/staff/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'superadmin':
        return <Navigate to="/superadmin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
