-- Expand products for the full Produtos module
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'fisico',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sku TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS barcode TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS promotional_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS cost NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS main_image TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS inventory_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allow_backorder BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS minimum_stock INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS length NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS width NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS height NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS digital_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS digital_file TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS digital_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  sku TEXT NOT NULL DEFAULT '',
  barcode TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  promotional_price NUMERIC(12,2),
  inventory_quantity INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC(10,3),
  image TEXT NOT NULL DEFAULT '',
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Ativo',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own product variants" ON public.product_variants;
CREATE POLICY "own product variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS products_user_id_idx ON public.products(user_id);