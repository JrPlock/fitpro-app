'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Exercicio {
  id: string
  nome: string
  series: number
  repeticoes: string
  descanso_segundos: number
  observacoes: string
  ordem: number
}

interface Treino {
  id: string
  nome: string
  descricao: string
  objetivo: string
}

export default function TreinoAlunoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [treino, setTreino] = useState<Treino | null>(null)
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [seriesConcluidas, setSeriesConcluidas] = useState<Record<string, boolean[]>>({})
  const [timer, setTimer] = useState<number | null>(null)
  const [timerAtivo, setTimerAtivo] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function carregar() {
      const { data: t } = await supabase.from('treinos').select('*').eq('id', id).single()
      const { data: ex } = await supabase.from('exercicios').select('*').eq('treino_id', id).order('ordem')
      if (t) setTreino(t)
      if (ex) {
        setExercicios(ex)
        const iniciais: Record<string, boolean[]> = {}
        ex.forEach(e => { iniciais[e.id] = Array(e.series).fill(false) })
        setSeriesConcluidas(iniciais)
      }
      setLoading(false)
    }
    carregar()
  }, [id])

  useEffect(() => {
    if (!timerAtivo || timer === null) return
    if (timer <= 0) { setTimerAtivo(false); setTimer(null); return }
    const t = setTimeout(() => setTimer(prev => (prev ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [timer, timerAtivo])

  function toggleSerie(exercicioId: string, serieIndex: number, descanso: number) {
    const atual = seriesConcluidas[exercicioId]?.[serieIndex]
    const novas = [...(seriesConcluidas[exercicioId] || [])]
    novas[serieIndex] = !atual
    setSeriesConcluidas(prev => ({ ...prev, [exercicioId]: novas }))

    if (!atual) {
      setTimer(descanso)
      setTimerAtivo(true)
    }
  }

  function totalSeriesConcluidas() {
    return Object.values(seriesConcluidas).reduce((acc, arr) => acc + arr.filter(Boolean).length, 0)
  }

  function totalSeries() {
    return exercicios.reduce((acc, ex) => acc + ex.series, 0)
  }

  const progresso = totalSeries() > 0 ? Math.round((totalSeriesConcluidas() / totalSeries()) * 100) : 0

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Carregando treino...</div>
    </div>
  )

  if (!treino) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Treino não encontrado</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard/aluno/treinos" className="text-gray-400 hover:text-gray-600 text-sm">← Treinos</Link>
        <span className="text-gray-300">|</span>
        <span className="font-bold text-gray-900 truncate">{treino.nome}</span>
      </nav>

      {/* Timer de descanso */}
      {timerAtivo && timer !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => { setTimerAtivo(false); setTimer(null) }}>
          <div className="bg-white rounded-3xl p-10 text-center shadow-2xl">
            <div className="text-6xl mb-2">⏱️</div>
            <div className="text-7xl font-bold text-green-600 mb-2">{timer}s</div>
            <p className="text-gray-500 text-sm mb-4">Descansando...</p>
            <button className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">
              Toque para pular
            </button>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{treino.nome}</h1>
          {treino.objetivo && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">{treino.objetivo}</span>
          )}
          {treino.descricao && <p className="text-sm text-gray-500 mt-2">{treino.descricao}</p>}

          {/* Progresso */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Progresso do treino</span>
              <span className="font-bold text-green-600">{progresso}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{totalSeriesConcluidas()} de {totalSeries()} séries concluídas</p>
          </div>
        </div>

        {/* Exercícios */}
        <div className="space-y-4">
          {exercicios.map((ex, i) => {
            const series = seriesConcluidas[ex.id] || []
            const todasConcluidas = series.every(Boolean)

            return (
              <div
                key={ex.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${todasConcluidas ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${todasConcluidas ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}>
                    {todasConcluidas ? '✓' : i + 1}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-base ${todasConcluidas ? 'text-green-800' : 'text-gray-900'}`}>{ex.nome}</h3>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span>🔁 {ex.repeticoes} reps</span>
                      <span>⏱ {ex.descanso_segundos >= 60 ? `${Math.floor(ex.descanso_segundos / 60)}min` : `${ex.descanso_segundos}s`} descanso</span>
                    </div>
                  </div>
                </div>

                {ex.observacoes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">💬 {ex.observacoes}</p>
                )}

                <div className="flex gap-2 flex-wrap">
                  {series.map((concluida, si) => (
                    <button
                      key={si}
                      onClick={() => toggleSerie(ex.id, si, ex.descanso_segundos)}
                      className={`flex-1 min-w-16 py-3 rounded-xl text-sm font-bold transition-all ${
                        concluida
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      {concluida ? '✓' : `Série ${si + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {progresso === 100 && (
          <div className="bg-green-600 rounded-2xl p-6 text-center text-white shadow-lg">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-xl font-bold mb-1">Treino concluído!</h2>
            <p className="text-green-100 text-sm">Parabéns! Você completou todas as séries.</p>
          </div>
        )}
      </main>
    </div>
  )
}
