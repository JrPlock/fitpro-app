-- FITPRO - Status de execução e motivo para exercício não feito
-- Execute este arquivo no SQL Editor do Supabase em produção.

BEGIN;

ALTER TABLE public.registros_exercicios
ADD COLUMN IF NOT EXISTS status_execucao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_execucao IN ('pendente', 'feito', 'nao_feito')),
ADD COLUMN IF NOT EXISTS motivo_nao_feito TEXT;

UPDATE public.registros_exercicios
SET status_execucao = CASE
  WHEN concluido THEN 'feito'
  ELSE 'pendente'
END
WHERE status_execucao = 'pendente';

COMMIT;
