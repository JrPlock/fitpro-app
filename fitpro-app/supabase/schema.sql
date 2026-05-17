-- =============================================
-- FITPRO - Schema do banco de dados (Supabase)
-- Cole este SQL no SQL Editor do Supabase para criar o banco do zero.
-- Para bancos já em produção, use também as migrações versionadas desta pasta.
-- =============================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('personal', 'aluno')),
  personal_id UUID REFERENCES profiles(id),
  avatar_url TEXT,
  telefone TEXT,
  data_nascimento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE treinos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  ativo BOOLEAN DEFAULT true,
  data_vencimento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exercicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treino_id UUID REFERENCES treinos(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  series INTEGER NOT NULL DEFAULT 3,
  repeticoes TEXT NOT NULL DEFAULT '10-12',
  descanso_segundos INTEGER DEFAULT 60,
  observacoes TEXT,
  video_url TEXT,
  ordem INTEGER DEFAULT 0
);

CREATE TABLE medidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  peso NUMERIC(5,2),
  altura NUMERIC(5,2),
  percentual_gordura NUMERIC(5,2),
  braco_dir NUMERIC(5,2),
  braco_esq NUMERIC(5,2),
  peitoral NUMERIC(5,2),
  abdomen NUMERIC(5,2),
  cintura NUMERIC(5,2),
  quadril NUMERIC(5,2),
  coxa_dir NUMERIC(5,2),
  coxa_esq NUMERIC(5,2),
  panturrilha_dir NUMERIC(5,2),
  panturrilha_esq NUMERIC(5,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  porcao_gramas NUMERIC(7,2) DEFAULT 100,
  calorias NUMERIC(7,2),
  proteinas NUMERIC(7,2),
  carboidratos NUMERIC(7,2),
  gorduras NUMERIC(7,2),
  fibras NUMERIC(7,2),
  fonte TEXT DEFAULT 'manual'
);

CREATE TABLE refeicoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  horario TIME,
  tipo_refeicao TEXT DEFAULT 'Refeição',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE refeicao_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  refeicao_id UUID REFERENCES refeicoes(id) ON DELETE CASCADE NOT NULL,
  alimento_id UUID REFERENCES alimentos(id),
  nome_manual TEXT,
  quantidade_gramas NUMERIC(7,2) NOT NULL,
  calorias NUMERIC(7,2),
  proteinas NUMERIC(7,2),
  carboidratos NUMERIC(7,2),
  gorduras NUMERIC(7,2)
);

CREATE TABLE pacotes_alunos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

CREATE UNIQUE INDEX pacotes_alunos_um_ativo_por_aluno
ON pacotes_alunos (aluno_id)
WHERE status = 'ativo';

CREATE TABLE registros_exercicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  treino_id UUID REFERENCES treinos(id) ON DELETE CASCADE NOT NULL,
  exercicio_id UUID REFERENCES exercicios(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  concluido BOOLEAN NOT NULL DEFAULT false,
  status_execucao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_execucao IN ('pendente', 'feito', 'nao_feito')),
  peso NUMERIC(7,2),
  dor TEXT NOT NULL DEFAULT 'nao' CHECK (dor IN ('nao', 'leve', 'moderada', 'forte')),
  dificuldade INTEGER CHECK (dificuldade IS NULL OR dificuldade BETWEEN 1 AND 10),
  observacoes TEXT,
  motivo_nao_feito TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aluno_id, exercicio_id, data)
);

-- =============================================
-- AUTOMAÇÃO DE PERFIL
-- =============================================

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

-- =============================================
-- SEGURANÇA: Row Level Security (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE medidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE refeicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE refeicao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE alimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacotes_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_exercicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_or_students" ON profiles
FOR SELECT USING (
  auth.uid() = id
  OR (
    role = 'aluno'
    AND (personal_id = auth.uid() OR personal_id IS NULL)
    AND public.current_user_role() = 'personal'
  )
);

CREATE POLICY "profiles_insert_own" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_personal_link_students" ON profiles
FOR UPDATE USING (
  role = 'aluno'
  AND (personal_id IS NULL OR personal_id = auth.uid())
  AND public.current_user_role() = 'personal'
)
WITH CHECK (
  role = 'aluno'
  AND (personal_id IS NULL OR personal_id = auth.uid())
);

CREATE POLICY "treinos_personal_manage" ON treinos
FOR ALL USING (personal_id = auth.uid())
WITH CHECK (
  personal_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM profiles aluno
    WHERE aluno.id = aluno_id
      AND aluno.role = 'aluno'
      AND aluno.personal_id = auth.uid()
  )
);

CREATE POLICY "treinos_aluno_select" ON treinos
FOR SELECT USING (aluno_id = auth.uid());

CREATE POLICY "exercicios_access_via_treino" ON exercicios
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM treinos treino
    WHERE treino.id = treino_id
      AND (treino.personal_id = auth.uid() OR treino.aluno_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM treinos treino
    WHERE treino.id = treino_id
      AND treino.personal_id = auth.uid()
  )
);

CREATE POLICY "medidas_aluno_manage" ON medidas
FOR ALL USING (aluno_id = auth.uid())
WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "medidas_personal_select" ON medidas
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM profiles aluno
    WHERE aluno.id = aluno_id
      AND aluno.personal_id = auth.uid()
  )
);

CREATE POLICY "refeicoes_aluno_manage" ON refeicoes
FOR ALL USING (aluno_id = auth.uid())
WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "refeicao_itens_access_via_refeicao" ON refeicao_itens
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM refeicoes refeicao
    WHERE refeicao.id = refeicao_id
      AND refeicao.aluno_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM refeicoes refeicao
    WHERE refeicao.id = refeicao_id
      AND refeicao.aluno_id = auth.uid()
  )
);

CREATE POLICY "alimentos_authenticated_select" ON alimentos
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pacotes_select_personal_or_aluno" ON pacotes_alunos
FOR SELECT USING (personal_id = auth.uid() OR aluno_id = auth.uid());

CREATE POLICY "pacotes_personal_insert" ON pacotes_alunos
FOR INSERT WITH CHECK (
  personal_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM profiles aluno
    WHERE aluno.id = aluno_id
      AND aluno.role = 'aluno'
      AND aluno.personal_id = auth.uid()
  )
);

CREATE POLICY "pacotes_personal_update" ON pacotes_alunos
FOR UPDATE USING (personal_id = auth.uid())
WITH CHECK (personal_id = auth.uid());

CREATE POLICY "pacotes_personal_delete" ON pacotes_alunos
FOR DELETE USING (personal_id = auth.uid());

CREATE POLICY "registros_aluno_manage" ON registros_exercicios
FOR ALL USING (aluno_id = auth.uid())
WITH CHECK (
  aluno_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM treinos treino
    WHERE treino.id = treino_id
      AND treino.aluno_id = auth.uid()
  )
);

CREATE POLICY "registros_personal_select" ON registros_exercicios
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM treinos treino
    WHERE treino.id = treino_id
      AND treino.personal_id = auth.uid()
  )
);
