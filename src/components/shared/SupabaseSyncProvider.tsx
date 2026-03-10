'use client';

import { useSupabaseSync } from '@/hooks/use-supabase-records';

export function SupabaseSyncProvider({ children }: { children: React.ReactNode }) {
  useSupabaseSync();
  return <>{children}</>;
}
