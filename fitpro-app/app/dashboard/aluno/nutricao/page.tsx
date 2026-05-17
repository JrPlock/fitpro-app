'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const TIPOS = ['Café da manhã','Lanche da manhã','Almoço','Lanche da tarde','Jantar','Ceia']

export default function NutricaoPage() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [refeicoes, setRefeicoes] = useState<any[]>([])
  const [metas, setMetas] = useState({ meta_calorias: 2000, meta_proteina: 150, meta_carboidrato: 200, meta_gordura: 65 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function carregar(d: string) {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: refs }, { data: meta }] = await Promise.all([
      supabase.from('refeicoes').select('*, refeicao_itens(*)').eq('aluno_id', user.id).eq('data', d).order('created_at'),
      supabase.from('metas_nutricionais').select('*').eq('aluno_id', user.id).single()
    ])
    setRefeicoes((refs as any) || [])
    if (meta) setMetas(meta)
    setLoading(false)
  }

  useEffect(() => { carregar(data) }, [data])

  async function deletarItem(itemId: string) {
    await supabase.from('refeicao_itens').delete().eq('id', itemId)
    await carregar(data)
  }

  const totais = refeicoes.reduce((acc, ref) => {
    ref.refeicao_itens?.forEach((item: any) => {
      acc.calorias += item.calorias || 0; acc.proteinas += item.proteinas || 0
      acc.carboidratos += item.carboidratos || 0; acc.gorduras += item.gorduras || 0
    })
    return acc
  }, { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 })

  const pctCal = Math.min(Math.round((totais.calorias / metas.meta_calorias) * 100), 100)
  const hoje = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno" style={{ color: '#555' }} className="text-sm hover:text-white">← Dashboard</Link>
          <span style={{ color: '#2a2a2a' }}>|</span>
          <span className="font-bold text-white">🥗 Nutrição</span>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/aluno/nutricao/metas" className="px-3 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#888' }}>🎯 Metas</Link>
          <Link href={`/dashboard/aluno/nutricao/adicionar?data=${data}`}
            className="px-3 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>+ Adicionar</Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {/* Seletor de data */}
        <div className="flex items-center gap-3">
          <button onClick={() => { const d = new Date(data); d.setDate(d.getDate()-1); setData(d.toISOString().split('T')[0]) }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#888' }}>‹</button>
          <div className="flex-1 text-center">
            <span className="font-bold text-white">{data === hoje ? 'Hoje' : new Date(data+'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}</span>
          </div>
          <button onClick={() => { const d = new Date(data); d.setDate(d.getDate()+1); setData(d.toISOString().split('T')[0]) }}
            disabled={data >= hoje}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold disabled:opacity-30"
            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#888' }}>›</button>
        </div>

        {/* Resumo calorias */}
        <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-extrabold" style={{ color: totais.calorias > metas.meta_calorias ? '#f87171' : '#f97316' }}>
              {Math.round(totais.calorias)}
            </span>
            <span className="text-sm mb-1" style={{ color: '#555' }}>/ {metas.meta_calorias} kcal</span>
            <span className="text-xs ml-auto mb-1 font-semibold" style={{ color: '#666' }}>{pctCal}%</span>
          </div>
          <div className="w-full rounded-full h-2 mb-4" style={{ background: '#1c1c1c' }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${pctCal}%`, background: totais.calorias > metas.meta_calorias ? '#f87171' : 'linear-gradient(90deg, #f97316, #ea580c)' }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['Proteína', totais.proteinas, metas.meta_proteina, '#3b82f6'], ['Carboidrato', totais.carboidratos, metas.meta_carboidrato, '#f59e0b'], ['Gordura', totais.gorduras, metas.meta_gordura, '#f97316']].map(([l, a, m, c]) => (
              <div key={l as string}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: '#666' }}>{l}</span>
                  <span style={{ color: (a as number) > (m as number) ? '#f87171' : '#555' }}>{Math.round(a as number)}g</span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: '#1c1c1c' }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(Math.round(((a as number)/(m as number))*100),100)}%`, background: c as string }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Refeições */}
        {loading ? <div className="text-center py-10" style={{ color: '#444' }}>Carregando...</div> :
          TIPOS.map(tipo => {
            const ref = refeicoes.find(r => r.tipo_refeicao === tipo)
            const itens = ref?.refeicao_itens || []
            const calRef = itens.reduce((s: number, i: any) => s + (i.calorias || 0), 0)
            return (
              <div key={tipo} className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1f1f1f' }}>
                  <div>
                    <p className="font-semibold text-white text-sm">{tipo}</p>
                    {calRef > 0 && <p className="text-xs" style={{ color: '#555' }}>{Math.round(calRef)} kcal</p>}
                  </div>
                  <Link href={`/dashboard/aluno/nutricao/adicionar?data=${data}&tipo=${encodeURIComponent(tipo)}`}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                    style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>+ Adicionar</Link>
                </div>
                {itens.length === 0 ? (
                  <p className="px-4 py-3 text-xs italic" style={{ color: '#333' }}>Nenhum alimento registrado</p>
                ) : itens.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <div>
                      <p className="text-sm font-medium text-white">{item.nome_manual}</p>
                      <p className="text-xs" style={{ color: '#444' }}>{item.quantidade_gramas}g</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: '#f97316' }}>{Math.round(item.calorias || 0)} kcal</p>
                        <p className="text-xs" style={{ color: '#444' }}>P:{Math.round(item.proteinas||0)} C:{Math.round(item.carboidratos||0)} G:{Math.round(item.gorduras||0)}</p>
                      </div>
                      <button onClick={() => deletarItem(item.id)} className="text-sm" style={{ color: '#333' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        }
      </main>
    </div>
  )
}
