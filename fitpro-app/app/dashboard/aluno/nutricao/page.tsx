'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const TIPOS = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia']

interface Meta { meta_calorias: number; meta_proteina: number; meta_carboidrato: number; meta_gordura: number }
interface Item { calorias: number; proteinas: number; carboidratos: number; gorduras: number; nome_manual: string; quantidade_gramas: number }
interface Refeicao { id: string; tipo_refeicao: string; refeicao_itens: Item[] }

function BarraMacro({ label, atual, meta, cor }: { label: string; atual: number; meta: number; cor: string }) {
  const pct = Math.min(Math.round((atual / meta) * 100), 100)
  const excedeu = atual > meta
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={excedeu ? 'text-red-500 font-semibold' : 'text-gray-500'}>
          {Math.round(atual)}g <span className="text-gray-400">/ {meta}g</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full transition-all ${excedeu ? 'bg-red-400' : cor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function NutricaoPage() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([])
  const [metas, setMetas] = useState<Meta>({ meta_calorias: 2000, meta_proteina: 150, meta_carboidrato: 200, meta_gordura: 65 })
  const [loading, setLoading] = useState(true)
  const [deletando, setDeletando] = useState<string | null>(null)
  const supabase = createClient()

  async function carregar(dataSel: string) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: refs }, { data: meta }] = await Promise.all([
      supabase.from('refeicoes').select('*, refeicao_itens(*)').eq('aluno_id', user.id).eq('data', dataSel).order('created_at'),
      supabase.from('metas_nutricionais').select('*').eq('aluno_id', user.id).single()
    ])

    setRefeicoes((refs as any) || [])
    if (meta) setMetas(meta)
    setLoading(false)
  }

  useEffect(() => { carregar(data) }, [data])

  async function deletarItem(itemId: string) {
    setDeletando(itemId)
    await supabase.from('refeicao_itens').delete().eq('id', itemId)
    await carregar(data)
    setDeletando(null)
  }

  async function deletarRefeicao(refId: string) {
    await supabase.from('refeicao_itens').delete().eq('refeicao_id', refId)
    await supabase.from('refeicoes').delete().eq('id', refId)
    await carregar(data)
  }

  const totais = refeicoes.reduce((acc, ref) => {
    ref.refeicao_itens?.forEach(item => {
      acc.calorias += item.calorias || 0
      acc.proteinas += item.proteinas || 0
      acc.carboidratos += item.carboidratos || 0
      acc.gorduras += item.gorduras || 0
    })
    return acc
  }, { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 })

  const pctCal = Math.min(Math.round((totais.calorias / metas.meta_calorias) * 100), 100)
  const hoje = new Date().toISOString().split('T')[0]
  const dataLabel = data === hoje ? 'Hoje' : new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">🥗 Nutrição</span>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/aluno/nutricao/metas" className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
            🎯 Minhas metas
          </Link>
          <Link href={`/dashboard/aluno/nutricao/adicionar?data=${data}`} className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
            + Adicionar
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Seletor de data */}
        <div className="flex items-center gap-3">
          <button onClick={() => { const d = new Date(data); d.setDate(d.getDate() - 1); setData(d.toISOString().split('T')[0]) }}
            className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600">‹</button>
          <div className="flex-1 text-center">
            <span className="font-semibold text-gray-900">{dataLabel}</span>
            <input type="date" value={data} onChange={e => setData(e.target.value)}
              className="ml-2 text-sm text-gray-400 border-none bg-transparent cursor-pointer" />
          </div>
          <button onClick={() => { const d = new Date(data); d.setDate(d.getDate() + 1); setData(d.toISOString().split('T')[0]) }}
            disabled={data >= hoje}
            className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-30">›</button>
        </div>

        {/* Resumo de calorias */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Calorias do dia</h2>
            <span className="text-sm text-gray-500">{pctCal}% da meta</span>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className={`text-4xl font-bold ${totais.calorias > metas.meta_calorias ? 'text-red-500' : 'text-green-600'}`}>
              {Math.round(totais.calorias)}
            </span>
            <span className="text-gray-400 mb-1">/ {metas.meta_calorias} kcal</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 mb-4">
            <div className={`h-4 rounded-full transition-all ${totais.calorias > metas.meta_calorias ? 'bg-red-400' : 'bg-green-500'}`}
              style={{ width: `${pctCal}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <BarraMacro label="Proteína" atual={totais.proteinas} meta={metas.meta_proteina} cor="bg-blue-400" />
            <BarraMacro label="Carboidrato" atual={totais.carboidratos} meta={metas.meta_carboidrato} cor="bg-yellow-400" />
            <BarraMacro label="Gordura" atual={totais.gorduras} meta={metas.meta_gordura} cor="bg-orange-400" />
          </div>
        </div>

        {/* Refeições */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">Carregando...</div>
        ) : (
          <>
            {TIPOS.map(tipo => {
              const ref = refeicoes.find(r => r.tipo_refeicao === tipo)
              const itens = ref?.refeicao_itens || []
              const calRef = itens.reduce((s, i) => s + (i.calorias || 0), 0)

              return (
                <div key={tipo} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <div>
                      <h3 className="font-semibold text-gray-900">{tipo}</h3>
                      {calRef > 0 && <span className="text-xs text-gray-400">{Math.round(calRef)} kcal</span>}
                    </div>
                    <div className="flex gap-2">
                      {ref && (
                        <button onClick={() => deletarRefeicao(ref.id)} className="text-xs text-red-400 hover:text-red-600">🗑</button>
                      )}
                      <Link href={`/dashboard/aluno/nutricao/adicionar?data=${data}&tipo=${encodeURIComponent(tipo)}`}
                        className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100 transition-colors">
                        + Adicionar
                      </Link>
                    </div>
                  </div>

                  {itens.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-gray-400 italic">Nenhum alimento registrado</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {itens.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between px-5 py-3">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{item.nome_manual}</span>
                            <span className="text-xs text-gray-400 ml-2">{item.quantidade_gramas}g</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">{Math.round(item.calorias || 0)} kcal</div>
                              <div className="text-xs text-gray-400">
                                P:{Math.round(item.proteinas || 0)} C:{Math.round(item.carboidratos || 0)} G:{Math.round(item.gorduras || 0)}
                              </div>
                            </div>
                            <button onClick={() => deletarItem(item.id)} disabled={deletando === item.id}
                              className="text-gray-300 hover:text-red-400 transition-colors text-sm">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </main>
    </div>
  )
}
