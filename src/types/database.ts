export type DiabetesType = 'type1' | 'type2' | 'gestational' | 'lada';
export type GlucoseUnit = 'mg/dL' | 'mmol/L';
export type InsulinType = 'rapid' | 'short' | 'intermediate' | 'long' | 'mixed';
export type InjectionSite = 'abdomen' | 'thigh' | 'arm' | 'hip';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type GlucoseTiming = 'fasting' | 'before_meal' | 'after_meal' | 'before_exercise' | 'after_exercise' | 'before_sleep';
export type GlucoseSource = 'manual' | 'cgm';
export type ExerciseType = '웨이트' | '유산소' | '수영' | '댄스' | '격투기' | '요가' | '걷기' | '자전거' | '기타';
export type ExerciseIntensity = 'low' | 'moderate' | 'high';
export type MoodLevel = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
export type FoodCategory = '한식' | '양식' | '중식' | '분식' | '패스트푸드' | '편의점' | '간식' | '음료' | '카페';

export interface Profile {
  id: string;
  display_name: string;
  diabetes_type: DiabetesType;
  diagnosis_date: string | null;
  target_glucose_min: number;
  target_glucose_max: number;
  target_hba1c: number;
  glucose_unit: GlucoseUnit;
  preferred_insulins: { name: string; type: InsulinType }[];
  pump_user: boolean;
  pump_model: string | null;
  cgm_user: boolean;
  cgm_model: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  onboarding_completed: boolean;
}

export interface GlucoseRecord {
  id: string;
  user_id: string;
  value: number;
  measured_at: string;
  source: GlucoseSource;
  timing: GlucoseTiming;
  note: string | null;
}

export interface InsulinRecord {
  id: string;
  user_id: string;
  insulin_name: string;
  insulin_type: InsulinType;
  dose: number;
  injected_at: string;
  injection_site: InjectionSite;
  note: string | null;
}

export interface MealRecord {
  id: string;
  user_id: string;
  meal_type: MealType;
  eaten_at: string;
  total_carbs: number;
  total_calories: number | null;
  photo_url: string | null;
  note: string | null;
  items: MealFoodItem[];
}

export interface MealFoodItem {
  id: string;
  meal_id: string;
  food_id: string | null;
  user_food_id: string | null;
  food_name: string;
  quantity: number;
  carbs: number;
}

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  serving_size: string;
  carbs: number;
  protein: number | null;
  fat: number | null;
  calories: number | null;
  glycemic_note: string | null;
  is_verified: boolean;
}

export interface UserFood {
  id: string;
  user_id: string;
  name: string;
  carbs: number;
  serving_size: string;
  protein: number | null;
  fat: number | null;
  calories: number | null;
}

export interface ExerciseRecord {
  id: string;
  user_id: string;
  exercise_type: ExerciseType;
  duration_minutes: number;
  intensity: ExerciseIntensity;
  steps: number | null;
  calories_burned: number | null;
  started_at: string;
  glucose_before: number | null;
  glucose_after: number | null;
  carb_supplement: number | null;
  note: string | null;
}

export interface HbA1cRecord {
  id: string;
  user_id: string;
  value: number;
  tested_at: string;
  lab_name: string | null;
  note: string | null;
}

export interface MoodRecord {
  id: string;
  user_id: string;
  mood: MoodLevel;
  stress_level: number;
  factors: string[];
  note: string | null;
  recorded_at: string;
}
