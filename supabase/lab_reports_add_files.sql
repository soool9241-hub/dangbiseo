-- Add files column to store all uploaded files (images/PDFs) as base64
ALTER TABLE public.lab_reports
  ADD COLUMN IF NOT EXISTS files JSONB NOT NULL DEFAULT '[]'::jsonb;
