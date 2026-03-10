import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GlucoseRecord, InsulinRecord, MealRecord, ExerciseRecord, MoodRecord, HbA1cRecord, Profile } from '@/types/database';

// Generate demo data
function generateDemoGlucoseRecords(): GlucoseRecord[] {
  const now = new Date();
  const records: GlucoseRecord[] = [];
  const timings: GlucoseRecord['timing'][] = ['fasting', 'before_meal', 'after_meal', 'before_exercise', 'after_exercise', 'before_sleep'];

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(i / 4));
    date.setHours(6 + (i % 4) * 5, Math.floor(Math.random() * 60));

    records.push({
      id: `glucose-${i}`,
      user_id: 'demo-user',
      value: Math.floor(80 + Math.random() * 140),
      measured_at: date.toISOString(),
      source: Math.random() > 0.3 ? 'cgm' : 'manual',
      timing: timings[i % timings.length],
      note: null,
    });
  }
  return records.sort((a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime());
}

function generateDemoInsulinRecords(): InsulinRecord[] {
  const now = new Date();
  const records: InsulinRecord[] = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(i / 2));
    const isRapid = i % 2 === 0;
    date.setHours(isRapid ? 8 + (i % 3) * 5 : 22, 0);

    records.push({
      id: `insulin-${i}`,
      user_id: 'demo-user',
      insulin_name: isRapid ? '노보래피드' : '트레시바',
      insulin_type: isRapid ? 'rapid' : 'long',
      dose: isRapid ? 3 + Math.floor(Math.random() * 5) : 10 + Math.floor(Math.random() * 4),
      injected_at: date.toISOString(),
      injection_site: (['abdomen', 'thigh', 'arm', 'hip'] as const)[i % 4],
      note: null,
    });
  }
  return records.sort((a, b) => new Date(b.injected_at).getTime() - new Date(a.injected_at).getTime());
}

const defaultProfile: Profile = {
  id: 'demo-user',
  display_name: '사용자',
  diabetes_type: 'type1',
  diagnosis_date: '2020-03-15',
  target_glucose_min: 70,
  target_glucose_max: 180,
  target_hba1c: 7.0,
  glucose_unit: 'mg/dL',
  preferred_insulins: [
    { name: '노보래피드', type: 'rapid' },
    { name: '트레시바', type: 'long' },
  ],
  pump_user: false,
  pump_model: null,
  cgm_user: true,
  cgm_model: '덱스콤 G7',
  emergency_contact_name: null,
  emergency_contact_phone: null,
  onboarding_completed: true,
};

interface RecordsState {
  profile: Profile;
  glucoseRecords: GlucoseRecord[];
  insulinRecords: InsulinRecord[];
  mealRecords: MealRecord[];
  exerciseRecords: ExerciseRecord[];
  moodRecords: MoodRecord[];
  hba1cRecords: HbA1cRecord[];

  setProfile: (profile: Partial<Profile>) => void;
  addGlucoseRecord: (record: Omit<GlucoseRecord, 'id' | 'user_id'>) => void;
  addInsulinRecord: (record: Omit<InsulinRecord, 'id' | 'user_id'>) => void;
  addMealRecord: (record: Omit<MealRecord, 'id' | 'user_id'>) => void;
  addExerciseRecord: (record: Omit<ExerciseRecord, 'id' | 'user_id'>) => void;
  addMoodRecord: (record: Omit<MoodRecord, 'id' | 'user_id'>) => void;
  addHbA1cRecord: (record: Omit<HbA1cRecord, 'id' | 'user_id'>) => void;
  deleteRecord: (type: string, id: string) => void;
  resetStore: () => void;
}

export const useRecordsStore = create<RecordsState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      glucoseRecords: generateDemoGlucoseRecords(),
      insulinRecords: generateDemoInsulinRecords(),
      mealRecords: [],
      exerciseRecords: [],
      moodRecords: [],
      hba1cRecords: [
        { id: 'hba1c-1', user_id: 'demo-user', value: 7.2, tested_at: '2025-12-15', lab_name: '서울대병원', note: null },
        { id: 'hba1c-2', user_id: 'demo-user', value: 6.8, tested_at: '2026-03-10', lab_name: '서울대병원', note: '개선됨' },
      ],

      setProfile: (updates) => set((state) => ({ profile: { ...state.profile, ...updates } })),

      addGlucoseRecord: (record) => set((state) => ({
        glucoseRecords: [{ ...record, id: `glucose-${Date.now()}`, user_id: state.profile.id }, ...state.glucoseRecords],
      })),

      addInsulinRecord: (record) => set((state) => ({
        insulinRecords: [{ ...record, id: `insulin-${Date.now()}`, user_id: state.profile.id }, ...state.insulinRecords],
      })),

      addMealRecord: (record) => set((state) => ({
        mealRecords: [{ ...record, id: `meal-${Date.now()}`, user_id: state.profile.id }, ...state.mealRecords],
      })),

      addExerciseRecord: (record) => set((state) => ({
        exerciseRecords: [{ ...record, id: `exercise-${Date.now()}`, user_id: state.profile.id }, ...state.exerciseRecords],
      })),

      addMoodRecord: (record) => set((state) => ({
        moodRecords: [{ ...record, id: `mood-${Date.now()}`, user_id: state.profile.id }, ...state.moodRecords],
      })),

      addHbA1cRecord: (record) => set((state) => ({
        hba1cRecords: [{ ...record, id: `hba1c-${Date.now()}`, user_id: state.profile.id }, ...state.hba1cRecords],
      })),

      deleteRecord: (type, id) => set((state) => {
        switch (type) {
          case 'glucose': return { glucoseRecords: state.glucoseRecords.filter(r => r.id !== id) };
          case 'insulin': return { insulinRecords: state.insulinRecords.filter(r => r.id !== id) };
          case 'meal': return { mealRecords: state.mealRecords.filter(r => r.id !== id) };
          case 'exercise': return { exerciseRecords: state.exerciseRecords.filter(r => r.id !== id) };
          case 'mood': return { moodRecords: state.moodRecords.filter(r => r.id !== id) };
          case 'hba1c': return { hba1cRecords: state.hba1cRecords.filter(r => r.id !== id) };
          default: return {};
        }
      }),

      resetStore: () => set({
        profile: defaultProfile,
        glucoseRecords: [],
        insulinRecords: [],
        mealRecords: [],
        exerciseRecords: [],
        moodRecords: [],
        hba1cRecords: [],
      }),
    }),
    { name: 'dangbiseo-records' }
  )
);
