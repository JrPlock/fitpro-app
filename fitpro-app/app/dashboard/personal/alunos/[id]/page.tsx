import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DesvincularButton from './DesvincularButton'

type PacoteAluno = {
  id: string
  tipo_atendimento: 'presencial' | 'online' | 'hibrido'
  data_inicio: string
  data_vencimento: string
  sessoes_semana: number | null
  dias_treino: string[] | null
  valor_mensal: number | null
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

export default async function AlunoPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: aluno } = await supabase.from('profiles').select('*').eq('id', id).eq('personal_id', user.id).single()
  if (!aluno) redirect('/dashboard/personal/alunos')

  const [{ data: treinos }, { data: medidas }, { data: pacote }] = await Promise.all([
    supabase.from('treinos').select('*').eq('aluno_id', id).eq('personal_id', user.id).order('created_at', { ascending: false }),
    supabase.from('medidas').select('*').eq('aluno_id', id).order('data', { ascending: false }).limit(5),
    supabase.from('pacotes_alunos').select('*').eq('aluno_id', id).eq('personal_id', user.id).eq('status', 'ativo').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const ultima = medidas?.[0]
  const varPeso = ultima?.peso && medidas?.[1]?.peso ? (ultima.peso - medidas[1].peso).toFixed(1) : null
  const pacoteAtivo = pacote as PacoteAluno | null
  const vencimentoDiff = pacoteAtivo ? diasAte(pacoteAtivo.data_vencimento) : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal/alunos" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Alunos</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white truncate">{aluno.nome}</span>
        </div>
        <DesvincularButton alunoId={id} alunoNome={aluno.nome} />
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4 mb-5">
            {aluno.avatar_url ? (
              <img src={aluno.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" style={{ border: '3px solid var(--accent)' }} />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center font-extrabold text-2xl"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'white' }}>
                {aluno.nome?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-extrabold text-white">{aluno.nome}</h1>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{aluno.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Treinos', treinos?.length || 0],
              ['Avaliações', medidas?.length || 0],
              ['Peso', ultima?.peso ? `${ultima.peso}kg` : '—'],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-card2)' }}>
                <div className="text-xl font-extrabold text-white">{v}</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{l}</div>
                {l === 'Peso' && varPeso && (
                  <div className="text-xs font-bold" style={{ color: parseFloat(varPeso) < 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {parseFloat(varPeso) > 0 ? '+' : ''}{varPeso}kg
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {pacoteAtivo && (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-white">Pacote em andamento</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  {tipoLabels[pacoteAtivo.tipo_atendimento]}
                  {pacoteAtivo.sessoes_semana ? ` · ${pacoteAtivo.sessoes_semana}x por semana` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/personal/alunos/${id}/pacote/editar`}
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'var(--bg-card2)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                  Editar
                </Link>
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: vencimentoDiff !== null && vencimentoDiff < 0 ? 'var(--danger-bg)' : 'var(--accent-glow)',
                    color: vencimentoDiff !== null && vencimentoDiff < 0 ? 'var(--danger)' : 'var(--accent)',
                    border: `1px solid ${vencimentoDiff !== null && vencimentoDiff < 0 ? 'var(--danger-border)' : 'rgba(249,115,22,0.3)'}`,
                  }}>
                  {vencimentoLabel(pacoteAtivo.data_vencimento)}
                </span>
              </div>
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

            {(pacoteAtivo.valor_mensal || pacoteAtivo.observacoes) && (
              <div className="space-y-2">
                {pacoteAtivo.valor_mensal && (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Mensalidade: <strong className="text-white">R$ {Number(pacoteAtivo.valor_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </p>
                )}
                {pacoteAtivo.observacoes && (
                  <p className="text-sm rounded-xl px-3 py-2" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
                    {pacoteAtivo.observacoes}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[
            { href: `/dashboard/personal/alunos/${id}/avaliacoes`, label: 'Avaliações', color: '#7c3aed' },
            { href: `/dashboard/personal/alunos/${id}/relatorio`, label: 'Relatório', color: '#2563eb' },
            { href: `/dashboard/personal/treinos/novo?aluno=${id}`, label: 'Novo treino', color: '#16a34a' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="py-3 rounded-xl text-center text-xs font-bold text-white transition-all hover:scale-105"
              style={{ background: a.color }}>
              {a.label}
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-bold text-white text-sm">Treinos</p>
            </div>
            {(!treinos || treinos.length === 0) ? (
              <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-dimmer)' }}>Nenhum treino</p>
            ) : treinos.map(t => (
              <Link key={t.id} href={`/dashboard/personal/treinos/${t.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-medium text-white">{t.nome}</p>
                  {t.objetivo && <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>{t.objetivo}</p>}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={t.ativo ? { background: 'var(--accent-glow)', color: 'var(--accent)' } : { background: 'var(--bg-card2)', color: 'var(--text-dimmer)' }}>
                  {t.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-bold text-white text-sm">Avaliações</p>
            </div>
            {(!medidas || medidas.length === 0) ? (
              <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-dimmer)' }}>Nenhuma avaliação</p>
            ) : medidas.map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-sm text-white">{formatDate(m.data)}</p>
                <div className="text-right">
                  {m.peso && <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{m.peso} kg</p>}
                  {m.percentual_gordura && <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>{m.percentual_gordura}%</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {ultima && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="font-bold text-white mb-3">Última avaliação detalhada</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                ['Peso', ultima.peso, 'kg'],
                ['Altura', ultima.altura, 'cm'],
                ['% Gord.', ultima.percentual_gordura, '%'],
                ['Cintura', ultima.cintura, 'cm'],
                ['Quadril', ultima.quadril, 'cm'],
                ['Braço D', ultima.braco_dir, 'cm'],
                ['Coxa D', ultima.coxa_dir, 'cm'],
                ['Abdômen', ultima.abdomen, 'cm'],
              ].filter(([, v]) => v).map(([l, v, u]) => (
                <div key={l as string} className="rounded-xl p-2.5 text-center" style={{ background: 'var(--bg-card2)' }}>
                  <div className="text-base font-extrabold text-white">{v}</div>
                  <div className="text-xs" style={{ color: 'var(--text-dimmer)' }}>{u}</div>
                  <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
