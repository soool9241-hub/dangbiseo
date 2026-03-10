-- ============================================================
-- 당비서 (Dangbiseo) - 한국형 당뇨 관리 앱 데이터베이스 스키마
-- Supabase SQL Migration
-- ============================================================

-- ============================================================
-- 1. 프로필 테이블 (auth.users 확장)
-- ============================================================
CREATE TABLE public.profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name           TEXT NOT NULL DEFAULT '',
  diabetes_type          TEXT CHECK (diabetes_type IN ('type1','type2','gestational','lada')),
  diagnosis_date         DATE,
  target_glucose_min     SMALLINT DEFAULT 70,
  target_glucose_max     SMALLINT DEFAULT 180,
  target_hba1c           DECIMAL(3,1) DEFAULT 7.0,
  glucose_unit           TEXT DEFAULT 'mg/dL' CHECK (glucose_unit IN ('mg/dL','mmol/L')),
  preferred_insulins     JSONB DEFAULT '[]',
  pump_user              BOOLEAN DEFAULT FALSE,
  pump_model             TEXT,
  cgm_user               BOOLEAN DEFAULT FALSE,
  cgm_model              TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  onboarding_completed   BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.profiles IS '사용자 프로필 — auth.users를 확장하여 당뇨 관련 정보를 저장';

-- ============================================================
-- 2. 혈당 기록 테이블
-- ============================================================
CREATE TABLE public.glucose_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  value       SMALLINT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source      TEXT DEFAULT 'manual' CHECK (source IN ('manual','cgm')),
  timing      TEXT CHECK (timing IN ('fasting','before_meal','after_meal','before_exercise','after_exercise','before_sleep')),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.glucose_records IS '혈당 측정 기록';

-- ============================================================
-- 3. 인슐린 기록 테이블
-- ============================================================
CREATE TABLE public.insulin_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insulin_name   TEXT NOT NULL,
  insulin_type   TEXT CHECK (insulin_type IN ('rapid','short','intermediate','long','mixed')),
  dose           DECIMAL(5,2) NOT NULL,
  injected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  injection_site TEXT CHECK (injection_site IN ('abdomen','thigh','arm','hip')),
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.insulin_records IS '인슐린 투여 기록';

-- ============================================================
-- 4. 식사 기록 테이블
-- ============================================================
CREATE TABLE public.meal_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_type      TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  eaten_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_carbs    DECIMAL(6,1) DEFAULT 0,
  total_calories DECIMAL(7,1),
  photo_url      TEXT,
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.meal_records IS '식사 기록';

-- ============================================================
-- 5. 식사 음식 항목 테이블
-- ============================================================
CREATE TABLE public.meal_food_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id    UUID NOT NULL REFERENCES public.meal_records(id) ON DELETE CASCADE,
  food_name  TEXT NOT NULL,
  quantity   DECIMAL(6,2) DEFAULT 1,
  carbs      DECIMAL(6,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.meal_food_items IS '식사에 포함된 개별 음식 항목';

-- ============================================================
-- 6. 운동 기록 테이블
-- ============================================================
CREATE TABLE public.exercise_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_type    TEXT NOT NULL,
  duration_minutes SMALLINT NOT NULL,
  intensity        TEXT CHECK (intensity IN ('low','moderate','high')),
  steps            INTEGER,
  calories_burned  DECIMAL(7,1),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  glucose_before   SMALLINT,
  glucose_after    SMALLINT,
  carb_supplement  DECIMAL(5,1),
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.exercise_records IS '운동 기록 — 운동 전후 혈당 포함';

-- ============================================================
-- 7. 당화혈색소(HbA1c) 기록 테이블
-- ============================================================
CREATE TABLE public.hba1c_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  value      DECIMAL(3,1) NOT NULL,
  tested_at  DATE NOT NULL,
  lab_name   TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.hba1c_records IS '당화혈색소(HbA1c) 검사 기록';

-- ============================================================
-- 8. 기분/컨디션 기록 테이블
-- ============================================================
CREATE TABLE public.mood_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood         TEXT NOT NULL CHECK (mood IN ('great','good','neutral','bad','terrible')),
  stress_level SMALLINT CHECK (stress_level BETWEEN 1 AND 5),
  factors      TEXT[] DEFAULT '{}',
  note         TEXT,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.mood_records IS '기분 및 스트레스 기록';

-- ============================================================
-- 9. 음식 데이터베이스 테이블 (관리자 관리)
-- ============================================================
CREATE TABLE public.foods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category      TEXT,
  serving_size  TEXT,
  carbs         DECIMAL(6,1),
  protein       DECIMAL(6,1),
  fat           DECIMAL(6,1),
  calories      DECIMAL(7,1),
  glycemic_note TEXT,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.foods IS '공용 음식 데이터베이스 — 관리자가 관리';

-- ============================================================
-- 10. 사용자 커스텀 음식 테이블
-- ============================================================
CREATE TABLE public.user_foods (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  carbs        DECIMAL(6,1),
  serving_size TEXT,
  protein      DECIMAL(6,1),
  fat          DECIMAL(6,1),
  calories     DECIMAL(7,1),
  created_at   TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.user_foods IS '사용자가 직접 등록한 커스텀 음식';

-- ============================================================
-- 11. 즐겨찾기 음식 테이블
-- ============================================================
CREATE TABLE public.favorite_foods (
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_id    UUID REFERENCES public.foods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, food_id)
);

COMMENT ON TABLE public.favorite_foods IS '사용자 즐겨찾기 음식';


-- ============================================================
-- B. 성능 인덱스
-- ============================================================

-- 혈당 기록 인덱스
CREATE INDEX idx_glucose_records_user_id     ON public.glucose_records(user_id);
CREATE INDEX idx_glucose_records_measured_at  ON public.glucose_records(measured_at);
CREATE INDEX idx_glucose_records_user_date    ON public.glucose_records(user_id, measured_at DESC);

-- 인슐린 기록 인덱스
CREATE INDEX idx_insulin_records_user_id     ON public.insulin_records(user_id);
CREATE INDEX idx_insulin_records_injected_at ON public.insulin_records(injected_at);
CREATE INDEX idx_insulin_records_user_date   ON public.insulin_records(user_id, injected_at DESC);

-- 식사 기록 인덱스
CREATE INDEX idx_meal_records_user_id   ON public.meal_records(user_id);
CREATE INDEX idx_meal_records_eaten_at  ON public.meal_records(eaten_at);
CREATE INDEX idx_meal_records_user_date ON public.meal_records(user_id, eaten_at DESC);

-- 식사 음식 항목 인덱스
CREATE INDEX idx_meal_food_items_meal_id ON public.meal_food_items(meal_id);

-- 운동 기록 인덱스
CREATE INDEX idx_exercise_records_user_id    ON public.exercise_records(user_id);
CREATE INDEX idx_exercise_records_started_at ON public.exercise_records(started_at);
CREATE INDEX idx_exercise_records_user_date  ON public.exercise_records(user_id, started_at DESC);

-- 당화혈색소 기록 인덱스
CREATE INDEX idx_hba1c_records_user_id   ON public.hba1c_records(user_id);
CREATE INDEX idx_hba1c_records_tested_at ON public.hba1c_records(tested_at);

-- 기분 기록 인덱스
CREATE INDEX idx_mood_records_user_id     ON public.mood_records(user_id);
CREATE INDEX idx_mood_records_recorded_at ON public.mood_records(recorded_at);

-- 음식 데이터베이스 인덱스
CREATE INDEX idx_foods_name     ON public.foods(name);
CREATE INDEX idx_foods_category ON public.foods(category);

-- 사용자 커스텀 음식 인덱스
CREATE INDEX idx_user_foods_user_id ON public.user_foods(user_id);

-- 즐겨찾기 음식 인덱스
CREATE INDEX idx_favorite_foods_user_id ON public.favorite_foods(user_id);


-- ============================================================
-- C. 트리거 함수: 신규 사용자 가입 시 프로필 자동 생성
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- D. 트리거 함수: profiles.updated_at 자동 갱신
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================
-- E. Row Level Security (RLS) 활성화
-- ============================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insulin_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_food_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hba1c_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_foods       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_foods   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- A. RLS 정책
-- ============================================================

-- ----- profiles: 본인 프로필만 CRUD -----
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ----- glucose_records: 본인 기록만 CRUD -----
CREATE POLICY "glucose_records_select_own"
  ON public.glucose_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "glucose_records_insert_own"
  ON public.glucose_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "glucose_records_update_own"
  ON public.glucose_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "glucose_records_delete_own"
  ON public.glucose_records FOR DELETE
  USING (auth.uid() = user_id);

-- ----- insulin_records: 본인 기록만 CRUD -----
CREATE POLICY "insulin_records_select_own"
  ON public.insulin_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insulin_records_insert_own"
  ON public.insulin_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insulin_records_update_own"
  ON public.insulin_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "insulin_records_delete_own"
  ON public.insulin_records FOR DELETE
  USING (auth.uid() = user_id);

-- ----- meal_records: 본인 기록만 CRUD -----
CREATE POLICY "meal_records_select_own"
  ON public.meal_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meal_records_insert_own"
  ON public.meal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_records_update_own"
  ON public.meal_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_records_delete_own"
  ON public.meal_records FOR DELETE
  USING (auth.uid() = user_id);

-- ----- meal_food_items: 본인 식사에 속한 항목만 CRUD -----
CREATE POLICY "meal_food_items_select_own"
  ON public.meal_food_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_records
      WHERE meal_records.id = meal_food_items.meal_id
        AND meal_records.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_food_items_insert_own"
  ON public.meal_food_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_records
      WHERE meal_records.id = meal_food_items.meal_id
        AND meal_records.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_food_items_update_own"
  ON public.meal_food_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_records
      WHERE meal_records.id = meal_food_items.meal_id
        AND meal_records.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_records
      WHERE meal_records.id = meal_food_items.meal_id
        AND meal_records.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_food_items_delete_own"
  ON public.meal_food_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_records
      WHERE meal_records.id = meal_food_items.meal_id
        AND meal_records.user_id = auth.uid()
    )
  );

-- ----- exercise_records: 본인 기록만 CRUD -----
CREATE POLICY "exercise_records_select_own"
  ON public.exercise_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "exercise_records_insert_own"
  ON public.exercise_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercise_records_update_own"
  ON public.exercise_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercise_records_delete_own"
  ON public.exercise_records FOR DELETE
  USING (auth.uid() = user_id);

-- ----- hba1c_records: 본인 기록만 CRUD -----
CREATE POLICY "hba1c_records_select_own"
  ON public.hba1c_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "hba1c_records_insert_own"
  ON public.hba1c_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hba1c_records_update_own"
  ON public.hba1c_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hba1c_records_delete_own"
  ON public.hba1c_records FOR DELETE
  USING (auth.uid() = user_id);

-- ----- mood_records: 본인 기록만 CRUD -----
CREATE POLICY "mood_records_select_own"
  ON public.mood_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mood_records_insert_own"
  ON public.mood_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mood_records_update_own"
  ON public.mood_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mood_records_delete_own"
  ON public.mood_records FOR DELETE
  USING (auth.uid() = user_id);

-- ----- foods: 인증된 사용자 누구나 읽기 가능, 쓰기는 service_role만 -----
CREATE POLICY "foods_select_authenticated"
  ON public.foods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "foods_insert_service_role"
  ON public.foods FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "foods_update_service_role"
  ON public.foods FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "foods_delete_service_role"
  ON public.foods FOR DELETE
  TO service_role
  USING (true);

-- ----- user_foods: 본인 음식만 CRUD -----
CREATE POLICY "user_foods_select_own"
  ON public.user_foods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_foods_insert_own"
  ON public.user_foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_foods_update_own"
  ON public.user_foods FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_foods_delete_own"
  ON public.user_foods FOR DELETE
  USING (auth.uid() = user_id);

-- ----- favorite_foods: 본인 즐겨찾기만 CRUD -----
CREATE POLICY "favorite_foods_select_own"
  ON public.favorite_foods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorite_foods_insert_own"
  ON public.favorite_foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorite_foods_delete_own"
  ON public.favorite_foods FOR DELETE
  USING (auth.uid() = user_id);
