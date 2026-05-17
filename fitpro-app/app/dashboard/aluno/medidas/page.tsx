import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MedidasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: medidas } = await supabase.from('medidas').select('*').eq('aluno_id', user.id).order('data', { ascending: false })
  const ultima = medidas?.[0]
  const penultima = medidas?.[1]

  function diff(campo: string) {
    if (!ultima || !penultima) return null
    const a = (ultima as any)[campo], b = (penultima as any)[campo]
    if (!a || !b) return null
    return (a - b).toFixed(1)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Dashboard</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white">📏 Medidas</span>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/aluno/evolucao"
            className="px-3 py-2 rounded-xl text-xs font-bold"
            style={{ background: 'var(--bg-card2)', border: '1px solid #2a2a2a', color: 'var(--text-muted)' }}>
            📈 Gráficos
          </Link>
          <Link href="/dashboard/aluno/medidas/nova"
            className="px-3 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
            + Nova
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {ultima && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-white">Última avaliação</p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {new Date(ultima.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[['Peso', ultima.peso, 'kg'], ['Altura', ultima.altura, 'cm'], ['% Gordura', ultima.percentual_gordura, '%']].map(([l, v, u]) => (
                <div key={l as string} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-card2)' }}>
                  <p className="text-xl font-extrabold text-white">{v ?? '—'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{u} · {l}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[['Cintura', 'cintura'], ['Quadril', 'quadril'], ['Braço D', 'braco_dir'], ['Coxa D', 'coxa_dir']].map(([label, campo]) => {
                const val = (ultima as any)[campo]
                const d = diff(campo)
                if (!val) return null
                return (
                  <div key={campo} className="flex justify-between items-center px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card2)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-white">{val} cm</span>
                      {d && <span className="text-xs" style={{ color: parseFloat(d) < 0 ? 'var(--success)' : 'var(--danger)' }}>{parseFloat(d) > 0 ? '+' : ''}{d}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>HISTÓRICO</p>
          {(!medidas || medidas.length === 0) ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--bg-card)', border: '1px dashed #2a2a2a' }}>
              <div className="text-4xl mb-3">📏</div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>Nenhuma avaliação registrada</p>
              <Link href="/dashboard/aluno/medidas/nova"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                Registrar agora
              </Link>
            </div>
          ) : medidas.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: `1px solid ${i === 0 ? 'var(--accent-glow-strong)' : 'var(--border)'}` }}>
              <div className="flex items-center gap-2">
                {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>Recente</span>}
                <span className="text-sm font-medium text-white">
                  {new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                {m.peso && <span><strong className="text-white">{m.peso}</strong> kg</span>}
                {m.percentual_gordura && <span><strong className="text-white">{m.percentual_gordura}</strong>%</span>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
