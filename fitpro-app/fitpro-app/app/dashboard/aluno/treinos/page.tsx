import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TreinosAlunoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: treinos } = await supabase
    .from('treinos')
    .select('*')
    .eq('aluno_id', user.id)
    .eq('ativo', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard/aluno" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        <span className="text-gray-300">|</span>
        <span className="font-bold text-gray-900">🏋️ Meus Treinos</span>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-4">
        {(!treinos || treinos.length === 0) ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <div className="text-6xl mb-4">🏋️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum treino disponível</h3>
            <p className="text-gray-500 text-sm">Seu personal ainda não enviou treinos para você.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">{treinos.length} treino{treinos.length !== 1 ? 's' : ''} disponíve{treinos.length !== 1 ? 'is' : 'l'}</p>
            <div className="grid gap-4">
              {treinos.map((treino) => (
                <Link
                  key={treino.id}
                  href={`/dashboard/aluno/treinos/${treino.id}`}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                      🏋️
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{treino.nome}</h3>
                      {treino.objetivo && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {treino.objetivo}
                        </span>
                      )}
                      {treino.descricao && (
                        <p className="text-sm text-gray-500 mt-1">{treino.descricao}</p>
                      )}
                    </div>
                    <span className="text-green-600 text-xl">→</span>
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
