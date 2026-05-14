import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TreinosPersonalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: treinos } = await supabase
    .from('treinos')
    .select(`
      *,
      profiles!treinos_aluno_id_fkey(nome)
    `)
    .eq('personal_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">🏋️ Treinos</span>
        </div>
        <Link
          href="/dashboard/personal/treinos/novo"
          className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
        >
          + Novo Treino
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-4">
        {(!treinos || treinos.length === 0) ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <div className="text-6xl mb-4">🏋️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum treino criado ainda</h3>
            <p className="text-gray-500 text-sm mb-6">Crie seu primeiro treino e vincule a um aluno</p>
            <Link
              href="/dashboard/personal/treinos/novo"
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              + Criar primeiro treino
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">{treinos.length} treino{treinos.length !== 1 ? 's' : ''} criado{treinos.length !== 1 ? 's' : ''}</p>
            <div className="grid gap-4">
              {treinos.map((treino) => (
                <Link
                  key={treino.id}
                  href={`/dashboard/personal/treinos/${treino.id}`}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                      🏋️
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{treino.nome}</h3>
                      <p className="text-sm text-gray-500">
                        Aluno: <span className="font-medium">{(treino.profiles as any)?.nome || 'Não vinculado'}</span>
                      </p>
                      {treino.descricao && (
                        <p className="text-xs text-gray-400 mt-0.5">{treino.descricao}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${treino.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {treino.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
