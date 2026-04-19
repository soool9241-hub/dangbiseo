'use client';

import { useEffect, useCallback, useRef } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useRecordsStore } from '@/stores/records-store';

// 2분 이내 같은 데이터가 있으면 중복으로 판단
const DEDUP_WINDOW_MS = 2 * 60 * 1000;

// 모듈 레벨에 선언하여 클로저 문제 방지
function isTimeSimilar(t1: string, t2: string): boolean {
  return Math.abs(new Date(t1).getTime() - new Date(t2).getTime()) < DEDUP_WINDOW_MS;
}

export function useSupabaseSync() {
  const { user, supabase } = useAuth();
  const configured = isSupabaseConfigured();
  const fetchedRef = useRef(false);
  // ref 기반 중복 클릭 방지 (React state보다 빠름)
  const savingRef = useRef<Record<string, boolean>>({});

  const fetchAll = useCallback(async () => {
    if (!user || !configured) {
      useRecordsStore.getState().setLoading(false);
      return;
    }

    useRecordsStore.getState().setLoading(true);

    try {
      const [
        profileRes,
        glucoseRes,
        insulinRes,
        mealsRes,
        exerciseRes,
        moodRes,
        hba1cRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('glucose_records').select('*').eq('user_id', user.id).order('measured_at', { ascending: false }),
        supabase.from('insulin_records').select('*').eq('user_id', user.id).order('injected_at', { ascending: false }),
        supabase.from('meal_records').select('*').eq('user_id', user.id).order('eaten_at', { ascending: false }),
        supabase.from('exercise_records').select('*').eq('user_id', user.id).order('started_at', { ascending: false }),
        supabase.from('mood_records').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false }),
        supabase.from('hba1c_records').select('*').eq('user_id', user.id).order('tested_at', { ascending: false }),
      ]);

      if (profileRes.error) console.error('[fetchAll] Profile error:', profileRes.error);
      if (glucoseRes.error) console.error('[fetchAll] Glucose error:', glucoseRes.error);
      if (insulinRes.error) console.error('[fetchAll] Insulin error:', insulinRes.error);

      if (profileRes.data) {
        useRecordsStore.getState().setProfile({
          ...profileRes.data,
          preferred_insulins: profileRes.data.preferred_insulins || [],
        });
      }

      useRecordsStore.setState({
        glucoseRecords: glucoseRes.data || [],
        insulinRecords: insulinRes.data || [],
        mealRecords: (mealsRes.data || []).map(m => ({ ...m, items: [] })),
        exerciseRecords: exerciseRes.data || [],
        moodRecords: moodRes.data || [],
        hba1cRecords: hba1cRes.data || [],
        loading: false,
      });

      fetchedRef.current = true;
    } catch (err) {
      console.error('[fetchAll] Unexpected error:', err);
      useRecordsStore.getState().setLoading(false);
    }
  }, [user, configured, supabase]);

  useEffect(() => {
    fetchedRef.current = false;
    fetchAll();
  }, [fetchAll]);

  // ========== 저장 함수들 (중복 방지 적용) ==========

  const addGlucoseRecord = useCallback(async (record: { value: number; measured_at: string; source: string; timing: string; note: string | null }) => {
    if (!user) throw new Error('로그인이 필요합니다');

    // ref 기반 즉시 차단
    if (savingRef.current.glucose) {
      console.log('[addGlucoseRecord] 이미 저장 중 - 무시');
      return;
    }
    savingRef.current.glucose = true;

    try {
      // 서버 중복 체크: 같은 시간대 + 같은 값
      const { data: existing } = await supabase
        .from('glucose_records')
        .select('id, measured_at, value')
        .eq('user_id', user.id)
        .eq('value', record.value)
        .eq('timing', record.timing);

      const isDup = existing?.some(r => isTimeSimilar(r.measured_at, record.measured_at));
      if (isDup) {
        console.log('[addGlucoseRecord] 중복 기록 감지 - 건너뜀');
        // 중복이지만 에러 대신 정상 완료 처리
        return;
      }

      const { error } = await supabase.from('glucose_records').insert({
        user_id: user.id,
        value: record.value,
        measured_at: record.measured_at,
        source: record.source,
        timing: record.timing,
        note: record.note,
      });
      if (error) throw new Error(`혈당 기록 저장 실패: ${error.message}`);

      const { data, error: fetchError } = await supabase.from('glucose_records').select('*').eq('user_id', user.id).order('measured_at', { ascending: false });
      if (!fetchError) useRecordsStore.setState({ glucoseRecords: data || [] });
    } finally {
      savingRef.current.glucose = false;
    }
  }, [user, supabase]);

  const addInsulinRecord = useCallback(async (record: { insulin_name: string; insulin_type: string; dose: number; injected_at: string; injection_site: string; note: string | null }) => {
    if (!user) throw new Error('로그인이 필요합니다');

    if (savingRef.current.insulin) {
      console.log('[addInsulinRecord] 이미 저장 중 - 무시');
      return;
    }
    savingRef.current.insulin = true;

    try {
      // 서버 중복 체크: 같은 시간대 + 같은 인슐린 + 같은 용량
      const { data: existing } = await supabase
        .from('insulin_records')
        .select('id, injected_at, insulin_name, dose')
        .eq('user_id', user.id)
        .eq('insulin_name', record.insulin_name)
        .eq('dose', record.dose);

      const isDup = existing?.some(r => isTimeSimilar(r.injected_at, record.injected_at));
      if (isDup) {
        console.log('[addInsulinRecord] 중복 기록 감지 - 건너뜀');
        return;
      }

      const { error } = await supabase.from('insulin_records').insert({
        user_id: user.id,
        insulin_name: record.insulin_name,
        insulin_type: record.insulin_type,
        dose: record.dose,
        injected_at: record.injected_at,
        injection_site: record.injection_site,
        note: record.note,
      });
      if (error) throw new Error(`인슐린 기록 저장 실패: ${error.message}`);

      const { data, error: fetchError } = await supabase.from('insulin_records').select('*').eq('user_id', user.id).order('injected_at', { ascending: false });
      if (!fetchError) useRecordsStore.setState({ insulinRecords: data || [] });
    } finally {
      savingRef.current.insulin = false;
    }
  }, [user, supabase]);

  const addMealRecord = useCallback(async (record: { meal_type: string; eaten_at: string; total_carbs: number; total_calories: number | null; photo_url: string | null; note: string | null }) => {
    if (!user) throw new Error('로그인이 필요합니다');

    if (savingRef.current.meal) {
      console.log('[addMealRecord] 이미 저장 중 - 무시');
      return;
    }
    savingRef.current.meal = true;

    try {
      // 서버 중복 체크: 같은 시간대 + 같은 식사유형 + 같은 탄수화물량
      const { data: existing } = await supabase
        .from('meal_records')
        .select('id, eaten_at, meal_type, total_carbs')
        .eq('user_id', user.id)
        .eq('meal_type', record.meal_type)
        .eq('total_carbs', record.total_carbs);

      const isDup = existing?.some(r => isTimeSimilar(r.eaten_at, record.eaten_at));
      if (isDup) {
        console.log('[addMealRecord] 중복 기록 감지 - 건너뜀');
        return;
      }

      const { error } = await supabase.from('meal_records').insert({
        user_id: user.id,
        meal_type: record.meal_type,
        eaten_at: record.eaten_at,
        total_carbs: record.total_carbs,
        total_calories: record.total_calories,
        photo_url: record.photo_url,
        note: record.note,
      });
      if (error) throw new Error(`식단 기록 저장 실패: ${error.message}`);

      const { data, error: fetchError } = await supabase.from('meal_records').select('*').eq('user_id', user.id).order('eaten_at', { ascending: false });
      if (!fetchError) useRecordsStore.setState({ mealRecords: (data || []).map(m => ({ ...m, items: [] })) });
    } finally {
      savingRef.current.meal = false;
    }
  }, [user, supabase]);

  const addExerciseRecord = useCallback(async (record: { exercise_type: string; duration_minutes: number; intensity: string; steps: number | null; calories_burned: number | null; started_at: string; glucose_before: number | null; glucose_after: number | null; carb_supplement: number | null; note: string | null }) => {
    if (!user) throw new Error('로그인이 필요합니다');

    if (savingRef.current.exercise) {
      console.log('[addExerciseRecord] 이미 저장 중 - 무시');
      return;
    }
    savingRef.current.exercise = true;

    try {
      // 서버 중복 체크: 같은 시간대 + 같은 운동종류
      const { data: existing } = await supabase
        .from('exercise_records')
        .select('id, started_at, exercise_type')
        .eq('user_id', user.id)
        .eq('exercise_type', record.exercise_type);

      const isDup = existing?.some(r => isTimeSimilar(r.started_at, record.started_at));
      if (isDup) {
        console.log('[addExerciseRecord] 중복 기록 감지 - 건너뜀');
        return;
      }

      const { error } = await supabase.from('exercise_records').insert({
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
      if (error) throw new Error(`운동 기록 저장 실패: ${error.message}`);

      const { data, error: fetchError } = await supabase.from('exercise_records').select('*').eq('user_id', user.id).order('started_at', { ascending: false });
      if (!fetchError) useRecordsStore.setState({ exerciseRecords: data || [] });
    } finally {
      savingRef.current.exercise = false;
    }
  }, [user, supabase]);

  const addMoodRecord = useCallback(async (record: { mood: string; stress_level: number; factors: string[]; note: string | null; recorded_at: string }) => {
    if (!user) throw new Error('로그인이 필요합니다');

    if (savingRef.current.mood) {
      console.log('[addMoodRecord] 이미 저장 중 - 무시');
      return;
    }
    savingRef.current.mood = true;

    try {
      const { data: existing } = await supabase
        .from('mood_records')
        .select('id, recorded_at, mood')
        .eq('user_id', user.id)
        .eq('mood', record.mood);

      const isDup = existing?.some(r => isTimeSimilar(r.recorded_at, record.recorded_at));
      if (isDup) {
        console.log('[addMoodRecord] 중복 기록 감지 - 건너뜀');
        return;
      }

      const { error } = await supabase.from('mood_records').insert({
        user_id: user.id,
        mood: record.mood,
        stress_level: record.stress_level,
        factors: record.factors,
        note: record.note,
        recorded_at: record.recorded_at,
      });
      if (error) throw new Error(`기분 기록 저장 실패: ${error.message}`);

      const { data, error: fetchError } = await supabase.from('mood_records').select('*').eq('user_id', user.id).order('recorded_at', { ascending: false });
      if (!fetchError) useRecordsStore.setState({ moodRecords: data || [] });
    } finally {
      savingRef.current.mood = false;
    }
  }, [user, supabase]);

  const addHbA1cRecord = useCallback(async (record: { value: number; tested_at: string; lab_name: string | null; note: string | null }) => {
    if (!user) throw new Error('로그인이 필요합니다');

    if (savingRef.current.hba1c) {
      console.log('[addHbA1cRecord] 이미 저장 중 - 무시');
      return;
    }
    savingRef.current.hba1c = true;

    try {
      const { error } = await supabase.from('hba1c_records').insert({
        user_id: user.id,
        value: record.value,
        tested_at: record.tested_at,
        lab_name: record.lab_name,
        note: record.note,
      });
      if (error) throw new Error(`HbA1c 기록 저장 실패: ${error.message}`);

      const { data, error: fetchError } = await supabase.from('hba1c_records').select('*').eq('user_id', user.id).order('tested_at', { ascending: false });
      if (!fetchError) useRecordsStore.setState({ hba1cRecords: data || [] });
    } finally {
      savingRef.current.hba1c = false;
    }
  }, [user, supabase]);

  const updateProfile = useCallback(async (updates: Record<string, unknown>) => {
    const currentStore = useRecordsStore.getState();
    currentStore.setProfile(updates);
    if (user) {
      const merged = { ...currentStore.profile, ...updates };
      const { error } = await supabase.from('profiles').upsert({
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
      if (error) console.error('[updateProfile] Upsert error:', error);
    }
  }, [user, supabase]);

  const deleteRecord = useCallback(async (type: string, id: string) => {
    useRecordsStore.getState().deleteRecord(type, id);
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
        const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id);
        if (error) console.error(`[deleteRecord] Delete error (${type}):`, error);
      }
    }
  }, [user, supabase]);

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
