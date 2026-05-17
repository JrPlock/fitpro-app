import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'; if (h < 18) return 'Boa tarde'; return 'Boa noite'
}

export default async function DashboardPersonal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: alunos } = await supabase.from('profiles').select('*').eq('role', 'aluno').eq('personal_id', user.id)
  const { data: treinos } = await supabase.from('treinos').select('id').eq('personal_id', user.id)
  const { data: medidas } = await supabase.from('medidas').select('id').in('aluno_id', alunos?.map(a => a.id) || ['00000000-0000-0000-0000-000000000000'])

  const firstName = profile?.nome?.split(' ')[0] || 'Personal'

  return (
    <div className="px-5 py-6 space-y-5 max-w-5xl mx-auto">

      {/* Boas-vindas */}
      <div className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, var(--bg-card2) 0%, var(--bg-card) 100%)', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-3 mb-5">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid #f97316' }} />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'white' }}>
              {firstName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{saudacao()},</p>
            <p className="text-xl font-extrabold text-white">{firstName}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'alunos ativos', value: alunos?.length || 0 },
            { label: 'treinos criados', value: treinos?.length || 0 },
            { label: 'avaliações', value: medidas?.length || 0 },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: 'var(--bg)' }}>
              <p className="text-3xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/personal/alunos/adicionar"
          className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
          style={{ background: 'var(--bg-card2)', border: '1px solid #2a2a2a' }}>
          <span className="text-2xl">👤</span>
          <span className="font-semibold text-white text-sm">Adicionar Aluno</span>
        </Link>
        <Link href="/dashboard/personal/treinos/novo"
          className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
          style={{ background: 'var(--bg-card2)', border: '1px solid #2a2a2a' }}>
          <span className="text-2xl">📋</span>
          <span className="font-semibold text-white text-sm">Novo Treino</span>
        </Link>
      </div>

      {/* Alunos recentes */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1f1f1f' }}>
          <span className="font-bold text-white">Seus alunos</span>
          <Link href="/dashboard/personal/alunos" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Ver todos →</Link>
        </div>
        {(!alunos || alunos.length === 0) ? (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Nenhum aluno vinculado ainda</p>
            <Link href="/dashboard/personal/alunos/adicionar"
              className="inline-block mt-3 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid rgba(249,115,22,0.3)' }}>
              + Adicionar aluno
            </Link>
          </div>
        ) : alunos.slice(0, 5).map(aluno => (
          <Link key={aluno.id} href={`/dashboard/personal/alunos/${aluno.id}`}
            className="flex items-center justify-between px-5 py-3.5 transition-all hover:bg-white/5"
            style={{ borderBottom: '1px solid #1a1a1a' }}>
            <div className="flex items-center gap-3">
              {aluno.avatar_url ? (
                <img src={aluno.avatar_url} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  {aluno.nome?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{aluno.nome}</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{aluno.email}</p>
              </div>
            </div>
            <span style={{ color: 'var(--accent)' }}>›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
