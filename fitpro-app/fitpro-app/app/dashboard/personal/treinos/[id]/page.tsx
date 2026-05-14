import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TreinoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: treino } = await supabase
    .from('treinos')
    .select(`*, profiles!treinos_aluno_id_fkey(nome, email)`)
    .eq('id', id)
    .eq('personal_id', user.id)
    .single()

  if (!treino) redirect('/dashboard/personal/treinos')

  const { data: exercicios } = await supabase
    .from('exercicios')
    .select('*')
    .eq('treino_id', id)
    .order('ordem')

  const aluno = treino.profiles as any

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal/treinos" className="text-gray-400 hover:text-gray-600 text-sm">← Treinos</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900 truncate max-w-xs">{treino.nome}</span>
        </div>
        <Link
          href={`/dashboard/personal/treinos/${id}/editar`}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          ✏️ Editar
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header do treino */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{treino.nome}</h1>
              {treino.objetivo && (
                <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  {treino.objetivo}
                </span>
              )}
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${treino.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {treino.ativo ? '✅ Ativo' : '⏸ Inativo'}
            </span>
          </div>

          {treino.descricao && (
            <p className="text-gray-600 text-sm bg-gray-50 rounded-xl p-3">{treino.descricao}</p>
          )}

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
              {aluno?.nome?.charAt(0) || '?'}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{aluno?.nome || 'Sem aluno vinculado'}</div>
              {aluno?.email && <div className="text-xs text-gray-500">{aluno.email}</div>}
            </div>
          </div>
        </div>

        {/* Exercícios */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-lg">
              💪 Exercícios <span className="text-gray-400 font-normal text-base">({exercicios?.length || 0})</span>
            </h2>
          </div>

          {(!exercicios || exercicios.length === 0) ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
              <p>Nenhum exercício adicionado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercicios.map((ex, i) => (
                <div key={ex.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base">{ex.nome}</h3>
                      <div className="flex gap-4 mt-2">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-700">{ex.series}</div>
                          <div className="text-xs text-gray-500">Séries</div>
                        </div>
                        <div className="w-px bg-gray-100" />
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-700">{ex.repeticoes}</div>
                          <div className="text-xs text-gray-500">Reps</div>
                        </div>
                        <div className="w-px bg-gray-100" />
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-700">
                            {ex.descanso_segundos >= 60 ? `${Math.floor(ex.descanso_segundos / 60)}min` : `${ex.descanso_segundos}s`}
                          </div>
                          <div className="text-xs text-gray-500">Descanso</div>
                        </div>
                      </div>
                      {ex.observacoes && (
                        <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                          💬 {ex.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
