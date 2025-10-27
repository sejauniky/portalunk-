import { useCallback, useEffect, useRef, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User as AppUser, LoginForm } from '@/types';
import { formatError } from '@/lib/errorUtils';

type AuthProfile = {
  id: string;
  userId: string;
  role: 'admin' | 'producer';
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};

const mapUserState = (sessionUser: SupabaseUser, profile: any): { appUser: AppUser; profileSummary: AuthProfile } => {
  const normalizedRole: 'admin' | 'producer' = profile?.role === 'admin' ? 'admin' : 'producer';
  const profileSummary: AuthProfile = {
    id: profile?.id ?? sessionUser.id,
    userId: sessionUser.id,
    role: normalizedRole,
    fullName: profile?.full_name ?? undefined,
    email: profile?.email ?? sessionUser.email ?? undefined,
    phone: profile?.phone ?? undefined,
    avatarUrl: profile?.avatar_url ?? undefined,
  };

  const appUser: AppUser = {
    id: sessionUser.id,
    username: profileSummary.fullName || profileSummary.email || sessionUser.email || '',
    role: normalizedRole,
    email: profileSummary.email || '',
    createdAt: (sessionUser as any).created_at ?? new Date().toISOString(),
    profile: {
      id: profileSummary.id,
      userId: profileSummary.userId,
      name: profileSummary.fullName || profileSummary.email || '',
      phone: profileSummary.phone,
      avatar: profileSummary.avatarUrl,
    },
  };

  return { appUser, profileSummary };
};

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loginPending, setLoginPending] = useState(false);
  const [supabaseReachable, setSupabaseReachable] = useState(true);
  const isMounted = useRef(true);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      if (!isSupabaseConfigured) {
        console.warn('[useAuth] Supabase not configured; skipping profile load');
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[useAuth] Failed to load profile:', formatError(error));
        return null;
      }

      return data;
    } catch (err) {
      console.error('[useAuth] Unexpected profile load error:', formatError(err));
      // If it's a network error, mark unreachable so UI can show message
      if (err && String(err).toLowerCase().includes('failed to fetch')) {
        setSupabaseReachable(false);
      }
      return null;
    }
  }, []);

  const hydrateFromSessionUser = useCallback(async (sessionUser: SupabaseUser | null) => {
    if (!isMounted.current) {
      return;
    }

    if (!sessionUser) {
      setUser(null);
      setUserProfile(null);
      setProfileLoading(false);
      setIsLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const profile = await loadUserProfile(sessionUser.id);
      if (!isMounted.current) {
        return;
      }

      const { appUser, profileSummary } = mapUserState(sessionUser, profile);
      setUser(appUser);
      setUserProfile(profileSummary);
    } catch (error) {
      console.error('[useAuth] Failed to hydrate from session:', error);
    } finally {
      if (isMounted.current) {
        setProfileLoading(false);
        setIsLoading(false);
      }
    }
  }, [loadUserProfile]);

  useEffect(() => {
    isMounted.current = true;

    // Safely attempt to get existing session; catch network errors
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        hydrateFromSessionUser(data?.session?.user ?? null);
      } catch (err) {
        console.error('[useAuth] getSession failed:', err);
        if (err && String(err).toLowerCase().includes('failed to fetch')) setSupabaseReachable(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateFromSessionUser(session?.user ?? null);
    });

    return () => {
      isMounted.current = false;
      listener?.subscription?.unsubscribe();
    };
  }, [hydrateFromSessionUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoginPending(true);
    const normalizeEmail = (value: string) => {
      const trimmed = (value || '').trim().toLowerCase();
      if (!trimmed) return trimmed;
      if (trimmed.endsWith('@unk')) {
        return `${trimmed}.com`;
      }
      if (!trimmed.endsWith('.com') && /@unk$/i.test(trimmed.replace(/\.com$/i, ''))) {
        return `${trimmed}.com`;
      }
      return trimmed;
    };
    const normalizedEmail = normalizeEmail(email);
    try {
      try {
        const result = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (!result.error) {
          await hydrateFromSessionUser(result.data?.user ?? null);
        }
        return result;
      } catch (err: any) {
        console.error('[useAuth] signIn network/error:', err);
        if (err && String(err).toLowerCase().includes('failed to fetch')) setSupabaseReachable(false);
        return { data: null, error: { message: 'Falha de rede ao conectar com o Supabase. Verifique sua conexão ou configuração.' } } as any;
      }
    } finally {
      setLoginPending(false);
    }
  }, [hydrateFromSessionUser]);

  const login = useCallback(async (credentials: LoginForm) => {
    const result = await signIn(credentials.username, credentials.password);
    if (result.error) {
      throw new Error(result.error.message || 'Login failed');
    }
    return result;
  }, [signIn]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message || 'Logout failed');
    }
    await hydrateFromSessionUser(null);
  }, [hydrateFromSessionUser]);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getSession();
    await hydrateFromSessionUser(data.session?.user ?? null);
  }, [hydrateFromSessionUser]);

  return {
    user,
    userProfile,
    role: userProfile?.role || user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    loading: isLoading,
    profileLoading,
    loginPending,
    signIn,
    login,
    logout,
    refreshProfile,
    supabaseReachable,
    loginMutation: { isPending: loginPending },
  };
}
