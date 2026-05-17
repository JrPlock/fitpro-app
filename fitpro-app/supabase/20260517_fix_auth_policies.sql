-- FITPRO - Correções de autenticação, perfis e RLS
-- Execute este arquivo no SQL Editor do Supabase em produção.

BEGIN;

-- Garante que novos usuários do Supabase Auth tenham um profile correspondente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
BEGIN
  requested_role := COALESCE(new.raw_user_meta_data->>'role', 'aluno');

  IF requested_role NOT IN ('personal', 'aluno') THEN
    requested_role := 'aluno';
  END IF;

  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    new.id,
    COALESCE(NULLIF(new.raw_user_meta_data->>'nome', ''), split_part(new.email, '@', 1)),
    new.email,
    requested_role
  )
  ON CONFLICT (id) DO UPDATE
    SET nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        role = EXCLUDED.role;

  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recria as policies para evitar nomes antigos com encoding diferente.
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'treinos', 'exercicios', 'medidas', 'refeicoes', 'refeicao_itens', 'alimentos')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  END LOOP;
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refeicao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_or_students"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR (
    role = 'aluno'
    AND (
      personal_id = auth.uid()
      OR personal_id IS NULL
    )
    AND public.current_user_role() = 'personal'
  )
);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_personal_link_students"
ON public.profiles
FOR UPDATE
USING (
  role = 'aluno'
  AND (personal_id IS NULL OR personal_id = auth.uid())
  AND public.current_user_role() = 'personal'
)
WITH CHECK (
  role = 'aluno'
  AND (personal_id IS NULL OR personal_id = auth.uid())
);

CREATE POLICY "treinos_personal_manage"
ON public.treinos
FOR ALL
USING (personal_id = auth.uid())
WITH CHECK (
  personal_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.profiles aluno
    WHERE aluno.id = aluno_id
      AND aluno.role = 'aluno'
      AND aluno.personal_id = auth.uid()
  )
);

CREATE POLICY "treinos_aluno_select"
ON public.treinos
FOR SELECT
USING (aluno_id = auth.uid());

CREATE POLICY "exercicios_access_via_treino"
ON public.exercicios
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.treinos treino
    WHERE treino.id = treino_id
      AND (treino.personal_id = auth.uid() OR treino.aluno_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.treinos treino
    WHERE treino.id = treino_id
      AND treino.personal_id = auth.uid()
  )
);

CREATE POLICY "medidas_aluno_manage"
ON public.medidas
FOR ALL
USING (aluno_id = auth.uid())
WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "medidas_personal_select"
ON public.medidas
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles aluno
    WHERE aluno.id = aluno_id
      AND aluno.personal_id = auth.uid()
  )
);

CREATE POLICY "refeicoes_aluno_manage"
ON public.refeicoes
FOR ALL
USING (aluno_id = auth.uid())
WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "refeicao_itens_access_via_refeicao"
ON public.refeicao_itens
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.refeicoes refeicao
    WHERE refeicao.id = refeicao_id
      AND refeicao.aluno_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.refeicoes refeicao
    WHERE refeicao.id = refeicao_id
      AND refeicao.aluno_id = auth.uid()
  )
);

CREATE POLICY "alimentos_authenticated_select"
ON public.alimentos
FOR SELECT
USING (auth.role() = 'authenticated');

COMMIT;
