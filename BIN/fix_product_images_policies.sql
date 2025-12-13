-- Fix product-images bucket policies
-- Delete old policies and create new ones for anon users
-- 1. Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
-- 2. Allow ANYONE (anon) to upload images
CREATE POLICY "Anyone can upload product images" ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'product-images');
-- 3. Allow ANYONE (anon) to view images  
CREATE POLICY "Anyone can view product images" ON storage.objects FOR
SELECT USING (bucket_id = 'product-images');
-- 4. Allow ANYONE (anon) to delete images
CREATE POLICY "Anyone can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');
-- Verify
SELECT schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
    AND policyname LIKE '%product%';