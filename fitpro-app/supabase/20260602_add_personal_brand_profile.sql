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
  SELECT COALESCE(
    (
      SELECT personal_id
      FROM public.profiles
      WHERE id = auth.uid()
    ),
    (
      SELECT personal_id
      FROM public.pacotes_alunos
      WHERE aluno_id = auth.uid()
        AND status = 'ativo'
      ORDER BY created_at DESC
      LIMIT 1
    ),
    (
      SELECT personal_id
      FROM public.pacotes_alunos
      WHERE aluno_id = auth.uid()
      ORDER BY created_at DESC
      LIMIT 1
    )
  )
$$;

DROP POLICY IF EXISTS "profiles_aluno_select_personal" ON public.profiles;

CREATE POLICY "profiles_aluno_select_personal"
ON public.profiles
FOR SELECT
USING (
  role = 'personal'
  AND id = public.current_user_personal_id()
);

CREATE OR REPLACE FUNCTION public.get_student_personal_profile()
RETURNS TABLE (
  id uuid,
  nome text,
  avatar_url text,
  logo_url text,
  telefone text,
  whatsapp text,
  instagram text,
  site text,
  bio text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    personal.id,
    personal.nome,
    personal.avatar_url,
    personal.logo_url,
    personal.telefone,
    personal.whatsapp,
    personal.instagram,
    personal.site,
    personal.bio
  FROM public.profiles personal
  WHERE personal.id = public.current_user_personal_id()
    AND personal.role = 'personal'
  LIMIT 1
$$;

COMMIT;
