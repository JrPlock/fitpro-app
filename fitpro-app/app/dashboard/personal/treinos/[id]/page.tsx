import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TreinoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: treino } = await supabase.from('treinos').select('*, profiles!treinos_aluno_id_fkey(nome, email)').eq('id', id).eq('personal_id', user.id).single()
  if (!treino) redirect('/dashboard/personal/treinos')

  const { data: exercicios } = await supabase.from('exercicios').select('*').eq('treino_id', id).order('ordem')
  const aluno = treino.profiles as any

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal/treinos" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Treinos</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white truncate max-w-48">{treino.nome}</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-xl font-extrabold text-white">{treino.nome}</h1>
              {treino.objetivo && (
                <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-semibold"
                  style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{treino.objetivo}</span>
              )}
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
              style={treino.ativo ? { background: 'var(--accent-glow)', color: 'var(--accent)' } : { background: 'var(--bg-card2)', color: 'var(--text-dimmer)' }}>
              {treino.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          {treino.descricao && <p className="text-sm rounded-xl p-3" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>{treino.descricao}</p>}
          {aluno && (
            <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #1f1f1f' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                {aluno.nome?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{aluno.nome}</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{aluno.email}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>EXERCÍCIOS ({exercicios?.length || 0})</p>
          {(!exercicios || exercicios.length === 0) ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-card)', border: '1px dashed #2a2a2a' }}>
              <p style={{ color: 'var(--text-dimmer)' }}>Nenhum exercício</p>
            </div>
          ) : exercicios.map((ex, i) => (
            <div key={ex.id} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{i + 1}</div>
                <div className="flex-1">
                  <p className="font-bold text-white">{ex.nome}</p>
                  <div className="flex gap-4 mt-2">
                    {[['Séries', ex.series], ['Reps', ex.repeticoes], ['Descanso', ex.descanso_segundos >= 60 ? `${Math.floor(ex.descanso_segundos/60)}min` : `${ex.descanso_segundos}s`]].map(([l, v]) => (
                      <div key={l as string} className="text-center">
                        <p className="text-base font-extrabold" style={{ color: 'var(--accent)' }}>{v}</p>
                        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  {ex.observacoes && <p className="text-xs mt-2 rounded-lg px-2 py-1.5" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>💬 {ex.observacoes}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
