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

export default async function DashboardAluno() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: treinos } = await supabase.from('treinos').select('*').eq('aluno_id', user.id).order('created_at', { ascending: false }).limit(3)
  const { data: ultimaMedida } = await supabase.from('medidas').select('*').eq('aluno_id', user.id).order('data', { ascending: false }).limit(1).single()

  const firstName = profile?.nome?.split(' ')[0] || 'Aluno'

  const modulos = [
    { label: 'Treinos', icon: '🏋️', href: '/dashboard/aluno/treinos' },
    { label: 'Medidas', icon: '📏', href: '/dashboard/aluno/medidas' },
    { label: 'Nutrição', icon: '🥗', href: '/dashboard/aluno/nutricao' },
    { label: 'Evolução', icon: '📈', href: '/dashboard/aluno/evolucao' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <nav className="px-5 pt-6 pb-4 flex items-center justify-between">
        <span className="text-xl font-extrabold text-white">Fit<span style={{ color: '#f97316' }}>Pro</span></span>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/aluno/perfil">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover" style={{ border: '2px solid #f97316' }} />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }}>
                {firstName.charAt(0)}
              </div>
            )}
          </Link>
          <LogoutButton />
        </div>
      </nav>

      <main className="px-5 pb-10 space-y-4">
        {/* Boas-vindas */}
        <div className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #1c1c1c 0%, #141414 100%)', border: '1px solid #2a2a2a' }}>
          <p className="text-sm mb-0.5" style={{ color: '#888' }}>{saudacao()},</p>
          <p className="text-2xl font-extrabold text-white mb-4">{firstName} 👋</p>

          {ultimaMedida ? (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'peso atual', value: `${ultimaMedida.peso}kg` },
                { label: 'altura', value: `${ultimaMedida.altura}cm` },
                { label: '% gordura', value: `${ultimaMedida.percentual_gordura || '—'}%` },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3" style={{ background: '#0f0f0f' }}>
                  <p className="text-xl font-extrabold text-white">{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>{s.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <Link href="/dashboard/aluno/medidas/nova"
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <span className="text-sm font-medium" style={{ color: '#f97316' }}>Registrar primeira medida</span>
              <span style={{ color: '#f97316' }}>→</span>
            </Link>
          )}
        </div>

        {/* Módulos */}
        <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <div className="grid grid-cols-4 gap-4">
            {modulos.map(m => (
              <Link key={m.label} href={m.href} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all group-hover:scale-110"
                  style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                  {m.icon}
                </div>
                <span className="text-xs font-medium text-center" style={{ color: '#888' }}>{m.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Treinos */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1c1c1c' }}>
            <span className="font-bold text-white">🏋️ Meus treinos</span>
            <Link href="/dashboard/aluno/treinos" className="text-xs font-semibold" style={{ color: '#f97316' }}>
              Ver todos →
            </Link>
          </div>
          {treinos && treinos.length > 0 ? (
            <div>
              {treinos.map(treino => (
                <Link key={treino.id} href={`/dashboard/aluno/treinos/${treino.id}`}
                  className="flex items-center justify-between px-5 py-4 transition-all hover:bg-white/5"
                  style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(249,115,22,0.15)' }}>
                      <span className="text-lg">🏋️</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{treino.nome}</p>
                      {treino.objetivo && <p className="text-xs" style={{ color: '#555' }}>{treino.objetivo}</p>}
                    </div>
                  </div>
                  <span style={{ color: '#f97316' }}>›</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: '#555' }}>Seu personal ainda não enviou treinos</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
