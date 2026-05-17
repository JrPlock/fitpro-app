import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TreinosAlunoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: treinos } = await supabase.from('treinos').select('*').eq('aluno_id', user.id).eq('ativo', true).order('created_at', { ascending: false })

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <nav className="px-5 py-4 flex items-center gap-3 sticky top-0 z-10" style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/dashboard/aluno" style={{ color: '#555' }} className="text-sm hover:text-white">← Dashboard</Link>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <span className="font-bold text-white">🏋️ Meus Treinos</span>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-3">
        {(!treinos || treinos.length === 0) ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: '#141414', border: '1px dashed #2a2a2a' }}>
            <div className="text-5xl mb-3">🏋️</div>
            <p className="font-semibold text-white mb-1">Nenhum treino disponível</p>
            <p className="text-sm" style={{ color: '#555' }}>Seu personal ainda não enviou treinos</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium" style={{ color: '#555' }}>{treinos.length} treino{treinos.length !== 1 ? 's' : ''} disponível{treinos.length !== 1 ? 'is' : ''}</p>
            {treinos.map(treino => (
              <Link key={treino.id} href={`/dashboard/aluno/treinos/${treino.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(249,115,22,0.15)' }}>🏋️</div>
                <div className="flex-1">
                  <p className="font-bold text-white">{treino.nome}</p>
                  {treino.objetivo && (
                    <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-medium"
                      style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>{treino.objetivo}</span>
                  )}
                </div>
                <span style={{ color: '#f97316' }} className="text-xl">›</span>
              </Link>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
