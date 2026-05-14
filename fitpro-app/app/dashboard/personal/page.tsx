import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPersonal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: alunos } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'aluno')
    .eq('personal_id', user.id)

  const totalAlunos = alunos?.length || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💪</span>
          <span className="font-bold text-gray-900 text-lg">FitPro</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Personal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Olá, <strong>{profile?.nome || 'Personal'}</strong></span>
          <LogoutButton />
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Alunos ativos', value: totalAlunos, icon: '👥', color: 'bg-blue-50 text-blue-700' },
            { label: 'Treinos criados', value: 0, icon: '🏋️', color: 'bg-green-50 text-green-700' },
            { label: 'Avaliações este mês', value: 0, icon: '📊', color: 'bg-purple-50 text-purple-700' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl ${stat.color} mb-3`}>
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Novo treino', icon: '➕', href: '/dashboard/personal/treinos/novo', color: 'bg-green-600 hover:bg-green-700' },
              { label: 'Ver alunos', icon: '👥', href: '/dashboard/personal/alunos', color: 'bg-blue-600 hover:bg-blue-700' },
              { label: 'Avaliações', icon: '📏', href: '/dashboard/personal/avaliacoes', color: 'bg-purple-600 hover:bg-purple-700' },
              { label: 'Relatórios', icon: '📊', href: '/dashboard/personal/relatorios', color: 'bg-orange-600 hover:bg-orange-700' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className={`${action.color} text-white rounded-2xl p-4 text-center transition-colors`}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="text-sm font-medium">{action.label}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Alunos list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Seus alunos</h2>
            <a href="/dashboard/personal/alunos/adicionar" className="text-sm text-green-600 font-medium hover:underline">
              + Adicionar aluno
            </a>
          </div>

          {totalAlunos === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum aluno ainda</h3>
              <p className="text-sm text-gray-500 mb-4">Adicione seu primeiro aluno para começar</p>
              <a
                href="/dashboard/personal/alunos/adicionar"
                className="inline-flex px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
              >
                Adicionar aluno
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {alunos?.map((aluno) => (
                <div key={aluno.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-semibold">
                      {aluno.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{aluno.nome}</div>
                      <div className="text-sm text-gray-500">{aluno.email}</div>
                    </div>
                  </div>
                  <a
                    href={`/dashboard/personal/alunos/${aluno.id}`}
                    className="text-sm text-green-600 font-medium hover:underline"
                  >
                    Ver perfil →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
