-- FITPRO - Pacotes ativos de alunos
-- Execute este arquivo no SQL Editor do Supabase em produção.

BEGIN;

CREATE TABLE IF NOT EXISTS public.pacotes_alunos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tipo_atendimento TEXT NOT NULL DEFAULT 'presencial' CHECK (tipo_atendimento IN ('presencial', 'online', 'hibrido')),
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  sessoes_semana INTEGER CHECK (sessoes_semana IS NULL OR sessoes_semana BETWEEN 0 AND 14),
  dias_treino TEXT[] DEFAULT '{}',
  valor_mensal NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'cancelado')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS pacotes_alunos_um_ativo_por_aluno
ON public.pacotes_alunos (aluno_id)
WHERE status = 'ativo';

ALTER TABLE public.pacotes_alunos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pacotes_select_personal_or_aluno" ON public.pacotes_alunos;
DROP POLICY IF EXISTS "pacotes_personal_insert" ON public.pacotes_alunos;
DROP POLICY IF EXISTS "pacotes_personal_update" ON public.pacotes_alunos;
DROP POLICY IF EXISTS "pacotes_personal_delete" ON public.pacotes_alunos;

CREATE POLICY "pacotes_select_personal_or_aluno"
ON public.pacotes_alunos
FOR SELECT
USING (personal_id = auth.uid() OR aluno_id = auth.uid());

CREATE POLICY "pacotes_personal_insert"
ON public.pacotes_alunos
FOR INSERT
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

CREATE POLICY "pacotes_personal_update"
ON public.pacotes_alunos
FOR UPDATE
USING (personal_id = auth.uid())
WITH CHECK (personal_id = auth.uid());

CREATE POLICY "pacotes_personal_delete"
ON public.pacotes_alunos
FOR DELETE
USING (personal_id = auth.uid());

COMMIT;
