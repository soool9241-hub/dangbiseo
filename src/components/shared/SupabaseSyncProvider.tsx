'use client';

import { createContext, useContext } from 'react';
import { useSupabaseSync } from '@/hooks/use-supabase-records';

type SyncContext = ReturnType<typeof useSupabaseSync>;

const SupabaseSyncContext = createContext<SyncContext | null>(null);

export function SupabaseSyncProvider({ children }: { children: React.ReactNode }) {
  const sync = useSupabaseSync();
  return (
    <SupabaseSyncContext.Provider value={sync}>
      {children}
    </SupabaseSyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SupabaseSyncContext);
  if (!ctx) throw new Error('useSync must be used within SupabaseSyncProvider');
  return ctx;
}
