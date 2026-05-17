import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AlunosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: alunos } = await supabase.from('profiles').select('*').eq('role', 'aluno').eq('personal_id', user.id).order('nome')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal" style={{ color: '#555' }} className="text-sm hover:text-white">← Dashboard</Link>
          <span style={{ color: '#2a2a2a' }}>|</span>
          <span className="font-bold text-white">👥 Meus Alunos</span>
        </div>
        <Link href="/dashboard/personal/alunos/adicionar"
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
          + Vincular
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-3">
        {(!alunos || alunos.length === 0) ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: '#141414', border: '1px dashed #2a2a2a' }}>
            <div className="text-5xl mb-3">👥</div>
            <p className="font-semibold text-white mb-1">Nenhum aluno vinculado</p>
            <p className="text-sm mb-5" style={{ color: '#555' }}>Vincule seu primeiro aluno pelo e-mail</p>
            <Link href="/dashboard/personal/alunos/adicionar"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              + Vincular aluno
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium" style={{ color: '#555' }}>{alunos.length} aluno{alunos.length !== 1 ? 's' : ''} na sua carteira</p>
            {alunos.map(aluno => (
              <Link key={aluno.id} href={`/dashboard/personal/alunos/${aluno.id}`}
                className="flex items-center justify-between p-4 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                <div className="flex items-center gap-3">
                  {aluno.avatar_url ? (
                    <img src={aluno.avatar_url} className="w-11 h-11 rounded-full object-cover" style={{ border: '2px solid #f97316' }} />
                  ) : (
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold"
                      style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>
                      {aluno.nome?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">{aluno.nome}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#555' }}>{aluno.email}</p>
                  </div>
                </div>
                <span style={{ color: '#f97316' }}>›</span>
              </Link>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
