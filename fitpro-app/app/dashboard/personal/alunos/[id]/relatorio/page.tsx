import PrintButton from './PrintButton'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RelatorioAlunoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: aluno }, { data: treinos }, { data: medidas }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('treinos').select('*, exercicios(*)').eq('aluno_id', id).eq('personal_id', user.id).order('created_at', { ascending: false }),
    supabase.from('medidas').select('*').eq('aluno_id', id).order('data', { ascending: false }),
  ])

  if (!aluno) redirect('/dashboard/personal/alunos')

  const ultima = medidas?.[0]
  const primeira = medidas?.[medidas.length - 1]

  function var_(campo: string) {
    if (!ultima?.[campo] || !primeira?.[campo] || (medidas?.length ?? 0) < 2) return null
    const d = ultima[campo] - primeira[campo]
    return { val: Math.abs(d).toFixed(1), positivo: d > 0 }
  }

  const varPeso = var_('peso')
  const varGordura = var_('percentual_gordura')
  const totalExercicios = treinos?.reduce((s, t) => s + ((t.exercicios as any[])?.length || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/personal/alunos/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">← Perfil do aluno</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">📊 Relatório — {aluno.nome}</span>
        </div>
        <PrintButton />
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-6 print:p-0">

        {/* Cabeçalho do relatório */}
        <div className="bg-green-600 rounded-2xl p-6 text-white print:rounded-none">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {aluno.nome?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{aluno.nome}</h1>
              <p className="text-green-100 text-sm">{aluno.email}</p>
              <p className="text-green-200 text-xs mt-1">
                Relatório gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Resumo geral */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '📋', label: 'Treinos', value: treinos?.length || 0 },
            { icon: '💪', label: 'Exercícios', value: totalExercicios },
            { icon: '📏', label: 'Avaliações', value: medidas?.length || 0 },
            { icon: '⚖️', label: 'Peso atual', value: ultima?.peso ? `${ultima.peso}kg` : '—' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Evolução física */}
        {(medidas?.length ?? 0) >= 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">📈 Evolução física</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Variação de peso', v: varPeso, unidade: 'kg', bom: !varPeso?.positivo },
                { label: 'Variação de gordura', v: varGordura, unidade: '%', bom: !varGordura?.positivo },
                { label: 'Peso inicial', v: null, valor: primeira?.peso ? `${primeira.peso} kg` : '—' },
                { label: 'Peso final', v: null, valor: ultima?.peso ? `${ultima.peso} kg` : '—' },
                { label: 'Gordura inicial', v: null, valor: primeira?.percentual_gordura ? `${primeira.percentual_gordura}%` : '—' },
                { label: 'Gordura final', v: null, valor: ultima?.percentual_gordura ? `${ultima.percentual_gordura}%` : '—' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  {item.v !== undefined && item.v !== null ? (
                    <div className={`text-xl font-bold ${item.bom ? 'text-green-600' : 'text-red-500'}`}>
                      {item.bom ? '↓' : '↑'} {item.v?.val} {item.unidade}
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-gray-900">{item.valor}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Última avaliação */}
        {ultima && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 text-lg mb-1">📐 Última avaliação</h2>
            <p className="text-sm text-gray-400 mb-4">
              {new Date(ultima.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[
                ['Peso', ultima.peso, 'kg'],
                ['Altura', ultima.altura, 'cm'],
                ['% Gordura', ultima.percentual_gordura, '%'],
                ['Cintura', ultima.cintura, 'cm'],
                ['Quadril', ultima.quadril, 'cm'],
                ['Braço D', ultima.braco_dir, 'cm'],
                ['Braço E', ultima.braco_esq, 'cm'],
                ['Coxa D', ultima.coxa_dir, 'cm'],
                ['Abdômen', ultima.abdomen, 'cm'],
                ['Peitoral', ultima.peitoral, 'cm'],
              ].filter(([, v]) => v).map(([l, v, u]) => (
                <div key={l as string} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{v}</div>
                  <div className="text-xs text-gray-400">{u}</div>
                  <div className="text-xs text-gray-500">{l}</div>
                </div>
              ))}
            </div>
            {ultima.observacoes && (
              <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">💬 {ultima.observacoes}</p>
            )}
          </div>
        )}

        {/* Treinos */}
        {treinos && treinos.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 text-lg mb-4">🏋️ Treinos prescritos</h2>
            <div className="space-y-3">
              {treinos.map(t => (
                <div key={t.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-gray-900">{t.nome}</span>
                      {t.objetivo && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t.objetivo}</span>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${t.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {t.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  {(t.exercicios as any[])?.length > 0 && (
                    <p className="text-xs text-gray-400">{(t.exercicios as any[]).length} exercício{(t.exercicios as any[]).length !== 1 ? 's' : ''}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
