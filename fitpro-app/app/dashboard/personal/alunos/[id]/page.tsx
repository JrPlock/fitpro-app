import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DesvincularButton from './DesvincularButton'

export default async function AlunoPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: aluno } = await supabase.from('profiles').select('*').eq('id', id).eq('personal_id', user.id).single()
  if (!aluno) redirect('/dashboard/personal/alunos')

  const [{ data: treinos }, { data: medidas }] = await Promise.all([
    supabase.from('treinos').select('*').eq('aluno_id', id).eq('personal_id', user.id).order('created_at', { ascending: false }),
    supabase.from('medidas').select('*').eq('aluno_id', id).order('data', { ascending: false }).limit(5),
  ])

  const ultima = medidas?.[0]
  const varPeso = ultima?.peso && medidas?.[1]?.peso ? (ultima.peso - medidas[1].peso).toFixed(1) : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal/alunos" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Alunos</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white truncate">{aluno.nome}</span>
        </div>
        <DesvincularButton alunoId={id} alunoNome={aluno.nome} />
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {/* Header */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-4 mb-5">
            {aluno.avatar_url ? (
              <img src={aluno.avatar_url} className="w-16 h-16 rounded-full object-cover" style={{ border: '3px solid #f97316' }} />
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
            {[['Treinos', treinos?.length || 0, '🏋️'], ['Avaliações', medidas?.length || 0, '📏'], ['Peso', ultima?.peso ? `${ultima.peso}kg` : '—', '⚖️']].map(([l, v, i]) => (
              <div key={l as string} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-card2)' }}>
                <div className="text-lg mb-0.5">{i}</div>
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

        {/* Ações */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: `/dashboard/personal/alunos/${id}/avaliacoes`, label: '📏 Avaliações', color: '#7c3aed' },
            { href: `/dashboard/personal/alunos/${id}/relatorio`, label: '📊 Relatório', color: '#2563eb' },
            { href: `/dashboard/personal/treinos/novo?aluno=${id}`, label: '🏋️ Novo treino', color: '#16a34a' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="py-3 rounded-xl text-center text-xs font-bold text-white transition-all hover:scale-105"
              style={{ background: a.color }}>
              {a.label}
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Treinos */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1f1f1f' }}>
              <p className="font-bold text-white text-sm">🏋️ Treinos</p>
            </div>
            {(!treinos || treinos.length === 0) ? (
              <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-dimmer)' }}>Nenhum treino</p>
            ) : treinos.map(t => (
              <Link key={t.id} href={`/dashboard/personal/treinos/${t.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                style={{ borderBottom: '1px solid #1a1a1a' }}>
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

          {/* Medidas */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #1f1f1f' }}>
              <p className="font-bold text-white text-sm">📏 Avaliações</p>
            </div>
            {(!medidas || medidas.length === 0) ? (
              <p className="px-4 py-6 text-xs text-center" style={{ color: 'var(--text-dimmer)' }}>Nenhuma avaliação</p>
            ) : medidas.map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1a1a1a' }}>
                <p className="text-sm text-white">{new Date(m.data+'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })}</p>
                <div className="text-right">
                  {m.peso && <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{m.peso} kg</p>}
                  {m.percentual_gordura && <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>{m.percentual_gordura}%</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {ultima && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
            <p className="font-bold text-white mb-3">📐 Última avaliação detalhada</p>
            <div className="grid grid-cols-4 gap-2">
              {[['Peso', ultima.peso, 'kg'], ['Altura', ultima.altura, 'cm'], ['% Gord.', ultima.percentual_gordura, '%'], ['Cintura', ultima.cintura, 'cm'], ['Quadril', ultima.quadril, 'cm'], ['Braço D', ultima.braco_dir, 'cm'], ['Coxa D', ultima.coxa_dir, 'cm'], ['Abdômen', ultima.abdomen, 'cm']].filter(([,v]) => v).map(([l,v,u]) => (
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
