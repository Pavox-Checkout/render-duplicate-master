-- Garante que a persistência do CPF use a coluna correta e o isolamento existente do perfil.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_cpf_format'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_cpf_format CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_cpf_key'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_cpf_key UNIQUE (cpf);
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

NOTIFY pgrst, 'reload schema';

-- Atualiza o schema cache para clientes REST que já estavam conectados.
