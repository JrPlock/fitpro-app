'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MetasPage() {
  const [peso, setPeso] = useState(''); const [altura, setAltura] = useState(''); const [idade, setIdade] = useState('')
  const [sexo, setSexo] = useState('masculino'); const [atividade, setAtividade] = useState('1.55'); const [objetivo, setObjetivo] = useState('manter')
  const [tdee, setTdee] = useState<number | null>(null)
  const [metaCal, setMetaCal] = useState('2000'); const [metaProt, setMetaProt] = useState('150'); const [metaCarb, setMetaCarb] = useState('200'); const [metaGord, setMetaGord] = useState('65')
  const [loading, setLoading] = useState(false); const [salvo, setSalvo] = useState(false)
  const router = useRouter(); const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      const { data } = await supabase.from('metas_nutricionais').select('*').eq('aluno_id', user.id).single()
      if (data) { setMetaCal(String(data.meta_calorias)); setMetaProt(String(data.meta_proteina)); setMetaCarb(String(data.meta_carboidrato)); setMetaGord(String(data.meta_gordura)) }
    }
    load()
  }, [])

  function calcular() {
    const p = parseFloat(peso), h = parseFloat(altura), i = parseFloat(idade)
    if (!p || !h || !i) return
    const tmb = sexo === 'masculino' ? 88.36+(13.4*p)+(4.8*h)-(5.7*i) : 447.6+(9.2*p)+(3.1*h)-(4.3*i)
    let cal = Math.round(tmb * parseFloat(atividade))
    if (objetivo === 'emagrecer') cal -= 400; if (objetivo === 'ganhar') cal += 300
    setTdee(cal)
    const prot = Math.round(p*2), gord = Math.round((cal*0.25)/9), carb = Math.round((cal-(prot*4)-(gord*9))/4)
    setMetaCal(String(cal)); setMetaProt(String(prot)); setMetaCarb(String(carb)); setMetaGord(String(gord))
  }

  async function salvar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return
    await supabase.from('metas_nutricionais').upsert({ aluno_id: user.id, meta_calorias: parseInt(metaCal)||2000, meta_proteina: parseInt(metaProt)||150, meta_carboidrato: parseInt(metaCarb)||200, meta_gordura: parseInt(metaGord)||65, updated_at: new Date().toISOString() }, { onConflict: 'aluno_id' })
    setSalvo(true); setLoading(false); setTimeout(() => router.push('/dashboard/aluno/nutricao'), 1000)
  }

  const inp = "w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
  const inpStyle = { background: 'var(--bg-card2)', border: '1px solid #2a2a2a' }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno/nutricao" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Nutrição</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white">🎯 Minhas Metas</span>
        </div>
        <button onClick={salvar} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
          {salvo ? '✅ Salvo!' : loading ? '...' : '💾 Salvar'}
        </button>
      </nav>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-4">
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
          <h2 className="font-bold text-white">🧮 Calculadora de TDEE</h2>
          <div className="grid grid-cols-3 gap-3">
            {[['Peso (kg)', peso, setPeso, '75'], ['Altura (cm)', altura, setAltura, '175'], ['Idade', idade, setIdade, '25']].map(([l, v, s, p]) => (
              <div key={l as string}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{l as string}</label>
                <input type="text" value={v as string} onChange={e => (s as any)(e.target.value)} placeholder={p as string} className={inp} style={inpStyle} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>SEXO</label>
              <select value={sexo} onChange={e => setSexo(e.target.value)} className={inp} style={{ ...inpStyle }}>
                <option value="masculino">Masculino</option><option value="feminino">Feminino</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>ATIVIDADE</label>
              <select value={atividade} onChange={e => setAtividade(e.target.value)} className={inp} style={{ ...inpStyle }}>
                <option value="1.2">Sedentário</option><option value="1.375">Leve</option>
                <option value="1.55">Moderado</option><option value="1.725">Intenso</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[['emagrecer','🔥 Emagrecer','-400 kcal'], ['manter','⚖️ Manter','TDEE'], ['ganhar','💪 Ganhar','+300 kcal']].map(([v,l,s]) => (
              <button key={v} onClick={() => setObjetivo(v)} className="py-3 rounded-xl text-center transition-all"
                style={{ background: objetivo===v ? 'var(--accent-glow)' : 'var(--bg-card2)', border: `1px solid ${objetivo===v ? 'var(--accent)' : 'var(--border)'}`, color: objetivo===v ? 'var(--accent)' : 'var(--text-dim)' }}>
                <div className="text-xs font-bold">{l}</div><div className="text-xs mt-0.5" style={{ color: 'var(--text-dimmer)' }}>{s}</div>
              </button>
            ))}
          </div>
          <button onClick={calcular} className="w-full py-3 rounded-xl font-bold text-white" style={{ background: 'var(--bg-card2)', border: '1px solid #2a2a2a', color: 'var(--accent)' }}>
            🧮 Calcular metas
          </button>
          {tdee && (
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <p className="text-xs" style={{ color: 'var(--accent)' }}>Seu TDEE estimado</p>
              <p className="text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>{tdee} kcal/dia</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
          <h2 className="font-bold text-white">🎯 Metas diárias</h2>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>CALORIAS (kcal)</label>
            <input type="text" value={metaCal} onChange={e => setMetaCal(e.target.value)} className={inp} style={inpStyle} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['PROTEÍNA (g)', metaProt, setMetaProt], ['CARBOIDRATO (g)', metaCarb, setMetaCarb], ['GORDURA (g)', metaGord, setMetaGord]].map(([l, v, s]) => (
              <div key={l as string}>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{l as string}</label>
                <input type="text" value={v as string} onChange={e => (s as any)(e.target.value)} className={inp} style={inpStyle} />
              </div>
            ))}
          </div>
        </div>

        <button onClick={salvar} disabled={loading} className="w-full py-4 rounded-2xl font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', boxShadow: '0 0 25px rgba(249,115,22,0.3)' }}>
          {salvo ? '✅ Salvo!' : loading ? 'Salvando...' : '💾 Salvar metas'}
        </button>
      </main>
    </div>
  )
}
