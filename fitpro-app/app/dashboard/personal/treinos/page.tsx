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
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal" style={{ color: '#555' }} className="text-sm hover:text-white">← Dashboard</Link>
          <span style={{ color: '#2a2a2a' }}>|</span>
          <span className="font-bold text-white">🏋️ Treinos</span>
        </div>
        <Link href="/dashboard/personal/treinos/novo"
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
          + Novo Treino
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-3">
        {(!treinos || treinos.length === 0) ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: '#141414', border: '1px dashed #2a2a2a' }}>
            <div className="text-5xl mb-3">🏋️</div>
            <p className="font-semibold text-white mb-1">Nenhum treino criado</p>
            <p className="text-sm mb-5" style={{ color: '#555' }}>Crie seu primeiro treino e vincule a um aluno</p>
            <Link href="/dashboard/personal/treinos/novo"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              + Criar treino
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium" style={{ color: '#555' }}>{treinos.length} treino{treinos.length !== 1 ? 's' : ''}</p>
            {treinos.map(treino => (
              <Link key={treino.id} href={`/dashboard/personal/treinos/${treino.id}`}
                className="flex items-center justify-between p-4 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'rgba(249,115,22,0.15)' }}>🏋️</div>
                  <div>
                    <p className="font-semibold text-white">{treino.nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                      {(treino.profiles as any)?.nome || 'Sem aluno'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={treino.ativo
                      ? { background: 'rgba(249,115,22,0.15)', color: '#f97316' }
                      : { background: '#1c1c1c', color: '#444' }}>
                    {treino.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <span style={{ color: '#f97316' }}>›</span>
                </div>
              </Link>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
