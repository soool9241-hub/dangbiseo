'use client';

import { createContext, useContext, useMemo } from 'react';
import { useSupabaseSync } from '@/hooks/use-supabase-records';

type SyncContext = ReturnType<typeof useSupabaseSync>;

const SupabaseSyncContext = createContext<SyncContext | null>(null);

export function SupabaseSyncProvider({ children }: { children: React.ReactNode }) {
  const sync = useSupabaseSync();
  // 함수들은 useCallback으로 stable이지만 객체 자체는 매 렌더 새로 생김
  // useMemo로 객체 reference도 stable하게 유지 → 컨슈머 불필요한 재렌더 방지
  const value = useMemo(() => sync, [
    sync.addGlucoseRecord,
    sync.addInsulinRecord,
    sync.addMealRecord,
    sync.addExerciseRecord,
    sync.addMoodRecord,
    sync.addHbA1cRecord,
    sync.updateProfile,
    sync.deleteRecord,
    sync.refetch,
    sync.isAuthenticated,
  ]);
  return (
    <SupabaseSyncContext.Provider value={value}>
      {children}
    </SupabaseSyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SupabaseSyncContext);
  if (!ctx) throw new Error('useSync must be used within SupabaseSyncProvider');
  return ctx;
}
