'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Treino {
  id: string
  nome: string
  objetivo: string | null
  descricao: string | null
}

interface Exercicio {
  id: string
  treino_id: string
  nome: string
  series: number
  repeticoes: string
  descanso_segundos: number
  observacoes: string | null
  video_url: string | null
  ordem: number
}

type Dor = 'nao' | 'leve' | 'moderada' | 'forte'

type RegistroState = {
  concluido: boolean
  peso: string
  dor: Dor
  dificuldade: string
  observacoes: string
  saved: boolean
  saving: boolean
}

type RegistroRow = {
  exercicio_id: string
  concluido: boolean
  peso: number | null
  dor: Dor
  dificuldade: number | null
  observacoes: string | null
}

const registroInicial = (): RegistroState => ({
  concluido: false,
  peso: '',
  dor: 'nao',
  dificuldade: '',
  observacoes: '',
  saved: false,
  saving: false,
})

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function isEmbeddableImage(url: string | null) {
  if (!url) return false
  return /\.(gif|webp|png|jpe?g)(\?.*)?$/i.test(url)
}

export default function TreinoAlunoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [treino, setTreino] = useState<Treino | null>(null)
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [series, setSeries] = useState<Record<string, boolean[]>>({})
  const [registros, setRegistros] = useState<Record<string, RegistroState>>({})
  const [timer, setTimer] = useState<number | null>(null)
  const [timerAtivo, setTimerAtivo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const supabase = useMemo(() => createClient(), [])
  const dataRegistro = useMemo(() => todayISO(), [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setErro('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErro('Sessão expirada. Entre novamente para abrir o treino.')
        setLoading(false)
        return
      }

      const [{ data: treinoData }, { data: exerciciosData }, { data: registrosData }] = await Promise.all([
        supabase.from('treinos').select('id, nome, objetivo, descricao').eq('id', id).eq('aluno_id', user.id).single(),
        supabase.from('exercicios').select('*').eq('treino_id', id).order('ordem'),
        supabase.from('registros_exercicios').select('exercicio_id, concluido, peso, dor, dificuldade, observacoes').eq('treino_id', id).eq('aluno_id', user.id).eq('data', dataRegistro),
      ])

      if (treinoData) setTreino(treinoData)

      if (exerciciosData) {
        setExercicios(exerciciosData)
        const nextSeries: Record<string, boolean[]> = {}
        const nextRegistros: Record<string, RegistroState> = {}
        const registrosPorExercicio = new Map((registrosData as RegistroRow[] | null)?.map(row => [row.exercicio_id, row]) || [])

        exerciciosData.forEach(exercicio => {
          const row = registrosPorExercicio.get(exercicio.id)
          nextSeries[exercicio.id] = Array(exercicio.series).fill(Boolean(row?.concluido))
          nextRegistros[exercicio.id] = row
            ? {
                concluido: row.concluido,
                peso: row.peso ? String(row.peso) : '',
                dor: row.dor,
                dificuldade: row.dificuldade ? String(row.dificuldade) : '',
                observacoes: row.observacoes || '',
                saved: true,
                saving: false,
              }
            : registroInicial()
        })

        setSeries(nextSeries)
        setRegistros(nextRegistros)
      }

      setLoading(false)
    }

    load()
  }, [dataRegistro, id, supabase])

  useEffect(() => {
    if (!timerAtivo || timer === null) return
    if (timer <= 0) {
      const timeout = setTimeout(() => {
        setTimerAtivo(false)
        setTimer(null)
      }, 0)
      return () => clearTimeout(timeout)
    }
    const timeout = setTimeout(() => setTimer(prev => (prev ?? 1) - 1), 1000)
    return () => clearTimeout(timeout)
  }, [timer, timerAtivo])

  function updateRegistro(exercicioId: string, patch: Partial<RegistroState>) {
    setRegistros(prev => ({
      ...prev,
      [exercicioId]: {
        ...(prev[exercicioId] || registroInicial()),
        ...patch,
        saved: false,
      },
    }))
  }

  function toggleSerie(exercicio: Exercicio, serieIndex: number) {
    const atual = series[exercicio.id]?.[serieIndex]
    const novas = [...(series[exercicio.id] || [])]
    novas[serieIndex] = !atual
    setSeries(prev => ({ ...prev, [exercicio.id]: novas }))

    const todasFeitas = novas.length > 0 && novas.every(Boolean)
    updateRegistro(exercicio.id, { concluido: todasFeitas })

    if (!atual) {
      setTimer(exercicio.descanso_segundos)
      setTimerAtivo(true)
    }
  }

  async function salvarRegistro(exercicio: Exercicio) {
    const registro = registros[exercicio.id] || registroInicial()
    setRegistros(prev => ({ ...prev, [exercicio.id]: { ...registro, saving: true } }))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErro('Sessão expirada. Entre novamente para salvar o exercício.')
      setRegistros(prev => ({ ...prev, [exercicio.id]: { ...registro, saving: false } }))
      return
    }

    const { error } = await supabase
      .from('registros_exercicios')
      .upsert({
        treino_id: id,
        exercicio_id: exercicio.id,
        aluno_id: user.id,
        data: dataRegistro,
        concluido: registro.concluido,
        peso: registro.peso ? Number(registro.peso.replace(',', '.')) : null,
        dor: registro.dor,
        dificuldade: registro.dificuldade ? Number(registro.dificuldade) : null,
        observacoes: registro.observacoes.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'aluno_id,exercicio_id,data' })

    if (error) {
      setErro(error.message)
      setRegistros(prev => ({ ...prev, [exercicio.id]: { ...registro, saving: false } }))
      return
    }

    setRegistros(prev => ({ ...prev, [exercicio.id]: { ...registro, saved: true, saving: false } }))
  }

  const totalFeitas = Object.values(series).reduce((total, item) => total + item.filter(Boolean).length, 0)
  const totalSeries = exercicios.reduce((total, exercicio) => total + exercicio.series, 0)
  const pct = totalSeries > 0 ? Math.round((totalFeitas / totalSeries) * 100) : 0

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><p style={{ color: 'var(--text-dim)' }}>Carregando...</p></div>
  if (!treino) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><p style={{ color: 'var(--text-dim)' }}>Treino não encontrado</p></div>

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center gap-3 sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard/aluno/treinos" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Treinos</Link>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span className="font-bold text-white truncate">{treino.nome}</span>
      </nav>

      {timerAtivo && timer !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => { setTimerAtivo(false); setTimer(null) }}>
          <div className="rounded-3xl p-10 text-center" style={{ background: 'var(--bg-card)', border: '1px solid rgba(249,115,22,0.4)' }}>
            <div className="text-7xl font-extrabold mb-2" style={{ color: 'var(--accent)' }}>{timer}s</div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Descansando...</p>
            <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>Toque para pular</p>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto px-5 py-6 space-y-4">
        {erro && <div className="text-xs rounded-xl px-4 py-3" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>{erro}</div>}

        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h1 className="font-extrabold text-white text-lg mb-1">{treino.nome}</h1>
          {treino.objetivo && <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{treino.objetivo}</span>}
          {treino.descricao && <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>{treino.descricao}</p>}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span style={{ color: 'var(--text-muted)' }}>Progresso</span>
              <span className="font-bold" style={{ color: 'var(--accent)' }}>{pct}%</span>
            </div>
            <div className="w-full h-3 rounded-full" style={{ background: 'var(--bg-card2)' }}>
              <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-dark))' }} />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-dimmer)' }}>{totalFeitas} de {totalSeries} séries</p>
          </div>
        </div>

        {exercicios.map((exercicio, index) => {
          const registro = registros[exercicio.id] || registroInicial()
          const seriesExercicio = series[exercicio.id] || []
          const todas = registro.concluido

          return (
            <div key={exercicio.id} className="rounded-2xl p-5 space-y-4 transition-all"
              style={{ background: todas ? 'var(--accent-glow)' : 'var(--bg-card)', border: `1px solid ${todas ? 'var(--accent-glow-strong)' : 'var(--border)'}` }}>
              <div className="flex items-start gap-3">
                <button onClick={() => updateRegistro(exercicio.id, { concluido: !registro.concluido })}
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: todas ? 'var(--accent)' : 'var(--accent-glow)', color: todas ? 'white' : 'var(--accent)' }}>
                  {todas ? '✓' : index + 1}
                </button>
                <div className="min-w-0">
                  <p className="font-bold text-white">{exercicio.nome}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {exercicio.series} séries · {exercicio.repeticoes} reps · {exercicio.descanso_segundos >= 60 ? `${Math.floor(exercicio.descanso_segundos / 60)}min` : `${exercicio.descanso_segundos}s`} descanso
                  </p>
                </div>
              </div>

              {exercicio.video_url && (
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                  {isEmbeddableImage(exercicio.video_url) && (
                    <img src={exercicio.video_url} alt={`Demonstração de ${exercicio.nome}`} className="w-full max-h-64 object-contain" />
                  )}
                  <a href={exercicio.video_url} target="_blank" rel="noreferrer"
                    className="block px-3 py-2 text-sm font-semibold"
                    style={{ color: 'var(--accent)' }}>
                    Abrir vídeo/GIF do exercício
                  </a>
                </div>
              )}

              {exercicio.observacoes && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
                  {exercicio.observacoes}
                </p>
              )}

              <div className="flex gap-2">
                {seriesExercicio.map((feita, serieIndex) => (
                  <button key={serieIndex} onClick={() => toggleSerie(exercicio, serieIndex)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.03]"
                    style={{ background: feita ? 'linear-gradient(135deg, var(--accent), var(--accent-dark))' : 'var(--bg-card2)', color: feita ? 'white' : 'var(--text-dim)', border: feita ? 'none' : '1px solid var(--border)' }}>
                    {feita ? '✓' : `S${serieIndex + 1}`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>PESO USADO</label>
                  <input value={registro.peso} onChange={event => updateRegistro(exercicio.id, { peso: event.target.value })}
                    inputMode="decimal" placeholder="Ex: 40"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>DIFICULDADE</label>
                  <select value={registro.dificuldade} onChange={event => updateRegistro(exercicio.id, { dificuldade: event.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    <option value="">Selecionar</option>
                    <option value="3">Leve</option>
                    <option value="5">Moderado</option>
                    <option value="7">Difícil</option>
                    <option value="9">Muito difícil</option>
                    <option value="10">Máximo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>SENTIU DOR?</label>
                <select value={registro.dor} onChange={event => updateRegistro(exercicio.id, { dor: event.target.value as Dor })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  <option value="nao">Não</option>
                  <option value="leve">Dor leve</option>
                  <option value="moderada">Dor moderada</option>
                  <option value="forte">Dor forte</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>OBSERVAÇÃO DO ALUNO</label>
                <textarea value={registro.observacoes} onChange={event => updateRegistro(exercicio.id, { observacoes: event.target.value })}
                  rows={2} placeholder="Ex: senti o ombro, carga ficou leve, consegui controlar melhor..."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
              </div>

              <button onClick={() => salvarRegistro(exercicio)} disabled={registro.saving}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: registro.saved ? 'var(--success)' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                {registro.saving ? 'Salvando...' : registro.saved ? 'Registro salvo' : 'Salvar exercício'}
              </button>
            </div>
          )
        })}

        {pct === 100 && (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(249,115,22,0.4)' }}>
            <h2 className="text-xl font-extrabold text-white mb-1">Treino concluído!</h2>
            <p className="text-sm" style={{ color: 'var(--accent)' }}>Parabéns, você completou todas as séries.</p>
          </div>
        )}
      </main>
    </div>
  )
}
