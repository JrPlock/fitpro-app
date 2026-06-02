-- FITPRO - Perfil publico e marca do personal
-- Execute este arquivo no SQL Editor do Supabase em producao.

BEGIN;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS site TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE OR REPLACE FUNCTION public.current_user_personal_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT personal_id
  FROM public.profiles
  WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "profiles_aluno_select_personal" ON public.profiles;

CREATE POLICY "profiles_aluno_select_personal"
ON public.profiles
FOR SELECT
USING (
  role = 'personal'
  AND id = public.current_user_personal_id()
);

COMMIT;
