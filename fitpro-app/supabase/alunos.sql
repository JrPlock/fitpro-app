-- Permite personal vincular/desvincular alunos
-- Cole numa aba nova do SQL Editor

CREATE POLICY "Personal vincula aluno" ON profiles
  FOR UPDATE USING (
    auth.uid() != id AND
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'personal')
  )
  WITH CHECK (true);
