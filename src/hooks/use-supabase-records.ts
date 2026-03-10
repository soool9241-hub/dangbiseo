'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useRecordsStore } from '@/stores/records-store';

export function useSupabaseSync() {
  const { user } = useAuth();
  const store = useRecordsStore();
  const supabase = useMemo(() => createClient(), []);
  const configured = isSupabaseConfigured();

  // Fetch all data from Supabase on mount
  useEffect(() => {
    if (!user || !configured) return;

    async function fetchAll() {
      const [
        { data: profile },
        { data: glucose },
        { data: insulin },
        { data: meals },
        { data: exercise },
        { data: mood },
        { data: hba1c },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user!.id).single(),
        supabase.from('glucose_records').select('*').eq('user_id', user!.id).order('measured_at', { ascending: false }),
        supabase.from('insulin_records').select('*').eq('user_id', user!.id).order('injected_at', { ascending: false }),
        supabase.from('meal_records').select('*').eq('user_id', user!.id).order('eaten_at', { ascending: false }),
        supabase.from('exercise_records').select('*').eq('user_id', user!.id).order('started_at', { ascending: false }),
        supabase.from('mood_records').select('*').eq('user_id', user!.id).order('recorded_at', { ascending: false }),
        supabase.from('hba1c_records').select('*').eq('user_id', user!.id).order('tested_at', { ascending: false }),
      ]);

      if (profile) {
        store.setProfile({
          ...profile,
          preferred_insulins: profile.preferred_insulins || [],
        });
      }

      // Use the store's internal setState to batch update
      useRecordsStore.setState({
        glucoseRecords: glucose || [],
        insulinRecords: insulin || [],
        mealRecords: (meals || []).map(m => ({ ...m, items: [] })),
        exerciseRecords: exercise || [],
        moodRecords: mood || [],
        hba1cRecords: hba1c || [],
      });
    }

    fetchAll();
  }, [user]);

  // Wrapped add functions that also write to Supabase
  const addGlucoseRecord = useCallback(async (record: Parameters<typeof store.addGlucoseRecord>[0]) => {
    store.addGlucoseRecord(record);
    if (user) {
      await supabase.from('glucose_records').insert({
        user_id: user.id,
        value: record.value,
        measured_at: record.measured_at,
        source: record.source,
        timing: record.timing,
        note: record.note,
      });
    }
  }, [user, store, supabase]);

  const addInsulinRecord = useCallback(async (record: Parameters<typeof store.addInsulinRecord>[0]) => {
    store.addInsulinRecord(record);
    if (user) {
      await supabase.from('insulin_records').insert({
        user_id: user.id,
        insulin_name: record.insulin_name,
        insulin_type: record.insulin_type,
        dose: record.dose,
        injected_at: record.injected_at,
        injection_site: record.injection_site,
        note: record.note,
      });
    }
  }, [user, store, supabase]);

  const addMealRecord = useCallback(async (record: Parameters<typeof store.addMealRecord>[0]) => {
    store.addMealRecord(record);
    if (user) {
      await supabase.from('meal_records').insert({
        user_id: user.id,
        meal_type: record.meal_type,
        eaten_at: record.eaten_at,
        total_carbs: record.total_carbs,
        total_calories: record.total_calories,
        photo_url: record.photo_url,
        note: record.note,
      });
    }
  }, [user, store, supabase]);

  const addExerciseRecord = useCallback(async (record: Parameters<typeof store.addExerciseRecord>[0]) => {
    store.addExerciseRecord(record);
    if (user) {
      await supabase.from('exercise_records').insert({
        user_id: user.id,
        exercise_type: record.exercise_type,
        duration_minutes: record.duration_minutes,
        intensity: record.intensity,
        steps: record.steps,
        calories_burned: record.calories_burned,
        started_at: record.started_at,
        glucose_before: record.glucose_before,
        glucose_after: record.glucose_after,
        carb_supplement: record.carb_supplement,
        note: record.note,
      });
    }
  }, [user, store, supabase]);

  const addMoodRecord = useCallback(async (record: Parameters<typeof store.addMoodRecord>[0]) => {
    store.addMoodRecord(record);
    if (user) {
      await supabase.from('mood_records').insert({
        user_id: user.id,
        mood: record.mood,
        stress_level: record.stress_level,
        factors: record.factors,
        note: record.note,
        recorded_at: record.recorded_at,
      });
    }
  }, [user, store, supabase]);

  const addHbA1cRecord = useCallback(async (record: Parameters<typeof store.addHbA1cRecord>[0]) => {
    store.addHbA1cRecord(record);
    if (user) {
      await supabase.from('hba1c_records').insert({
        user_id: user.id,
        value: record.value,
        tested_at: record.tested_at,
        lab_name: record.lab_name,
        note: record.note,
      });
    }
  }, [user, store, supabase]);

  const deleteRecord = useCallback(async (type: string, id: string) => {
    store.deleteRecord(type, id);
    if (user) {
      const tableMap: Record<string, string> = {
        glucose: 'glucose_records',
        insulin: 'insulin_records',
        meal: 'meal_records',
        exercise: 'exercise_records',
        mood: 'mood_records',
        hba1c: 'hba1c_records',
      };
      const table = tableMap[type];
      if (table) {
        await supabase.from(table).delete().eq('id', id).eq('user_id', user.id);
      }
    }
  }, [user, store, supabase]);

  return {
    addGlucoseRecord,
    addInsulinRecord,
    addMealRecord,
    addExerciseRecord,
    addMoodRecord,
    addHbA1cRecord,
    deleteRecord,
    isAuthenticated: !!user,
  };
}
