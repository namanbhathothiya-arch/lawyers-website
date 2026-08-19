import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Stethoscope } from "lucide-react";
import { getPostLoginPath } from "@/lib/role-routing";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — [FIRM NAME]" },
      { name: "description", content: "Sign in to the [FIRM NAME] admin panel." },
    ],
  }),
  component: AdminLoginPage,
});

type PortalAccess = {
  role: string;
};

function getAuthErrorMessage(error: unknown) {
  const authError = error as { code?: string; message?: string };

  if (
    authError.code === "invalid_credentials" ||
    authError.code === "invalid_grant" ||
    authError.message?.toLowerCase().includes("invalid login credentials")
  ) {
    return "Invalid credentials";
  }

  return authError.message || "Unable to sign in.";
}

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  async function fetchPortalAccess(userId: string): Promise<PortalAccess> {
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (roleError || !roleData?.role) {
      throw new Error("Access denied: no portal role was found for this account.");
    }

    return {
      role: roleData.role as string,
    };
  }

  useEffect(() => {
    if (loading) return;

    if (user && role === "staff") {
      navigate({ to: getPostLoginPath(role) });
      return;
    }

    if (user && role === "admin") {
      navigate({ to: getPostLoginPath(role) });
    }
  }, [user, role, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!session?.user) throw new Error("Unable to create a session for this account.");

      const portalAccess = await fetchPortalAccess(session.user.id);
      const resolvedRole = portalAccess.role;

      if (!["admin", "staff"].includes(resolvedRole)) {
        await supabase.auth.signOut();
        throw new Error("Access denied: admin or staff role required.");
      }

      toast.success("Welcome back!");
      navigate({ to: getPostLoginPath(resolvedRole) });
    } catch (err: unknown) {
      console.error(err);
      toast.error(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-to-b from-background via-secondary/10 to-background py-12">
      <Card className="w-full max-w-md shadow-2xl border-border backdrop-blur bg-background/95">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center mb-4">
            <Stethoscope className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Law Firm Portal</CardTitle>
          <CardDescription>Admins and staff sign in with email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@lawfirm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button type="submit" className="w-full mt-6" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
