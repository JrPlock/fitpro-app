import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AlunosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: alunos } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'aluno')
    .eq('personal_id', user.id)
    .order('nome')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">👥 Meus Alunos</span>
        </div>
        <Link href="/dashboard/personal/alunos/adicionar"
          className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
          + Vincular aluno
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-4">
        {(!alunos || alunos.length === 0) ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum aluno vinculado</h3>
            <p className="text-gray-500 text-sm mb-6">Vincule seu primeiro aluno pelo e-mail cadastrado</p>
            <Link href="/dashboard/personal/alunos/adicionar"
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors text-sm">
              + Vincular aluno
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">{alunos.length} aluno{alunos.length !== 1 ? 's' : ''} na sua carteira</p>
            <div className="grid gap-3">
              {alunos.map((aluno) => (
                <Link key={aluno.id} href={`/dashboard/personal/alunos/${aluno.id}`}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg">
                      {aluno.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{aluno.nome}</div>
                      <div className="text-sm text-gray-500">{aluno.email}</div>
                      {aluno.data_nascimento && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date().getFullYear() - new Date(aluno.data_nascimento).getFullYear()} anos
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="text-green-600 font-medium">Ver perfil →</span>
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
