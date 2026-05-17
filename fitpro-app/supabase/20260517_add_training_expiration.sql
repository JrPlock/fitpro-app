-- FITPRO - Vencimento/revisão de treinos
-- Execute este arquivo no SQL Editor do Supabase em produção.

BEGIN;

ALTER TABLE public.treinos
ADD COLUMN IF NOT EXISTS data_vencimento DATE;

UPDATE public.treinos
SET data_vencimento = (created_at::date + INTERVAL '45 days')::date
WHERE data_vencimento IS NULL;

COMMIT;
