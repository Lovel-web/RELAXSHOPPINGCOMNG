import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User } from "@shared/schema";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, profile: { name: string; phone: string; role: string; stateId?: number; lgaId?: number; bankName?: string; accountNumber?: string }) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (_supabaseId?: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s?.access_token) {
        setUser(null);
        return;
      }
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers: { Authorization: `Bearer ${s.access_token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user?.id) {
        fetchProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user?.id) {
        fetchProfile(s.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, profile: { name: string; phone: string; role: string; stateId?: number; lgaId?: number; bankName?: string; accountNumber?: string }) => {
    if (!isSupabaseConfigured) return { error: "Authentication is not configured. Please set up Supabase environment variables." };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Signup failed" };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supabaseId: data.user.id,
        email,
        ...profile,
      }),
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      return { error: err.message || "Failed to create profile" };
    }

    const newUser = await res.json();
    setUser(newUser);
    return {};
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: "Authentication is not configured. Please set up Supabase environment variables." };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: "Login failed" };

    await fetchProfile(data.user.id);
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
