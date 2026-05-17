import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: alunos } = await supabase.from('profiles').select('*').eq('role', 'aluno').eq('personal_id', user.id).order('nome')

  const alunosInfo = await Promise.all((alunos || []).map(async (aluno) => {
    const [{ data: medidas }, { data: treinos }] = await Promise.all([
      supabase.from('medidas').select('data, peso').eq('aluno_id', aluno.id).order('data', { ascending: false }).limit(1),
      supabase.from('treinos').select('id').eq('aluno_id', aluno.id).eq('ativo', true),
    ])
    return { ...aluno, ultimaMedida: medidas?.[0], treinosAtivos: treinos?.length || 0 }
  }))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center gap-3 sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/dashboard/personal" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Dashboard</Link>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span className="font-bold text-white">📊 Relatórios</span>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-3">
        <p className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>Selecione um aluno para gerar o relatório</p>
        {(!alunos || alunos.length === 0) ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg-card)', border: '1px dashed #2a2a2a' }}>
            <div className="text-5xl mb-3">📊</div>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Nenhum aluno vinculado</p>
          </div>
        ) : alunosInfo.map(aluno => (
          <div key={aluno.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
            <div className="flex items-center gap-3">
              {aluno.avatar_url ? (
                <img src={aluno.avatar_url} className="w-11 h-11 rounded-full object-cover" style={{ border: '2px solid #f97316' }} />
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold"
                  style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{aluno.nome?.charAt(0).toUpperCase()}</div>
              )}
              <div>
                <p className="font-bold text-white">{aluno.nome}</p>
                <div className="flex gap-3 text-xs mt-0.5" style={{ color: 'var(--text-dimmer)' }}>
                  <span>🏋️ {aluno.treinosAtivos} treino{aluno.treinosAtivos !== 1 ? 's' : ''}</span>
                  {aluno.ultimaMedida ? (
                    <span>📅 {new Date(aluno.ultimaMedida.data+'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  ) : <span style={{ color: 'var(--accent)' }}>⚠️ Sem avaliação</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/personal/alunos/${aluno.id}/avaliacoes`}
                className="px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
                📏
              </Link>
              <Link href={`/dashboard/personal/alunos/${aluno.id}/relatorio`}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                📊 Relatório
              </Link>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
