-- Private bucket for product images (served through signed URLs; policies in 0002)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', false, 10485760)
ON CONFLICT (id) DO NOTHING;
