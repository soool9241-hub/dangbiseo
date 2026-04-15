-- Supabase Storage: meal-photos 버킷 생성
-- 식단 사진을 날짜별로 저장 (user_id/YYYY/MM/DD/timestamp.jpg)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-photos',
  'meal-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자: 자신의 폴더에만 업로드 가능
CREATE POLICY "Users can upload meal photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 인증된 사용자: 자신의 사진만 조회 가능
CREATE POLICY "Users can view own meal photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 인증된 사용자: 자신의 사진만 삭제 가능
CREATE POLICY "Users can delete own meal photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 공개 읽기 (photo_url로 직접 접근 가능)
CREATE POLICY "Public read meal photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'meal-photos');
