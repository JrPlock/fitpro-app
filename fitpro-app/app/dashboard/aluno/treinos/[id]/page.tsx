'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Exercicio { id: string; nome: string; series: number; repeticoes: string; descanso_segundos: number; observacoes: string; ordem: number }

export default function TreinoAlunoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [treino, setTreino] = useState<any>(null)
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [series, setSeries] = useState<Record<string, boolean[]>>({})
  const [timer, setTimer] = useState<number | null>(null)
  const [timerAtivo, setTimerAtivo] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('treinos').select('*').eq('id', id).single()
      const { data: ex } = await supabase.from('exercicios').select('*').eq('treino_id', id).order('ordem')
      if (t) setTreino(t)
      if (ex) { setExercicios(ex); const s: Record<string,boolean[]> = {}; ex.forEach(e => { s[e.id] = Array(e.series).fill(false) }); setSeries(s) }
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!timerAtivo || timer === null) return
    if (timer <= 0) { setTimerAtivo(false); setTimer(null); return }
    const t = setTimeout(() => setTimer(p => (p ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [timer, timerAtivo])

  function toggleSerie(exId: string, si: number, descanso: number) {
    const atual = series[exId]?.[si]
    const novas = [...(series[exId] || [])]
    novas[si] = !atual
    setSeries(p => ({ ...p, [exId]: novas }))
    if (!atual) { setTimer(descanso); setTimerAtivo(true) }
  }

  const totalFeitas = Object.values(series).reduce((a, arr) => a + arr.filter(Boolean).length, 0)
  const totalSeries = exercicios.reduce((a, ex) => a + ex.series, 0)
  const pct = totalSeries > 0 ? Math.round((totalFeitas / totalSeries) * 100) : 0

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}><p style={{ color: '#555' }}>Carregando...</p></div>
  if (!treino) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}><p style={{ color: '#555' }}>Treino não encontrado</p></div>

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <nav className="px-5 py-4 flex items-center gap-3 sticky top-0 z-10" style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/dashboard/aluno/treinos" style={{ color: '#555' }} className="text-sm hover:text-white">← Treinos</Link>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <span className="font-bold text-white truncate">{treino.nome}</span>
      </nav>

      {timerAtivo && timer !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => { setTimerAtivo(false); setTimer(null) }}>
          <div className="rounded-3xl p-10 text-center" style={{ background: '#141414', border: '1px solid rgba(249,115,22,0.4)' }}>
            <div className="text-5xl mb-3">⏱️</div>
            <div className="text-7xl font-extrabold mb-2" style={{ color: '#f97316' }}>{timer}s</div>
            <p className="text-sm mb-4" style={{ color: '#666' }}>Descansando...</p>
            <p className="text-xs" style={{ color: '#444' }}>Toque para pular</p>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto px-5 py-6 space-y-4">
        <div className="rounded-2xl p-5" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <h1 className="font-extrabold text-white text-lg mb-1">{treino.nome}</h1>
          {treino.objetivo && <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>{treino.objetivo}</span>}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span style={{ color: '#666' }}>Progresso</span>
              <span className="font-bold" style={{ color: '#f97316' }}>{pct}%</span>
            </div>
            <div className="w-full h-3 rounded-full" style={{ background: '#1c1c1c' }}>
              <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f97316, #ea580c)' }} />
            </div>
            <p className="text-xs mt-1" style={{ color: '#444' }}>{totalFeitas} de {totalSeries} séries</p>
          </div>
        </div>

        {exercicios.map((ex, i) => {
          const s = series[ex.id] || []
          const todas = s.every(Boolean)
          return (
            <div key={ex.id} className="rounded-2xl p-5 transition-all" style={{ background: todas ? 'rgba(249,115,22,0.08)' : '#141414', border: `1px solid ${todas ? 'rgba(249,115,22,0.4)' : '#2a2a2a'}` }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: todas ? '#f97316' : 'rgba(249,115,22,0.2)', color: todas ? 'white' : '#f97316' }}>
                  {todas ? '✓' : i + 1}
                </div>
                <div>
                  <p className="font-bold text-white">{ex.nome}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>🔁 {ex.repeticoes} reps · ⏱ {ex.descanso_segundos >= 60 ? `${Math.floor(ex.descanso_segundos/60)}min` : `${ex.descanso_segundos}s`}</p>
                </div>
              </div>
              {ex.observacoes && <p className="text-xs rounded-lg px-3 py-2 mb-3" style={{ background: '#1c1c1c', color: '#666' }}>💬 {ex.observacoes}</p>}
              <div className="flex gap-2">
                {s.map((feita, si) => (
                  <button key={si} onClick={() => toggleSerie(ex.id, si, ex.descanso_segundos)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.03]"
                    style={{ background: feita ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#1c1c1c', color: feita ? 'white' : '#555', border: feita ? 'none' : '1px solid #2a2a2a' }}>
                    {feita ? '✓' : `S${si + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {pct === 100 && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.4)' }}>
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-xl font-extrabold text-white mb-1">Treino concluído!</h2>
            <p className="text-sm" style={{ color: '#f97316' }}>Parabéns! Você completou todas as séries.</p>
          </div>
        )}
      </main>
    </div>
  )
}
