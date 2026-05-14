import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AvaliacoesPersonalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: alunos } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'aluno')
    .eq('personal_id', user.id)
    .order('nome')

  // Busca última medida de cada aluno
  const alunosComMedidas = await Promise.all(
    (alunos || []).map(async (aluno) => {
      const { data: medidas } = await supabase
        .from('medidas')
        .select('*')
        .eq('aluno_id', aluno.id)
        .order('data', { ascending: false })
        .limit(2)

      const ultima = medidas?.[0]
      const anterior = medidas?.[1]
      const diasSemAvaliacao = ultima
        ? Math.floor((Date.now() - new Date(ultima.data).getTime()) / (1000 * 60 * 60 * 24))
        : null

      return { ...aluno, ultima, anterior, diasSemAvaliacao, totalMedidas: medidas?.length || 0 }
    })
  )

  const semAvaliacao = alunosComMedidas.filter(a => !a.ultima)
  const comAvaliacao = alunosComMedidas.filter(a => a.ultima).sort((a, b) => (b.diasSemAvaliacao ?? 0) - (a.diasSemAvaliacao ?? 0))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard/personal" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <span className="font-bold text-gray-900">📏 Avaliações dos Alunos</span>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-6">

        {(!alunos || alunos.length === 0) ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <div className="text-5xl mb-3">📏</div>
            <p className="text-gray-500 text-sm">Você ainda não tem alunos vinculados.</p>
            <Link href="/dashboard/personal/alunos/adicionar" className="inline-block mt-4 px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
              + Vincular aluno
            </Link>
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total de alunos', value: alunos.length, icon: '👥', cor: 'bg-blue-50 text-blue-700' },
                { label: 'Com avaliação', value: comAvaliacao.length, icon: '✅', cor: 'bg-green-50 text-green-700' },
                { label: 'Sem avaliação', value: semAvaliacao.length, icon: '⚠️', cor: 'bg-red-50 text-red-700' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl ${c.cor} mb-2`}>{c.icon}</div>
                  <div className="text-3xl font-bold text-gray-900">{c.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Alunos sem nenhuma avaliação */}
            {semAvaliacao.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
                <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
                  <h2 className="font-semibold text-orange-800">⚠️ Alunos sem nenhuma avaliação</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {semAvaliacao.map(aluno => (
                    <div key={aluno.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold">
                          {aluno.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{aluno.nome}</div>
                          <div className="text-xs text-gray-400">Nenhuma avaliação registrada</div>
                        </div>
                      </div>
                      <Link href={`/dashboard/personal/alunos/${aluno.id}`}
                        className="text-sm text-orange-600 font-medium hover:underline">
                        Ver perfil →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alunos com avaliação */}
            {comAvaliacao.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">📋 Histórico de avaliações</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {comAvaliacao.map(aluno => {
                    const varPeso = aluno.ultima?.peso && aluno.anterior?.peso
                      ? (aluno.ultima.peso - aluno.anterior.peso).toFixed(1)
                      : null
                    const atrasado = (aluno.diasSemAvaliacao ?? 0) > 30

                    return (
                      <div key={aluno.id} className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                            {aluno.nome?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{aluno.nome}</span>
                              {atrasado && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">+30 dias</span>}
                            </div>
                            <div className="text-xs text-gray-400">
                              Última: {new Date(aluno.ultima.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                              {' '}· {aluno.diasSemAvaliacao} dias atrás
                              {' '}· {aluno.totalMedidas} avaliações no total
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            {aluno.ultima.peso && (
                              <div className="text-sm font-semibold text-gray-900">{aluno.ultima.peso} kg</div>
                            )}
                            {varPeso && (
                              <div className={`text-xs font-medium ${parseFloat(varPeso) < 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {parseFloat(varPeso) > 0 ? '+' : ''}{varPeso} kg
                              </div>
                            )}
                          </div>
                          <Link href={`/dashboard/personal/alunos/${aluno.id}/avaliacoes`}
                            className="text-sm text-purple-600 font-medium hover:underline whitespace-nowrap">
                            Ver gráficos →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
