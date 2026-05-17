import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TreinosPersonalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: treinos } = await supabase
    .from('treinos').select('*, profiles!treinos_aluno_id_fkey(nome)')
    .eq('personal_id', user.id).order('created_at', { ascending: false })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Dashboard</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white">🏋️ Treinos</span>
        </div>
        <Link href="/dashboard/personal/treinos/novo"
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
          + Novo Treino
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-3">
        {(!treinos || treinos.length === 0) ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg-card)', border: '1px dashed #2a2a2a' }}>
            <div className="text-5xl mb-3">🏋️</div>
            <p className="font-semibold text-white mb-1">Nenhum treino criado</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-dim)' }}>Crie seu primeiro treino e vincule a um aluno</p>
            <Link href="/dashboard/personal/treinos/novo"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
              + Criar treino
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>{treinos.length} treino{treinos.length !== 1 ? 's' : ''}</p>
            {treinos.map(treino => (
              <Link key={treino.id} href={`/dashboard/personal/treinos/${treino.id}`}
                className="flex items-center justify-between p-4 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'var(--accent-glow)' }}>🏋️</div>
                  <div>
                    <p className="font-semibold text-white">{treino.nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                      {(treino.profiles as any)?.nome || 'Sem aluno'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={treino.ativo
                      ? { background: 'var(--accent-glow)', color: 'var(--accent)' }
                      : { background: 'var(--bg-card2)', color: 'var(--text-dimmer)' }}>
                    {treino.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <span style={{ color: 'var(--accent)' }}>›</span>
                </div>
              </Link>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
