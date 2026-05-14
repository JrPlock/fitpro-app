import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DesvincularButton from './DesvincularButton'

export default async function AlunoPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: aluno } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('personal_id', user.id)
    .single()

  if (!aluno) redirect('/dashboard/personal/alunos')

  const [{ data: treinos }, { data: medidas }] = await Promise.all([
    supabase.from('treinos').select('*').eq('aluno_id', id).eq('personal_id', user.id).order('created_at', { ascending: false }),
    supabase.from('medidas').select('*').eq('aluno_id', id).order('data', { ascending: false }).limit(5),
  ])

  const ultimaMedida = medidas?.[0]
  const medidaAnterior = medidas?.[1]

  function variacaoPeso() {
    if (!ultimaMedida?.peso || !medidaAnterior?.peso) return null
    return (ultimaMedida.peso - medidaAnterior.peso).toFixed(1)
  }

  const variacao = variacaoPeso()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal/alunos" className="text-gray-400 hover:text-gray-600 text-sm">← Alunos</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900 truncate">{aluno.nome}</span>
        </div>
        <DesvincularButton alunoId={id} alunoNome={aluno.nome} />
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Header do aluno */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-2xl">
              {aluno.nome?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{aluno.nome}</h1>
              <p className="text-gray-500 text-sm">{aluno.email}</p>
              {aluno.telefone && <p className="text-gray-400 text-sm">{aluno.telefone}</p>}
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{treinos?.length || 0}</div>
              <div className="text-xs text-gray-500">Treinos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{medidas?.length || 0}</div>
              <div className="text-xs text-gray-500">Avaliações</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${variacao && parseFloat(variacao) < 0 ? 'text-green-600' : variacao && parseFloat(variacao) > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                {ultimaMedida?.peso ? `${ultimaMedida.peso}kg` : '—'}
              </div>
              <div className="text-xs text-gray-500">
                Peso atual {variacao ? `(${parseFloat(variacao) > 0 ? '+' : ''}${variacao}kg)` : ''}
              </div>
            </div>
          </div>
        </div>
        {/* Ações rápidas */}
<div className="flex gap-3 mt-4">
  <Link href={`/dashboard/personal/alunos/${id}/avaliacoes`}
    className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors text-center text-sm">
    📏 Ver avaliações
  </Link>
  <Link href={`/dashboard/personal/alunos/${id}/relatorio`}
    className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-center text-sm">
    📊 Relatório completo
  </Link>
  <Link href={`/dashboard/personal/treinos/novo?aluno=${id}`}
    className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors text-center text-sm">
    🏋️ Novo treino
  </Link>
</div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Treinos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">🏋️ Treinos</h2>
              <Link href={`/dashboard/personal/treinos/novo?aluno=${id}`}
                className="text-xs text-green-600 font-medium hover:underline">
                + Novo treino
              </Link>
            </div>
            {(!treinos || treinos.length === 0) ? (
              <div className="p-6 text-center text-gray-400 text-sm">Nenhum treino criado ainda</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {treinos.map(t => (
                  <Link key={t.id} href={`/dashboard/personal/treinos/${t.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t.nome}</div>
                      {t.objetivo && <div className="text-xs text-gray-400">{t.objetivo}</div>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${t.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {t.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Medidas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">📏 Avaliações</h2>
            </div>
            {(!medidas || medidas.length === 0) ? (
              <div className="p-6 text-center text-gray-400 text-sm">Nenhuma avaliação registrada</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {medidas.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      {m.observacoes && <div className="text-xs text-gray-400 truncate max-w-36">{m.observacoes}</div>}
                    </div>
                    <div className="text-right">
                      {m.peso && <div className="text-sm font-semibold text-gray-900">{m.peso} kg</div>}
                      {m.percentual_gordura && <div className="text-xs text-gray-400">{m.percentual_gordura}% gord.</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Últimas medidas detalhadas */}
        {ultimaMedida && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">📐 Última avaliação detalhada</h2>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {[
                ['Peso', ultimaMedida.peso, 'kg'],
                ['Altura', ultimaMedida.altura, 'cm'],
                ['% Gordura', ultimaMedida.percentual_gordura, '%'],
                ['Cintura', ultimaMedida.cintura, 'cm'],
                ['Quadril', ultimaMedida.quadril, 'cm'],
                ['Braço D', ultimaMedida.braco_dir, 'cm'],
              ].filter(([, v]) => v).map(([label, value, unit]) => (
                <div key={label as string} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-400">{unit}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
