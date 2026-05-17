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
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal/treinos" style={{ color: '#555' }} className="text-sm hover:text-white">← Treinos</Link>
          <span style={{ color: '#2a2a2a' }}>|</span>
          <span className="font-bold text-white truncate max-w-48">{treino.nome}</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-xl font-extrabold text-white">{treino.nome}</h1>
              {treino.objetivo && (
                <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-semibold"
                  style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>{treino.objetivo}</span>
              )}
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
              style={treino.ativo ? { background: 'rgba(249,115,22,0.15)', color: '#f97316' } : { background: '#1c1c1c', color: '#444' }}>
              {treino.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          {treino.descricao && <p className="text-sm rounded-xl p-3" style={{ background: '#1c1c1c', color: '#888' }}>{treino.descricao}</p>}
          {aluno && (
            <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #1f1f1f' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>
                {aluno.nome?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{aluno.nome}</p>
                <p className="text-xs" style={{ color: '#555' }}>{aluno.email}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: '#555' }}>EXERCÍCIOS ({exercicios?.length || 0})</p>
          {(!exercicios || exercicios.length === 0) ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: '#141414', border: '1px dashed #2a2a2a' }}>
              <p style={{ color: '#444' }}>Nenhum exercício</p>
            </div>
          ) : exercicios.map((ex, i) => (
            <div key={ex.id} className="rounded-2xl p-4" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>{i + 1}</div>
                <div className="flex-1">
                  <p className="font-bold text-white">{ex.nome}</p>
                  <div className="flex gap-4 mt-2">
                    {[['Séries', ex.series], ['Reps', ex.repeticoes], ['Descanso', ex.descanso_segundos >= 60 ? `${Math.floor(ex.descanso_segundos/60)}min` : `${ex.descanso_segundos}s`]].map(([l, v]) => (
                      <div key={l as string} className="text-center">
                        <p className="text-base font-extrabold" style={{ color: '#f97316' }}>{v}</p>
                        <p className="text-xs" style={{ color: '#555' }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  {ex.observacoes && <p className="text-xs mt-2 rounded-lg px-2 py-1.5" style={{ background: '#1c1c1c', color: '#666' }}>💬 {ex.observacoes}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
