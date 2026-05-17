import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AvaliacoesPersonalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: alunos } = await supabase.from('profiles').select('*').eq('role', 'aluno').eq('personal_id', user.id).order('nome')

  const alunosComMedidas = await Promise.all((alunos || []).map(async (aluno) => {
    const { data: medidas } = await supabase.from('medidas').select('*').eq('aluno_id', aluno.id).order('data', { ascending: false }).limit(2)
    const ultima = medidas?.[0], anterior = medidas?.[1]
    const dias = ultima ? Math.floor((Date.now() - new Date(ultima.data).getTime()) / (1000*60*60*24)) : null
    return { ...aluno, ultima, anterior, dias, total: medidas?.length || 0 }
  }))

  const semAval = alunosComMedidas.filter(a => !a.ultima)
  const comAval = alunosComMedidas.filter(a => a.ultima).sort((a,b) => (b.dias??0)-(a.dias??0))

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <nav className="px-5 py-4 flex items-center gap-3 sticky top-0 z-10" style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/dashboard/personal" style={{ color: '#555' }} className="text-sm hover:text-white">← Dashboard</Link>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <span className="font-bold text-white">📏 Avaliações</span>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {(!alunos || alunos.length === 0) ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: '#141414', border: '1px dashed #2a2a2a' }}>
            <div className="text-5xl mb-3">📏</div>
            <p className="text-sm" style={{ color: '#555' }}>Nenhum aluno vinculado ainda</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[['Total', alunos.length, '👥'], ['Com avaliação', comAval.length, '✅'], ['Sem avaliação', semAval.length, '⚠️']].map(([l,v,i]) => (
                <div key={l as string} className="rounded-2xl p-4 text-center" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                  <div className="text-xl mb-1">{i}</div>
                  <div className="text-2xl font-extrabold text-white">{v}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#555' }}>{l}</div>
                </div>
              ))}
            </div>

            {semAval.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid rgba(251,146,60,0.3)' }}>
                <div className="px-5 py-3" style={{ background: 'rgba(251,146,60,0.08)', borderBottom: '1px solid rgba(251,146,60,0.2)' }}>
                  <p className="font-bold text-sm" style={{ color: '#fb923c' }}>⚠️ Sem nenhuma avaliação</p>
                </div>
                {semAval.map(a => (
                  <Link key={a.id} href={`/dashboard/personal/alunos/${a.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>{a.nome?.charAt(0).toUpperCase()}</div>
                      <p className="font-medium text-white text-sm">{a.nome}</p>
                    </div>
                    <span style={{ color: '#f97316' }}>›</span>
                  </Link>
                ))}
              </div>
            )}

            {comAval.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid #1f1f1f' }}>
                  <p className="font-bold text-white text-sm">📋 Histórico</p>
                </div>
                {comAval.map(a => {
                  const varP = a.ultima?.peso && a.anterior?.peso ? (a.ultima.peso - a.anterior.peso).toFixed(1) : null
                  return (
                    <div key={a.id} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <div className="flex items-center gap-3">
                        {a.avatar_url ? (
                          <img src={a.avatar_url} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>{a.nome?.charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white text-sm">{a.nome}</p>
                            {(a.dias??0) > 30 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>+30 dias</span>}
                          </div>
                          <p className="text-xs" style={{ color: '#444' }}>Há {a.dias} dias · {a.total} avaliações</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {a.ultima.peso && <p className="text-sm font-bold text-white">{a.ultima.peso}kg</p>}
                          {varP && <p className="text-xs font-bold" style={{ color: parseFloat(varP)<0 ? '#4ade80' : '#f87171' }}>{parseFloat(varP)>0?'+':''}{varP}kg</p>}
                        </div>
                        <Link href={`/dashboard/personal/alunos/${a.id}/avaliacoes`} className="text-xs font-bold" style={{ color: '#f97316' }}>Ver →</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
