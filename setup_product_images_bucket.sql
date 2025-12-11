-- Setup product-images bucket policies
-- Run this in Supabase SQL Editor
-- 1. Allow public to read/view images
CREATE POLICY "Public can view product images" ON storage.objects FOR
SELECT USING (bucket_id = 'product-images');
-- 2. Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
-- 3. Allow authenticated users to update images
CREATE POLICY "Authenticated users can update product images" ON storage.objects FOR
UPDATE TO authenticated USING (bucket_id = 'product-images');
-- 4. Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');
-- Verify policies
SELECT *
FROM pg_policies
WHERE tablename = 'objects'
    AND policyname LIKE '%product%';