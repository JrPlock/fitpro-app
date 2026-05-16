import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default async function DashboardPersonal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: alunos } = await supabase.from('profiles').select('*').eq('role', 'aluno').eq('personal_id', user.id)
  const { data: treinos } = await supabase.from('treinos').select('id').eq('personal_id', user.id)
  const { data: medidas } = await supabase.from('medidas').select('id').in(
    'aluno_id', alunos?.map(a => a.id) || ['00000000-0000-0000-0000-000000000000']
  )

  const firstName = profile?.nome?.split(' ')[0] || 'Personal'

  const acoes = [
    { label: 'Alunos', icon: '👥', href: '/dashboard/personal/alunos' },
    { label: 'Avaliações', icon: '📏', href: '/dashboard/personal/avaliacoes' },
    { label: 'Treinos', icon: '🏋️', href: '/dashboard/personal/treinos' },
    { label: 'Relatórios', icon: '📊', href: '/dashboard/personal/relatorios' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <nav className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-white">Fit<span style={{ color: '#f97316' }}>Pro</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/personal/alunos/adicionar"
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
            ➕
          </Link>
          <LogoutButton />
        </div>
      </nav>

      <main className="px-5 pb-10 space-y-4">
        {/* Boas-vindas */}
        <div className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #1c1c1c 0%, #141414 100%)', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-3 mb-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid #f97316' }} />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }}>
                {firstName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm" style={{ color: '#888' }}>{saudacao()},</p>
              <p className="text-xl font-bold text-white">{firstName}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'alunos ativos', value: alunos?.length || 0, icon: '↑' },
              { label: 'treinos criados', value: treinos?.length || 0, icon: '↑' },
              { label: 'avaliações', value: medidas?.length || 0, icon: '↑' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3" style={{ background: '#0f0f0f' }}>
                <p className="text-3xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#555' }}>{s.label}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: '#f97316' }}>{s.icon} este mês</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/personal/alunos/adicionar"
            className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
            <span className="text-2xl">👤</span>
            <span className="font-semibold text-white text-sm">Adicionar Aluno</span>
          </Link>
          <Link href="/dashboard/personal/treinos/novo"
            className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
            <span className="text-2xl">📋</span>
            <span className="font-semibold text-white text-sm">Novo Treino</span>
          </Link>
        </div>

        {/* Grid de módulos */}
        <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <div className="grid grid-cols-4 gap-4">
            {acoes.map(a => (
              <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all group-hover:scale-110"
                  style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  {a.icon}
                </div>
                <span className="text-xs font-medium text-center" style={{ color: '#888' }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Lista de alunos recentes */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1c1c1c' }}>
            <span className="font-bold text-white">Seus alunos</span>
            <Link href="/dashboard/personal/alunos" className="text-xs font-semibold" style={{ color: '#f97316' }}>
              Ver todos →
            </Link>
          </div>
          {(!alunos || alunos.length === 0) ? (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: '#555' }}>Nenhum aluno vinculado ainda</p>
              <Link href="/dashboard/personal/alunos/adicionar"
                className="inline-block mt-3 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>
                + Adicionar aluno
              </Link>
            </div>
          ) : (
            <div>
              {alunos.slice(0, 4).map(aluno => (
                <Link key={aluno.id} href={`/dashboard/personal/alunos/${aluno.id}`}
                  className="flex items-center justify-between px-5 py-3.5 transition-all hover:bg-white/5"
                  style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <div className="flex items-center gap-3">
                    {aluno.avatar_url ? (
                      <img src={aluno.avatar_url} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>
                        {aluno.nome?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{aluno.nome}</p>
                      <p className="text-xs" style={{ color: '#555' }}>{aluno.email}</p>
                    </div>
                  </div>
                  <span style={{ color: '#f97316' }}>›</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
