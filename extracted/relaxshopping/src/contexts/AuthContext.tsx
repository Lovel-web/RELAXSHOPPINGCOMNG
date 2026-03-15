import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/types';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  state: string;
  lga_id: string;
  estate_id?: string;
  approved: boolean;
  bank_account?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: {
    fullName: string;
    phone: string;
    role: UserRole;
    state: string;
    lgaId?: string;
    estateId?: string;
    bankAccount?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
  }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  // Legacy compatibility
  currentUser: User | null;
  userProfile: {
    uid: string;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    state: string;
    lgaId: string;
    estateId?: string;
    approved: boolean;
    bankAccount?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    };
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    // Note: loading is controlled by auth lifecycle, not data refresh
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Fetch role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError || roleError) {
        console.error('Error fetching user data:', { profileError, roleError });
        toast.error('User profile not found');
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }

      if (!profileData || !roleData) {
        console.warn('Profile or role not found for user:', userId);
        toast.error('User profile not found');
        setProfile(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setRole(roleData.role as UserRole);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('User profile not found');
      setProfile(null);
      setRole(null);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Defer Supabase calls with setTimeout to prevent deadlock
      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setRole(null);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Only handle no-session case here; onAuthStateChange handles data fetching
      if (!session?.user) {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData: {
      fullName: string;
      phone: string;
      role: UserRole;
      state: string;
      lgaId?: string;
      estateId?: string;
      bankAccount?: {
        bankName: string;
        accountNumber: string;
        accountName: string;
      };
    }
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: userData.fullName,
            phone: userData.phone,
            role: userData.role,
            state: userData.state,
            lga_id: userData.lgaId || '',
            estate_id: userData.estateId || '',
            bank_account: userData.bankAccount ? {
              bank_name: userData.bankAccount.bankName,
              account_number: userData.bankAccount.accountNumber,
              account_name: userData.bankAccount.accountName,
            } : null,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: new Error('Email already in use') };
        }
        return { error };
      }

      toast.success('Account created successfully!');
      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: new Error(error.message || 'Failed to create account') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Invalid email or password') };
        }
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: new Error(error.message || 'Failed to sign in') };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setRole(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error };
      }

      toast.success('Password reset email sent!');
      return { error: null };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { error: new Error(error.message || 'Failed to send reset email') };
    }
  };

  // Create legacy-compatible userProfile
  const userProfile = profile && role ? {
    uid: profile.user_id,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    role: role,
    state: profile.state,
    lgaId: profile.lga_id,
    estateId: profile.estate_id,
    approved: profile.approved,
    bankAccount: profile.bank_account ? {
      bankName: profile.bank_account.bank_name,
      accountNumber: profile.bank_account.account_number,
      accountName: profile.bank_account.account_name,
    } : undefined,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at),
  } : null;

  const value = {
    session,
    user,
    profile,
    role,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile,
    // Legacy compatibility
    currentUser: user,
    userProfile,
    refreshUserProfile: refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
