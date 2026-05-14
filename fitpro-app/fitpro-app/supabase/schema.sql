-- =============================================
-- FITPRO - Schema do banco de dados (Supabase)
-- Cole este SQL no SQL Editor do Supabase
-- =============================================

-- Tabela de perfis (personal e alunos)
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

-- Tabela de treinos
CREATE TABLE treinos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de exercícios dentro de um treino
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

-- Tabela de registros de medidas
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

-- Tabela de alimentos (banco nutricional)
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

-- Tabela de refeições registradas pelo aluno
CREATE TABLE refeicoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  horario TIME,
  tipo_refeicao TEXT DEFAULT 'Refeição',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens de cada refeição
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

-- Profiles: usuário vê o próprio perfil; personal vê seus alunos
CREATE POLICY "Usuário vê próprio perfil" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Personal vê seus alunos" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'personal')
);
CREATE POLICY "Usuário insere próprio perfil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuário atualiza próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Treinos: personal cria/edita; aluno vê os seus
CREATE POLICY "Personal gerencia treinos" ON treinos FOR ALL USING (personal_id = auth.uid());
CREATE POLICY "Aluno vê seus treinos" ON treinos FOR SELECT USING (aluno_id = auth.uid());

-- Exercícios: acompanha o treino
CREATE POLICY "Acesso a exercícios via treino" ON exercicios FOR ALL USING (
  EXISTS (SELECT 1 FROM treinos t WHERE t.id = treino_id AND (t.personal_id = auth.uid() OR t.aluno_id = auth.uid()))
);

-- Medidas: aluno gerencia as próprias; personal do aluno pode ver
CREATE POLICY "Aluno gerencia medidas" ON medidas FOR ALL USING (aluno_id = auth.uid());
CREATE POLICY "Personal vê medidas de seus alunos" ON medidas FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = aluno_id AND p.personal_id = auth.uid())
);

-- Refeições: somente o próprio aluno
CREATE POLICY "Aluno gerencia refeições" ON refeicoes FOR ALL USING (aluno_id = auth.uid());

-- Itens de refeição
CREATE POLICY "Acesso a itens via refeição" ON refeicao_itens FOR ALL USING (
  EXISTS (SELECT 1 FROM refeicoes r WHERE r.id = refeicao_id AND r.aluno_id = auth.uid())
);

-- Alimentos: todos autenticados podem ler
CREATE POLICY "Todos leem alimentos" ON alimentos FOR SELECT USING (auth.role() = 'authenticated');
