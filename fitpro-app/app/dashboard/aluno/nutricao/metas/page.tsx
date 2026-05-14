'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MetasPage() {
  // TDEE calculator
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [idade, setIdade] = useState('')
  const [sexo, setSexo] = useState('masculino')
  const [atividade, setAtividade] = useState('1.55')
  const [objetivo, setObjetivo] = useState('manter')
  const [tdee, setTdee] = useState<number | null>(null)

  // Metas manuais
  const [metaCal, setMetaCal] = useState('2000')
  const [metaProt, setMetaProt] = useState('150')
  const [metaCarb, setMetaCarb] = useState('200')
  const [metaGord, setMetaGord] = useState('65')

  const [loading, setLoading] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('metas_nutricionais').select('*').eq('aluno_id', user.id).single()
      if (data) {
        setMetaCal(String(data.meta_calorias))
        setMetaProt(String(data.meta_proteina))
        setMetaCarb(String(data.meta_carboidrato))
        setMetaGord(String(data.meta_gordura))
      }
    }
    carregar()
  }, [])

  function calcularTDEE() {
    const p = parseFloat(peso), h = parseFloat(altura), i = parseFloat(idade)
    if (!p || !h || !i) return
    const tmb = sexo === 'masculino'
      ? 88.36 + (13.4 * p) + (4.8 * h) - (5.7 * i)
      : 447.6 + (9.2 * p) + (3.1 * h) - (4.3 * i)
    let cal = Math.round(tmb * parseFloat(atividade))
    if (objetivo === 'emagrecer') cal -= 400
    if (objetivo === 'ganhar') cal += 300
    setTdee(cal)

    // Sugere macros automáticos
    const prot = Math.round(p * 2)        // 2g por kg
    const gord = Math.round((cal * 0.25) / 9)  // 25% das calorias
    const carb = Math.round((cal - (prot * 4) - (gord * 9)) / 4)
    setMetaCal(String(cal))
    setMetaProt(String(prot))
    setMetaCarb(String(carb))
    setMetaGord(String(gord))
  }

  async function salvar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('metas_nutricionais').upsert({
      aluno_id: user.id,
      meta_calorias: parseInt(metaCal) || 2000,
      meta_proteina: parseInt(metaProt) || 150,
      meta_carboidrato: parseInt(metaCarb) || 200,
      meta_gordura: parseInt(metaGord) || 65,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'aluno_id' })

    setSalvo(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard/aluno/nutricao'), 1000)
  }

  const cls = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno/nutricao" className="text-gray-400 hover:text-gray-600 text-sm">← Nutrição</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">🎯 Minhas Metas</span>
        </div>
        <button onClick={salvar} disabled={loading}
          className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
          {salvo ? '✅ Salvo!' : loading ? 'Salvando...' : '💾 Salvar metas'}
        </button>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-6">

        {/* Calculadora TDEE */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">🧮 Calculadora de TDEE</h2>
            <p className="text-sm text-gray-400 mt-0.5">Calcula suas calorias e macros ideais automaticamente</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input type="text" value={peso} onChange={e => setPeso(e.target.value)} placeholder="75" className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
              <input type="text" value={altura} onChange={e => setAltura(e.target.value)} placeholder="175" className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
              <input type="text" value={idade} onChange={e => setIdade(e.target.value)} placeholder="25" className={cls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
              <select value={sexo} onChange={e => setSexo(e.target.value)} className={`${cls} bg-white`}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível de atividade</label>
              <select value={atividade} onChange={e => setAtividade(e.target.value)} className={`${cls} bg-white`}>
                <option value="1.2">Sedentário</option>
                <option value="1.375">Leve (1-3x/sem)</option>
                <option value="1.55">Moderado (3-5x/sem)</option>
                <option value="1.725">Intenso (6-7x/sem)</option>
                <option value="1.9">Muito intenso</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo</label>
            <div className="grid grid-cols-3 gap-2">
              {[['emagrecer', '🔥 Emagrecer', '-400 kcal'], ['manter', '⚖️ Manter', 'TDEE'], ['ganhar', '💪 Ganhar massa', '+300 kcal']].map(([v, l, sub]) => (
                <button key={v} onClick={() => setObjetivo(v)}
                  className={`py-3 rounded-xl text-center transition-all border ${objetivo === v ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                  <div className="text-sm font-medium">{l}</div>
                  <div className="text-xs text-gray-400">{sub}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={calcularTDEE}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            🧮 Calcular e preencher metas
          </button>

          {tdee && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-600">Seu TDEE estimado</p>
              <p className="text-3xl font-bold text-blue-700">{tdee} kcal/dia</p>
              <p className="text-xs text-blue-400 mt-1">Os campos abaixo foram preenchidos automaticamente ✓</p>
            </div>
          )}
        </div>

        {/* Metas manuais */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">🎯 Metas diárias</h2>
            <p className="text-sm text-gray-400">Ajuste manualmente se quiser</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calorias (kcal)</label>
            <input type="text" value={metaCal} onChange={e => setMetaCal(e.target.value)} className={cls} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proteína (g)</label>
              <input type="text" value={metaProt} onChange={e => setMetaProt(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carboidrato (g)</label>
              <input type="text" value={metaCarb} onChange={e => setMetaCarb(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gordura (g)</label>
              <input type="text" value={metaGord} onChange={e => setMetaGord(e.target.value)} className={cls} />
            </div>
          </div>

          {/* Preview das macros em % */}
          {metaCal && metaProt && metaCarb && metaGord && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Distribuição calórica</p>
              <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                {(() => {
                  const cal = parseInt(metaCal) || 1
                  const p = (parseInt(metaProt) * 4 / cal) * 100
                  const c = (parseInt(metaCarb) * 4 / cal) * 100
                  const g = (parseInt(metaGord) * 9 / cal) * 100
                  return <>
                    <div className="bg-blue-400 transition-all" style={{ width: `${p}%` }} title={`Proteína ${p.toFixed(0)}%`} />
                    <div className="bg-yellow-400 transition-all" style={{ width: `${c}%` }} title={`Carbo ${c.toFixed(0)}%`} />
                    <div className="bg-orange-400 transition-all" style={{ width: `${g}%` }} title={`Gordura ${g.toFixed(0)}%`} />
                  </>
                })()}
              </div>
              <div className="flex gap-4 mt-2">
                {[['🔵 Proteína', metaProt, 4, 'blue'], ['🟡 Carboidrato', metaCarb, 4, 'yellow'], ['🟠 Gordura', metaGord, 9, 'orange']].map(([l, v, fator, cor]) => (
                  <div key={l as string} className="text-xs text-gray-500">
                    {l}: {Math.round((parseInt(v as string) * (fator as number) / (parseInt(metaCal) || 1)) * 100)}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={salvar} disabled={loading}
          className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 disabled:opacity-50 transition-colors text-lg">
          {salvo ? '✅ Salvo!' : loading ? 'Salvando...' : '💾 Salvar metas'}
        </button>
      </main>
    </div>
  )
}
