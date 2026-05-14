import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardAluno() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: treinos } = await supabase
    .from('treinos')
    .select('*')
    .eq('aluno_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: ultimaMedida } = await supabase
    .from('medidas')
    .select('*')
    .eq('aluno_id', user.id)
    .order('data', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💪</span>
          <span className="font-bold text-gray-900 text-lg">FitPro</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Aluno</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Olá, <strong>{profile?.nome || 'Aluno'}</strong></span>
          <LogoutButton />
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Cards de acesso rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Meus Treinos', icon: '🏋️', href: '/dashboard/aluno/treinos', color: 'bg-green-600' },
            { label: 'Medidas', icon: '📏', href: '/dashboard/aluno/medidas', color: 'bg-blue-600' },
            { label: 'Nutrição', icon: '🥗', href: '/dashboard/aluno/nutricao', color: 'bg-orange-500' },
            { label: 'Evolução', icon: '📈', href: '/dashboard/aluno/evolucao', color: 'bg-purple-600' },
          ].map((card) => (
            <a
              key={card.label}
              href={card.href}
              className={`${card.color} text-white rounded-2xl p-5 text-center hover:opacity-90 transition-opacity`}
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="text-sm font-semibold">{card.label}</div>
            </a>
          ))}
        </div>

        {/* Última medida */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📏 Última avaliação</h2>
          {ultimaMedida ? (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Peso', value: `${ultimaMedida.peso} kg` },
                { label: 'Altura', value: `${ultimaMedida.altura} cm` },
                { label: 'Data', value: new Date(ultimaMedida.data).toLocaleDateString('pt-BR') },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-xl font-bold text-gray-900">{item.value}</div>
                  <div className="text-sm text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">Nenhuma medida registrada ainda</p>
              <a href="/dashboard/aluno/medidas/nova" className="text-green-600 text-sm font-medium hover:underline mt-1 inline-block">
                Registrar agora →
              </a>
            </div>
          )}
        </div>

        {/* Treinos recentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">🏋️ Treinos disponíveis</h2>
            <a href="/dashboard/aluno/treinos" className="text-sm text-green-600 font-medium hover:underline">
              Ver todos
            </a>
          </div>
          {treinos && treinos.length > 0 ? (
            <div className="space-y-3">
              {treinos.map((treino) => (
                <a
                  key={treino.id}
                  href={`/dashboard/aluno/treinos/${treino.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900">{treino.nome}</div>
                    <div className="text-sm text-gray-500">{treino.descricao}</div>
                  </div>
                  <span className="text-green-600">→</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <div className="text-4xl mb-2">🏋️</div>
              <p className="text-sm">Seu personal ainda não enviou treinos</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
