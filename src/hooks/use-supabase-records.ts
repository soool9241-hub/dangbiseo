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

  // Fetch all data from Supabase on mount / user change
  const fetchAll = useCallback(async () => {
    if (!user || !configured) {
      store.setLoading(false);
      return;
    }

    store.setLoading(true);

    const [
      { data: profile },
      { data: glucose },
      { data: insulin },
      { data: meals },
      { data: exercise },
      { data: mood },
      { data: hba1c },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('glucose_records').select('*').eq('user_id', user.id).order('measured_at', { ascending: false }),
      supabase.from('insulin_records').select('*').eq('user_id', user.id).order('injected_at', { ascending: false }),
      supabase.from('meal_records').select('*').eq('user_id', user.id).order('eaten_at', { ascending: false }),
      supabase.from('exercise_records').select('*').eq('user_id', user.id).order('started_at', { ascending: false }),
      supabase.from('mood_records').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }),
      supabase.from('hba1c_records').select('*').eq('user_id', user.id).order('tested_at', { ascending: false }),
    ]);

    if (profile) {
      store.setProfile({
        ...profile,
        preferred_insulins: profile.preferred_insulins || [],
      });
    }

    useRecordsStore.setState({
      glucoseRecords: glucose || [],
      insulinRecords: insulin || [],
      mealRecords: (meals || []).map(m => ({ ...m, items: [] })),
      exerciseRecords: exercise || [],
      moodRecords: mood || [],
      hba1cRecords: hba1c || [],
      loading: false,
    });
  }, [user, configured, supabase, store]);

  useEffect(() => {
    fetchAll();
  }, [user]);

  // Save to Supabase, then refetch to sync
  const addGlucoseRecord = useCallback(async (record: { value: number; measured_at: string; source: string; timing: string; note: string | null }) => {
    if (!user) return;
    await supabase.from('glucose_records').insert({
      user_id: user.id,
      value: record.value,
      measured_at: record.measured_at,
      source: record.source,
      timing: record.timing,
      note: record.note,
    });
    // Refetch glucose records
    const { data } = await supabase.from('glucose_records').select('*').eq('user_id', user.id).order('measured_at', { ascending: false });
    useRecordsStore.setState({ glucoseRecords: data || [] });
  }, [user, supabase]);

  const addInsulinRecord = useCallback(async (record: { insulin_name: string; insulin_type: string; dose: number; injected_at: string; injection_site: string; note: string | null }) => {
    if (!user) return;
    await supabase.from('insulin_records').insert({
      user_id: user.id,
      insulin_name: record.insulin_name,
      insulin_type: record.insulin_type,
      dose: record.dose,
      injected_at: record.injected_at,
      injection_site: record.injection_site,
      note: record.note,
    });
    const { data } = await supabase.from('insulin_records').select('*').eq('user_id', user.id).order('injected_at', { ascending: false });
    useRecordsStore.setState({ insulinRecords: data || [] });
  }, [user, supabase]);

  const addMealRecord = useCallback(async (record: { meal_type: string; eaten_at: string; total_carbs: number; total_calories: number | null; photo_url: string | null; note: string | null }) => {
    if (!user) return;
    await supabase.from('meal_records').insert({
      user_id: user.id,
      meal_type: record.meal_type,
      eaten_at: record.eaten_at,
      total_carbs: record.total_carbs,
      total_calories: record.total_calories,
      photo_url: record.photo_url,
      note: record.note,
    });
    const { data } = await supabase.from('meal_records').select('*').eq('user_id', user.id).order('eaten_at', { ascending: false });
    useRecordsStore.setState({ mealRecords: (data || []).map(m => ({ ...m, items: [] })) });
  }, [user, supabase]);

  const addExerciseRecord = useCallback(async (record: { exercise_type: string; duration_minutes: number; intensity: string; steps: number | null; calories_burned: number | null; started_at: string; glucose_before: number | null; glucose_after: number | null; carb_supplement: number | null; note: string | null }) => {
    if (!user) return;
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
    const { data } = await supabase.from('exercise_records').select('*').eq('user_id', user.id).order('started_at', { ascending: false });
    useRecordsStore.setState({ exerciseRecords: data || [] });
  }, [user, supabase]);

  const addMoodRecord = useCallback(async (record: { mood: string; stress_level: number; factors: string[]; note: string | null; recorded_at: string }) => {
    if (!user) return;
    await supabase.from('mood_records').insert({
      user_id: user.id,
      mood: record.mood,
      stress_level: record.stress_level,
      factors: record.factors,
      note: record.note,
      recorded_at: record.recorded_at,
    });
    const { data } = await supabase.from('mood_records').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false });
    useRecordsStore.setState({ moodRecords: data || [] });
  }, [user, supabase]);

  const addHbA1cRecord = useCallback(async (record: { value: number; tested_at: string; lab_name: string | null; note: string | null }) => {
    if (!user) return;
    await supabase.from('hba1c_records').insert({
      user_id: user.id,
      value: record.value,
      tested_at: record.tested_at,
      lab_name: record.lab_name,
      note: record.note,
    });
    const { data } = await supabase.from('hba1c_records').select('*').eq('user_id', user.id).order('tested_at', { ascending: false });
    useRecordsStore.setState({ hba1cRecords: data || [] });
  }, [user, supabase]);

  const updateProfile = useCallback(async (updates: Partial<typeof store.profile>) => {
    store.setProfile(updates);
    if (user) {
      const merged = { ...store.profile, ...updates };
      await supabase.from('profiles').upsert({
        id: user.id,
        display_name: merged.display_name,
        diabetes_type: merged.diabetes_type,
        diagnosis_date: merged.diagnosis_date,
        target_glucose_min: merged.target_glucose_min,
        target_glucose_max: merged.target_glucose_max,
        target_hba1c: merged.target_hba1c,
        glucose_unit: merged.glucose_unit,
        preferred_insulins: merged.preferred_insulins || [],
        pump_user: merged.pump_user,
        pump_model: merged.pump_model,
        cgm_user: merged.cgm_user,
        cgm_model: merged.cgm_model,
        emergency_contact_name: merged.emergency_contact_name,
        emergency_contact_phone: merged.emergency_contact_phone,
        onboarding_completed: merged.onboarding_completed,
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
    updateProfile,
    deleteRecord,
    refetch: fetchAll,
    isAuthenticated: !!user,
  };
}
