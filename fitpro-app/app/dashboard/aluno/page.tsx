import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type PacoteAluno = {
  tipo_atendimento: 'presencial' | 'online' | 'hibrido'
  data_inicio: string
  data_vencimento: string
  sessoes_semana: number | null
  dias_treino: string[] | null
  status: 'ativo' | 'pausado' | 'cancelado'
  observacoes: string | null
}

const tipoLabels: Record<PacoteAluno['tipo_atendimento'], string> = {
  presencial: 'Presencial',
  online: 'Online / consultoria',
  hibrido: 'Híbrido',
}

const diasLabels: Record<string, string> = {
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
  domingo: 'Dom',
}

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'; if (h < 18) return 'Boa tarde'; return 'Boa noite'
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function diasAte(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function vencimentoLabel(date: string) {
  const diff = diasAte(date)
  if (diff < 0) return `Vencido há ${Math.abs(diff)} dia${Math.abs(diff) === 1 ? '' : 's'}`
  if (diff === 0) return 'Vence hoje'
  return `Faltam ${diff} dia${diff === 1 ? '' : 's'}`
}

export default async function DashboardAluno() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: treinos }, { data: ultimaMedida }, { data: pacote }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('treinos').select('*').eq('aluno_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('medidas').select('*').eq('aluno_id', user.id).order('data', { ascending: false }).limit(1).single(),
    supabase.from('pacotes_alunos').select('*').eq('aluno_id', user.id).eq('status', 'ativo').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const firstName = profile?.nome?.split(' ')[0] || 'Aluno'
  const pacoteAtivo = pacote as PacoteAluno | null
  const vencimentoDiff = pacoteAtivo ? diasAte(pacoteAtivo.data_vencimento) : null

  return (
    <div className="px-5 py-6 space-y-5 max-w-3xl mx-auto">
      <div className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, var(--bg-card2) 0%, var(--bg-card) 100%)', border: '1px solid var(--border)' }}>
        <p className="text-sm mb-0.5" style={{ color: 'var(--text-muted)' }}>{saudacao()},</p>
        <p className="text-2xl font-extrabold text-white mb-4">{firstName}</p>

        {ultimaMedida ? (
          <div className="grid grid-cols-3 gap-2">
            {[
              ['peso atual', `${ultimaMedida.peso}kg`],
              ['altura', `${ultimaMedida.altura}cm`],
              ['% gordura', `${ultimaMedida.percentual_gordura || '—'}%`],
            ].map(([l, v]) => (
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

      {pacoteAtivo && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white">Meu pacote</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>
                {tipoLabels[pacoteAtivo.tipo_atendimento]}
                {pacoteAtivo.sessoes_semana ? ` · ${pacoteAtivo.sessoes_semana}x por semana` : ''}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: vencimentoDiff !== null && vencimentoDiff < 0 ? 'var(--danger-bg)' : 'var(--accent-glow)',
                color: vencimentoDiff !== null && vencimentoDiff < 0 ? 'var(--danger)' : 'var(--accent)',
                border: `1px solid ${vencimentoDiff !== null && vencimentoDiff < 0 ? 'var(--danger-border)' : 'rgba(249,115,22,0.3)'}`,
              }}>
              {vencimentoLabel(pacoteAtivo.data_vencimento)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-card2)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>INÍCIO</p>
              <p className="font-bold text-white mt-1">{formatDate(pacoteAtivo.data_inicio)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-card2)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>VENCIMENTO</p>
              <p className="font-bold text-white mt-1">{formatDate(pacoteAtivo.data_vencimento)}</p>
            </div>
          </div>

          {pacoteAtivo.dias_treino && pacoteAtivo.dias_treino.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pacoteAtivo.dias_treino.map(dia => (
                <span key={dia} className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {diasLabels[dia] || dia}
                </span>
              ))}
            </div>
          )}

          {pacoteAtivo.observacoes && (
            <p className="text-sm rounded-xl px-3 py-2" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
              {pacoteAtivo.observacoes}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:hidden">
        {[
          { label: 'Medidas', href: '/dashboard/aluno/medidas' },
          { label: 'Nutrição', href: '/dashboard/aluno/nutricao' },
        ].map(c => (
          <Link key={c.label} href={c.href}
            className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
            <span className="font-semibold text-white text-sm">{c.label}</span>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="font-bold text-white">Meus treinos</span>
          <Link href="/dashboard/aluno/treinos" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Ver todos →</Link>
        </div>
        {treinos && treinos.length > 0 ? treinos.map(treino => (
          <Link key={treino.id} href={`/dashboard/aluno/treinos/${treino.id}`}
            className="flex items-center justify-between px-5 py-4 transition-all hover:bg-white/5"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <p className="text-sm font-semibold text-white">{treino.nome}</p>
              {treino.objetivo && <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{treino.objetivo}</p>}
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
