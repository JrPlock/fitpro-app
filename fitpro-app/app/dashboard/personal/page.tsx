import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type PacoteAluno = {
  aluno_id: string
  tipo_atendimento: 'presencial' | 'online' | 'hibrido'
  data_vencimento: string
  status: 'ativo' | 'pausado' | 'cancelado'
}

type TreinoResumo = {
  id: string
  nome: string
  aluno_id: string
  data_vencimento: string | null
  profiles?: { nome: string | null } | { nome: string | null }[] | null
}

const tipoLabels: Record<PacoteAluno['tipo_atendimento'], string> = {
  presencial: 'Presencial',
  online: 'Online',
  hibrido: 'Híbrido',
}

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'; if (h < 18) return 'Boa tarde'; return 'Boa noite'
}

function diasAte(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function dateOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function packageBadge(pacote?: PacoteAluno) {
  if (!pacote) {
    return {
      label: 'Sem pacote',
      detail: 'cadastro incompleto',
      bg: 'var(--bg-card2)',
      color: 'var(--text-dimmer)',
      border: 'var(--border)',
    }
  }

  const diff = diasAte(pacote.data_vencimento)

  if (diff < 0) {
    return {
      label: 'Vencido',
      detail: `${Math.abs(diff)} dia${Math.abs(diff) === 1 ? '' : 's'}`,
      bg: 'var(--danger-bg)',
      color: 'var(--danger)',
      border: 'var(--danger-border)',
    }
  }

  if (diff <= 5) {
    return {
      label: diff === 0 ? 'Vence hoje' : 'Vence logo',
      detail: diff === 0 ? 'hoje' : `${diff} dia${diff === 1 ? '' : 's'}`,
      bg: 'var(--accent-glow)',
      color: 'var(--accent)',
      border: 'rgba(249,115,22,0.3)',
    }
  }

  return {
    label: 'Em dia',
    detail: `${diff} dias`,
    bg: 'rgba(34,197,94,0.12)',
    color: 'var(--success)',
    border: 'rgba(34,197,94,0.25)',
  }
}

function trainingBadge(treino: TreinoResumo) {
  if (!treino.data_vencimento) {
    return {
      label: 'Sem revisão',
      detail: 'defina uma data',
      bg: 'var(--bg-card2)',
      color: 'var(--text-dimmer)',
      border: 'var(--border)',
    }
  }

  const diff = diasAte(treino.data_vencimento)

  if (diff < 0) {
    return {
      label: 'Trocar treino',
      detail: `vencido há ${Math.abs(diff)} dia${Math.abs(diff) === 1 ? '' : 's'}`,
      bg: 'var(--danger-bg)',
      color: 'var(--danger)',
      border: 'var(--danger-border)',
    }
  }

  return {
    label: diff === 0 ? 'Revisar hoje' : 'Revisar em breve',
    detail: diff === 0 ? 'vence hoje' : `faltam ${diff} dia${diff === 1 ? '' : 's'}`,
    bg: 'var(--accent-glow)',
    color: 'var(--accent)',
    border: 'rgba(249,115,22,0.3)',
  }
}

function profileName(profile: TreinoResumo['profiles']) {
  if (Array.isArray(profile)) return profile[0]?.nome
  return profile?.nome
}

export default async function DashboardPersonal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: alunos } = await supabase.from('profiles').select('*').eq('role', 'aluno').eq('personal_id', user.id)

  const { data: pacotes } = await supabase
    .from('pacotes_alunos')
    .select('aluno_id, tipo_atendimento, data_vencimento, status')
    .eq('personal_id', user.id)
    .eq('status', 'ativo')

  const { data: treinosParaRevisar } = await supabase
    .from('treinos')
    .select('id, nome, aluno_id, data_vencimento, profiles!treinos_aluno_id_fkey(nome)')
    .eq('personal_id', user.id)
    .eq('ativo', true)
    .not('data_vencimento', 'is', null)
    .lte('data_vencimento', dateOffset(7))
    .order('data_vencimento', { ascending: true })
    .limit(5)

  const pacotePorAluno = new Map((pacotes as PacoteAluno[] | null)?.map(p => [p.aluno_id, p]) || [])
  const treinosRevisao = (treinosParaRevisar as unknown as TreinoResumo[] | null) || []
  const vencidos = (pacotes as PacoteAluno[] | null)?.filter(p => diasAte(p.data_vencimento) < 0).length || 0
  const vencendo = (pacotes as PacoteAluno[] | null)?.filter(p => {
    const diff = diasAte(p.data_vencimento)
    return diff >= 0 && diff <= 5
  }).length || 0
  const firstName = profile?.nome?.split(' ')[0] || 'Personal'
  const treinosVencidos = treinosRevisao.filter(t => t.data_vencimento && diasAte(t.data_vencimento) < 0).length
  const treinosVencendo = treinosRevisao.filter(t => {
    if (!t.data_vencimento) return false
    const diff = diasAte(t.data_vencimento)
    return diff >= 0 && diff <= 7
  }).length

  return (
    <div className="px-5 py-6 space-y-5 max-w-5xl mx-auto">
      <div className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, var(--bg-card2) 0%, var(--bg-card) 100%)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-5">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: '2px solid var(--accent)' }} />
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
            { label: 'vencidos', value: vencidos },
            { label: 'vencem em 5 dias', value: vencendo },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: 'var(--bg)' }}>
              <p className="text-3xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {treinosRevisao.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <p className="font-bold text-white">Revisão de treinos</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                {treinosVencidos} vencido{treinosVencidos === 1 ? '' : 's'} · {treinosVencendo} vencendo em 7 dias
              </p>
            </div>
            <Link href="/dashboard/personal/treinos" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Ver treinos →</Link>
          </div>
          {treinosRevisao.map(treino => {
            const badge = trainingBadge(treino)

            return (
              <Link key={treino.id} href={`/dashboard/personal/treinos/${treino.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 transition-all hover:bg-white/5"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{treino.nome}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
                    {profileName(treino.profiles) || 'Aluno'} · {badge.detail}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                  {badge.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/personal/alunos/adicionar"
          className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
          style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
          <span className="font-semibold text-white text-sm">Adicionar Aluno</span>
        </Link>
        <Link href="/dashboard/personal/treinos/novo"
          className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
          style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
          <span className="font-semibold text-white text-sm">Novo Treino</span>
        </Link>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
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
        ) : alunos.slice(0, 5).map(aluno => {
          const pacote = pacotePorAluno.get(aluno.id)
          const badge = packageBadge(pacote)

          return (
            <Link key={aluno.id} href={`/dashboard/personal/alunos/${aluno.id}`}
              className="flex items-center justify-between gap-3 px-5 py-3.5 transition-all hover:bg-white/5"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 min-w-0">
                {aluno.avatar_url ? (
                  <img src={aluno.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                    {aluno.nome?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{aluno.nome}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-dim)' }}>
                    {pacote ? `${tipoLabels[pacote.tipo_atendimento]} · ${badge.detail}` : aluno.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                  {badge.label}
                </span>
                <span style={{ color: 'var(--accent)' }}>›</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
