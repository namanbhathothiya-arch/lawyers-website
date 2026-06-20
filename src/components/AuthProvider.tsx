import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AuthRoleRow } from "@/lib/auth-role";
import { AuthContext } from "@/components/auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const roleResponse = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      const data = roleResponse.data as AuthRoleRow | null;
      const error = roleResponse.error;

      if (error || !data) {
        return null;
      } else {
        return data?.role ?? null;
      }
    } catch (err) {
      console.error("Error fetching user role:", err);
      return null;
    }
  }, []);

  const applySessionState = useCallback(
    async (nextSession: Session | null) => {
      setLoading(true);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const resolvedRole = await fetchUserRole(nextSession.user.id);

      setRole(resolvedRole);

      setLoading(false);
    },
    [fetchUserRole],
  );

  const refreshAuthState = useCallback(async () => {
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.getSession();
    await applySessionState(refreshedSession);
  }, [applySessionState]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await applySessionState(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      await applySessionState(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [applySessionState]);

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signOut,
        refreshAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
