import { create } from 'zustand';
import type { GlucoseRecord, InsulinRecord, MealRecord, ExerciseRecord, MoodRecord, HbA1cRecord, Profile } from '@/types/database';

const defaultProfile: Profile = {
  id: '',
  display_name: '',
  diabetes_type: 'type1',
  diagnosis_date: null,
  target_glucose_min: 70,
  target_glucose_max: 180,
  target_hba1c: 7.0,
  glucose_unit: 'mg/dL',
  preferred_insulins: [],
  pump_user: false,
  pump_model: null,
  cgm_user: false,
  cgm_model: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  onboarding_completed: false,
};

interface RecordsState {
  profile: Profile;
  glucoseRecords: GlucoseRecord[];
  insulinRecords: InsulinRecord[];
  mealRecords: MealRecord[];
  exerciseRecords: ExerciseRecord[];
  moodRecords: MoodRecord[];
  hba1cRecords: HbA1cRecord[];
  loading: boolean;

  setProfile: (profile: Partial<Profile>) => void;
  setLoading: (loading: boolean) => void;
  deleteRecord: (type: string, id: string) => void;
  resetStore: () => void;
}

export const useRecordsStore = create<RecordsState>()(
  (set) => ({
    profile: defaultProfile,
    glucoseRecords: [],
    insulinRecords: [],
    mealRecords: [],
    exerciseRecords: [],
    moodRecords: [],
    hba1cRecords: [],
    loading: true,

    setProfile: (updates) => set((state) => ({ profile: { ...state.profile, ...updates } })),
    setLoading: (loading) => set({ loading }),

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
      loading: false,
    }),
  })
);
