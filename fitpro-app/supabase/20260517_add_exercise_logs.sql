-- FITPRO - Registros de execução por exercício
-- Execute este arquivo no SQL Editor do Supabase em produção.

BEGIN;

CREATE TABLE IF NOT EXISTS public.registros_exercicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treino_id UUID REFERENCES public.treinos(id) ON DELETE CASCADE NOT NULL,
  exercicio_id UUID REFERENCES public.exercicios(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  concluido BOOLEAN NOT NULL DEFAULT false,
  peso NUMERIC(7,2),
  dor TEXT NOT NULL DEFAULT 'nao' CHECK (dor IN ('nao', 'leve', 'moderada', 'forte')),
  dificuldade INTEGER CHECK (dificuldade IS NULL OR dificuldade BETWEEN 1 AND 10),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aluno_id, exercicio_id, data)
);

ALTER TABLE public.registros_exercicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registros_aluno_manage" ON public.registros_exercicios;
DROP POLICY IF EXISTS "registros_personal_select" ON public.registros_exercicios;

CREATE POLICY "registros_aluno_manage"
ON public.registros_exercicios
FOR ALL
USING (aluno_id = auth.uid())
WITH CHECK (
  aluno_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.treinos treino
    WHERE treino.id = treino_id
      AND treino.aluno_id = auth.uid()
  )
);

CREATE POLICY "registros_personal_select"
ON public.registros_exercicios
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.treinos treino
    WHERE treino.id = treino_id
      AND treino.personal_id = auth.uid()
  )
);

COMMIT;
