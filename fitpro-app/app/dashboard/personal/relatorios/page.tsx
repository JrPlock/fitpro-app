import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RelatoriosPersonalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: alunos } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'aluno')
    .eq('personal_id', user.id)
    .order('nome')

  const alunosComInfo = await Promise.all(
    (alunos || []).map(async (aluno) => {
      const [{ data: medidas }, { data: treinos }] = await Promise.all([
        supabase.from('medidas').select('data, peso').eq('aluno_id', aluno.id).order('data', { ascending: false }).limit(1),
        supabase.from('treinos').select('id').eq('aluno_id', aluno.id).eq('ativo', true),
      ])
      return { ...aluno, ultimaMedida: medidas?.[0], treinosAtivos: treinos?.length || 0 }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard/personal" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <span className="font-bold text-gray-900">📊 Relatórios</span>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-4">

        <p className="text-sm text-gray-500">Selecione um aluno para gerar o relatório completo</p>

        {(!alunos || alunos.length === 0) ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-gray-500 text-sm">Você ainda não tem alunos vinculados.</p>
            <Link href="/dashboard/personal/alunos/adicionar" className="inline-block mt-4 px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
              + Vincular aluno
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {alunosComInfo.map(aluno => (
              <div key={aluno.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
                    {aluno.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{aluno.nome}</div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>🏋️ {aluno.treinosAtivos} treino{aluno.treinosAtivos !== 1 ? 's' : ''} ativo{aluno.treinosAtivos !== 1 ? 's' : ''}</span>
                      {aluno.ultimaMedida ? (
                        <span>⚖️ Última avaliação: {new Date(aluno.ultimaMedida.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      ) : (
                        <span className="text-orange-400">⚠️ Sem avaliações</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/personal/alunos/${aluno.id}/avaliacoes`}
                    className="px-3 py-2 bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl hover:bg-purple-200 transition-colors">
                    📏 Avaliações
                  </Link>
                  <Link href={`/dashboard/personal/alunos/${aluno.id}/relatorio`}
                    className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                    📊 Relatório
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
