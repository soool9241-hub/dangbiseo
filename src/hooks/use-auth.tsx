'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User, SupabaseClient } from '@supabase/supabase-js';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  supabase: SupabaseClient;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ?? null;
        // 같은 user id면 레퍼런스 변경 스킵 - 무한 재렌더 방지
        setUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));
        setLoading(false);
      }
    );

    supabase.auth.getUser().then(({ data: { user: nextUser } }) => {
      setUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, configured]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signOut, supabase }),
    [user, loading, signOut, supabase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // 컨텍스트 없을 때도 흰화면 대신 안전한 기본값 반환
    return {
      user: null,
      loading: false,
      signOut: async () => {},
      supabase: createClient(),
    };
  }
  return ctx;
}
