'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const TIPOS = ['Café da manhã', 'Lanche da manhã', 'Almoço', 'Lanche da tarde', 'Jantar', 'Ceia']

interface Alimento { id: string; nome: string; porcao_gramas: number; calorias: number; proteinas: number; carboidratos: number; gorduras: number }

function AdicionarForm() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get('data') || new Date().toISOString().split('T')[0]
  const tipoParam = searchParams.get('tipo') || 'Almoço'

  const [tipo, setTipo] = useState(tipoParam)
  const [busca, setBusca] = useState('')
  const [alimentos, setAlimentos] = useState<Alimento[]>([])
  const [selecionado, setSelecionado] = useState<Alimento | null>(null)
  const [quantidade, setQuantidade] = useState('100')

  // Modo manual
  const [modoManual, setModoManual] = useState(false)
  const [nomeManual, setNomeManual] = useState('')
  const [calManual, setCalManual] = useState('')
  const [protManual, setProtManual] = useState('')
  const [carbManual, setCarbManual] = useState('')
  const [gordManual, setGordManual] = useState('')

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function buscarAlimentos() {
      if (busca.length < 2) { setAlimentos([]); return }
      const { data } = await supabase.from('alimentos').select('*').ilike('nome', `%${busca}%`).limit(8)
      setAlimentos(data || [])
    }
    const t = setTimeout(buscarAlimentos, 300)
    return () => clearTimeout(t)
  }, [busca])

  function calcular(alimento: Alimento, qtd: number) {
    const fator = qtd / alimento.porcao_gramas
    return {
      calorias: +(alimento.calorias * fator).toFixed(1),
      proteinas: +(alimento.proteinas * fator).toFixed(1),
      carboidratos: +(alimento.carboidratos * fator).toFixed(1),
      gorduras: +(alimento.gorduras * fator).toFixed(1),
    }
  }

  async function salvar() {
    setLoading(true)
    setErro('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErro('Sessão expirada.'); setLoading(false); return }

    // Busca ou cria refeição do dia
    let refeicaoId: string
    const { data: refExistente } = await supabase.from('refeicoes').select('id')
      .eq('aluno_id', user.id).eq('data', dataParam).eq('tipo_refeicao', tipo).single()

    if (refExistente) {
      refeicaoId = refExistente.id
    } else {
      const { data: novaRef, error: errRef } = await supabase.from('refeicoes')
        .insert({ aluno_id: user.id, data: dataParam, tipo_refeicao: tipo }).select().single()
      if (errRef || !novaRef) { setErro(`Erro: ${errRef?.message}`); setLoading(false); return }
      refeicaoId = novaRef.id
    }

    let itemData: any
    if (modoManual) {
      if (!nomeManual || !calManual) { setErro('Preencha nome e calorias.'); setLoading(false); return }
      itemData = {
        refeicao_id: refeicaoId,
        nome_manual: nomeManual,
        quantidade_gramas: parseFloat(quantidade) || 100,
        calorias: parseFloat(calManual) || 0,
        proteinas: parseFloat(protManual) || 0,
        carboidratos: parseFloat(carbManual) || 0,
        gorduras: parseFloat(gordManual) || 0,
      }
    } else {
      if (!selecionado) { setErro('Selecione um alimento.'); setLoading(false); return }
      const qtd = parseFloat(quantidade) || 100
      const macros = calcular(selecionado, qtd)
      itemData = {
        refeicao_id: refeicaoId,
        alimento_id: selecionado.id,
        nome_manual: selecionado.nome,
        quantidade_gramas: qtd,
        ...macros,
      }
    }

    const { error } = await supabase.from('refeicao_itens').insert(itemData)
    if (error) { setErro(`Erro: ${error.message}`); setLoading(false); return }
    router.push('/dashboard/aluno/nutricao')
  }

  const qtdNum = parseFloat(quantidade) || 100
  const preview = selecionado ? calcular(selecionado, qtdNum) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno/nutricao" className="text-gray-400 hover:text-gray-600 text-sm">← Nutrição</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">Adicionar alimento</span>
        </div>
        <button onClick={salvar} disabled={loading} className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
          {loading ? 'Salvando...' : '✅ Adicionar'}
        </button>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-5">
        {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{erro}</div>}

        {/* Tipo de refeição */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Refeição</label>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(t => (
              <button key={t} onClick={() => setTipo(t)}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${tipo === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-50'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle manual/busca */}
        <div className="flex gap-2">
          <button onClick={() => setModoManual(false)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${!modoManual ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            🔍 Buscar alimento
          </button>
          <button onClick={() => setModoManual(true)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${modoManual ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            ✏️ Entrada manual
          </button>
        </div>

        {!modoManual ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar alimento</label>
              <input type="text" value={busca} onChange={e => { setBusca(e.target.value); setSelecionado(null) }}
                placeholder="Ex: frango, arroz, banana..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" />
            </div>

            {alimentos.length > 0 && !selecionado && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {alimentos.map(a => (
                  <button key={a.id} onClick={() => { setSelecionado(a); setBusca(a.nome) }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-100 last:border-0 text-left">
                    <span className="text-sm font-medium text-gray-900">{a.nome}</span>
                    <span className="text-xs text-gray-400">{a.calorias} kcal / {a.porcao_gramas}g</span>
                  </button>
                ))}
              </div>
            )}

            {selecionado && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade (gramas)</label>
                <input type="text" value={quantidade} onChange={e => setQuantidade(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" />
              </div>
            )}

            {preview && (
              <div className="bg-green-50 rounded-xl p-4 grid grid-cols-4 gap-3 text-center">
                {[['Calorias', preview.calorias, 'kcal'], ['Proteína', preview.proteinas, 'g'], ['Carbo', preview.carboidratos, 'g'], ['Gordura', preview.gorduras, 'g']].map(([l, v, u]) => (
                  <div key={l as string}>
                    <div className="text-lg font-bold text-green-700">{v}</div>
                    <div className="text-xs text-gray-500">{l} ({u})</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-medium text-gray-900">Entrada manual</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do alimento</label>
              <input type="text" value={nomeManual} onChange={e => setNomeManual(e.target.value)}
                placeholder="Ex: Vitamina caseira" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade (g ou ml)</label>
              <input type="text" value={quantidade} onChange={e => setQuantidade(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calorias (kcal) *</label>
                <input type="text" value={calManual} onChange={e => setCalManual(e.target.value)}
                  placeholder="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proteína (g)</label>
                <input type="text" value={protManual} onChange={e => setProtManual(e.target.value)}
                  placeholder="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carboidrato (g)</label>
                <input type="text" value={carbManual} onChange={e => setCarbManual(e.target.value)}
                  placeholder="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gordura (g)</label>
                <input type="text" value={gordManual} onChange={e => setGordManual(e.target.value)}
                  placeholder="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function AdicionarPage() {
  return <Suspense><AdicionarForm /></Suspense>
}
