import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'; if (h < 18) return 'Boa tarde'; return 'Boa noite'
}

export default async function DashboardAluno() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: treinos } = await supabase.from('treinos').select('*').eq('aluno_id', user.id).order('created_at', { ascending: false }).limit(3)
  const { data: ultimaMedida } = await supabase.from('medidas').select('*').eq('aluno_id', user.id).order('data', { ascending: false }).limit(1).single()

  const firstName = profile?.nome?.split(' ')[0] || 'Aluno'

  return (
    <div className="px-5 py-6 space-y-5 max-w-3xl mx-auto">

      {/* Boas-vindas */}
      <div className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, var(--bg-card2) 0%, var(--bg-card) 100%)', border: '1px solid #2a2a2a' }}>
        <p className="text-sm mb-0.5" style={{ color: 'var(--text-muted)' }}>{saudacao()},</p>
        <p className="text-2xl font-extrabold text-white mb-4">{firstName} 👋</p>

        {ultimaMedida ? (
          <div className="grid grid-cols-3 gap-2">
            {[['peso atual', `${ultimaMedida.peso}kg`], ['altura', `${ultimaMedida.altura}cm`], ['% gordura', `${ultimaMedida.percentual_gordura || '—'}%`]].map(([l, v]) => (
              <div key={l} className="rounded-xl p-3" style={{ background: 'var(--bg)' }}>
                <p className="text-xl font-extrabold text-white">{v}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{l}</p>
              </div>
            ))}
          </div>
        ) : (
          <Link href="/dashboard/aluno/medidas/nova"
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'var(--accent-glow)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Registrar primeira medida</span>
            <span style={{ color: 'var(--accent)' }}>→</span>
          </Link>
        )}
      </div>

      {/* Acesso rápido — só mobile */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {[
          { label: 'Medidas', icon: '📏', href: '/dashboard/aluno/medidas' },
          { label: 'Nutrição', icon: '🥗', href: '/dashboard/aluno/nutricao' },
        ].map(c => (
          <Link key={c.label} href={c.href}
            className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{ background: 'var(--bg-card2)', border: '1px solid #2a2a2a' }}>
            <span className="text-2xl">{c.icon}</span>
            <span className="font-semibold text-white text-sm">{c.label}</span>
          </Link>
        ))}
      </div>

      {/* Treinos */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1f1f1f' }}>
          <span className="font-bold text-white">🏋️ Meus treinos</span>
          <Link href="/dashboard/aluno/treinos" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Ver todos →</Link>
        </div>
        {treinos && treinos.length > 0 ? treinos.map(treino => (
          <Link key={treino.id} href={`/dashboard/aluno/treinos/${treino.id}`}
            className="flex items-center justify-between px-5 py-4 transition-all hover:bg-white/5"
            style={{ borderBottom: '1px solid #1a1a1a' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-glow)' }}>🏋️</div>
              <div>
                <p className="text-sm font-semibold text-white">{treino.nome}</p>
                {treino.objetivo && <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{treino.objetivo}</p>}
              </div>
            </div>
            <span style={{ color: 'var(--accent)' }}>›</span>
          </Link>
        )) : (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Seu personal ainda não enviou treinos</p>
          </div>
        )}
      </div>
    </div>
  )
}
