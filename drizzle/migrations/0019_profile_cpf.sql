-- CPF cadastral opcional para contas existentes, mas único quando informado.
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

NOTIFY pgrst, 'reload schema';
