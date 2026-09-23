-- TEAM MEMBERS (used by /equipe)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'Analista',
  status TEXT NOT NULL DEFAULT 'Convite pendente',
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT team_members_account_user_key UNIQUE (account_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own team members" ON public.team_members;
CREATE POLICY "own team members" ON public.team_members FOR ALL TO authenticated
  USING ((select auth.uid()) = account_id) WITH CHECK ((select auth.uid()) = account_id);
CREATE INDEX IF NOT EXISTS team_members_account_id_idx ON public.team_members (account_id, created_at);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON public.team_members (user_id);

-- TEAM INVITES
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'Analista',
  status TEXT NOT NULL DEFAULT 'pending',
  token_hash TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own team invites" ON public.team_invites;
CREATE POLICY "own team invites" ON public.team_invites FOR ALL TO authenticated
  USING ((select auth.uid()) = account_id) WITH CHECK ((select auth.uid()) = account_id);
CREATE INDEX IF NOT EXISTS team_invites_account_status_idx ON public.team_invites (account_id, status);
