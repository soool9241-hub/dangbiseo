-- Lab Reports table for storing scanned medical test results
CREATE TABLE IF NOT EXISTS public.lab_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tested_at DATE NOT NULL,
  hospital_name TEXT,
  image_url TEXT,
  raw_text TEXT,
  lab_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  ai_analysis TEXT,
  ai_recommendations JSONB,
  comparison_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_user_id ON public.lab_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_tested_at ON public.lab_reports(tested_at DESC);

-- Row Level Security
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own lab reports" ON public.lab_reports;
CREATE POLICY "Users can view own lab reports"
  ON public.lab_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own lab reports" ON public.lab_reports;
CREATE POLICY "Users can insert own lab reports"
  ON public.lab_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lab reports" ON public.lab_reports;
CREATE POLICY "Users can update own lab reports"
  ON public.lab_reports FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own lab reports" ON public.lab_reports;
CREATE POLICY "Users can delete own lab reports"
  ON public.lab_reports FOR DELETE
  USING (auth.uid() = user_id);
