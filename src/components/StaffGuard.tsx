import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./AuthProvider";
import { canAccessStaffPortal, getUnauthorizedStaffRedirect } from "@/lib/role-routing";

export function StaffGuard({
  children,
  allowedRoles = ["staff", "admin"],
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate({ to: "/admin/login" });
      } else if (!role || !allowedRoles.includes(role) || !canAccessStaffPortal(role)) {
        navigate({ to: getUnauthorizedStaffRedirect(role) });
      }
    }
  }, [user, role, loading, navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Checking staff access...</p>
        </div>
      </div>
    );
  }

  if (!user || !role || !allowedRoles.includes(role) || !canAccessStaffPortal(role)) {
    return null;
  }

  return <>{children}</>;
}
