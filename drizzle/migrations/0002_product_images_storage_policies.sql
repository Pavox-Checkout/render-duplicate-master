DROP POLICY IF EXISTS "product images select own" ON storage.objects;
CREATE POLICY "product images select own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "product images insert own" ON storage.objects;
CREATE POLICY "product images insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "product images update own" ON storage.objects;
CREATE POLICY "product images update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "product images delete own" ON storage.objects;
CREATE POLICY "product images delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);