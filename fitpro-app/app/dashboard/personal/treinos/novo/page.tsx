'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { EXERCISE_GROUPS, EXERCISE_LIBRARY } from '@/lib/exerciseLibrary'

interface Exercicio {
  nome: string
  series: number
  repeticoes: string
  descanso_segundos: number
  observacoes: string
  video_url: string
}

interface Aluno {
  id: string
  nome: string
  email: string
}

type ExercicioField = {
  label: string
  campo: keyof Exercicio
  type: 'number' | 'text'
  placeholder: string
}

const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
const fieldStyle = { background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)' }

const exercicioFields: ExercicioField[] = [
  { label: 'SÉRIES', campo: 'series', type: 'number', placeholder: '3' },
  { label: 'REPETIÇÕES', campo: 'repeticoes', type: 'text', placeholder: '10-12' },
  { label: 'DESCANSO (s)', campo: 'descanso_segundos', type: 'number', placeholder: '60' },
]

const novoExercicio = (): Exercicio => ({
  nome: '',
  series: 3,
  repeticoes: '10-12',
  descanso_segundos: 60,
  observacoes: '',
  video_url: '',
})

function dateOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export default function NovoTreinoPage() {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [alunoId, setAlunoId] = useState('')
  const [dataVencimento, setDataVencimento] = useState(() => dateOffset(45))
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [exercicios, setExercicios] = useState<Exercicio[]>([novoExercicio()])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .eq('role', 'aluno')
        .eq('personal_id', user.id)
        .order('nome')

      setAlunos(data || [])

      const params = new URLSearchParams(window.location.search)
      const alunoParam = params.get('aluno')
      if (alunoParam) setAlunoId(alunoParam)
    }

    load()
  }, [supabase])

  function addEx() {
    setExercicios(prev => [...prev, novoExercicio()])
  }

  function removeEx(i: number) {
    setExercicios(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateEx(i: number, campo: keyof Exercicio, val: string | number) {
    setExercicios(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [campo]: val }
      return next
    })
  }

  function selectExercise(i: number, exerciseName: string) {
    const exercise = EXERCISE_LIBRARY.find(item => item.name === exerciseName)
    updateEx(i, 'nome', exerciseName)
    updateEx(i, 'video_url', exercise?.gifUrl || '')
  }

  async function salvar() {
    if (!nome.trim()) { setErro('Dê um nome ao treino.'); return }
    if (!alunoId) { setErro('Selecione um aluno para este treino.'); return }
    if (!dataVencimento) { setErro('Informe a data de revisão do treino.'); return }
    if (exercicios.some(e => !e.nome.trim())) { setErro('Preencha o nome de todos os exercícios.'); return }

    setLoading(true)
    setErro('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErro('Sua sessão expirou. Entre novamente para salvar o treino.')
      setLoading(false)
      return
    }

    const { data: treino, error } = await supabase
      .from('treinos')
      .insert({
        nome: nome.trim(),
        descricao,
        objetivo,
        data_vencimento: dataVencimento,
        personal_id: user.id,
        aluno_id: alunoId,
      })
      .select()
      .single()

    if (error || !treino) {
      setErro('Erro ao salvar o treino.')
      setLoading(false)
      return
    }

    const { error: exerciciosError } = await supabase
      .from('exercicios')
      .insert(exercicios.map((ex, i) => ({ ...ex, nome: ex.nome.trim(), treino_id: treino.id, ordem: i })))

    if (exerciciosError) {
      setErro('Treino criado, mas não foi possível salvar os exercícios.')
      setLoading(false)
      return
    }

    router.push(`/dashboard/personal/treinos/${treino.id}`)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal/treinos" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Treinos</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white">Novo Treino</span>
        </div>
        <button onClick={salvar} disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {erro && <div className="text-xs rounded-xl px-4 py-3" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>{erro}</div>}

        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-bold text-white">Informações do treino</h2>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>NOME DO TREINO *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Treino A - Peito e Tríceps"
              className={inputCls} style={fieldStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>OBJETIVO</label>
              <select value={objetivo} onChange={e => setObjetivo(e.target.value)}
                className={inputCls} style={fieldStyle}>
                <option value="">Selecione...</option>
                {['Hipertrofia', 'Emagrecimento', 'Resistência', 'Força', 'Condicionamento'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>ALUNO *</label>
              <select value={alunoId} onChange={e => setAlunoId(e.target.value)}
                className={inputCls} style={fieldStyle}>
                <option value="">Selecione um aluno</option>
                {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>REVISAR/TROCAR ATÉ *</label>
            <input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)}
              className={inputCls} style={fieldStyle} />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>Use essa data para lembrar a troca do treino conforme a evolução do aluno.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>OBSERVAÇÕES</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2}
              className={inputCls + ' resize-none'} style={fieldStyle} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">Exercícios</h2>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{exercicios.length} exercício{exercicios.length !== 1 ? 's' : ''}</span>
          </div>

          {exercicios.map((ex, i) => (
            <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>Exercício {i + 1}</span>
                {exercicios.length > 1 && <button onClick={() => removeEx(i)} className="text-xs" style={{ color: 'var(--danger)' }}>Remover</button>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>BIBLIOTECA</label>
                <select value={EXERCISE_LIBRARY.some(item => item.name === ex.nome) ? ex.nome : ''} onChange={e => selectExercise(i, e.target.value)}
                  className={inputCls} style={fieldStyle}>
                  <option value="">Selecionar exercício...</option>
                  {EXERCISE_GROUPS.map(group => (
                    <optgroup key={group} label={group}>
                      {EXERCISE_LIBRARY.filter(item => item.group === group).map(item => (
                        <option key={item.name} value={item.name}>{item.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>NOME *</label>
                <input value={ex.nome} onChange={e => updateEx(i, 'nome', e.target.value)} placeholder="Ex: Supino reto com barra"
                  className={inputCls} style={fieldStyle} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {exercicioFields.map(({ label, campo, type, placeholder }) => (
                  <div key={campo}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
                    <input type={type} value={ex[campo]} placeholder={placeholder}
                      onChange={e => updateEx(i, campo, type === 'number' ? Number(e.target.value) : e.target.value)}
                      className={inputCls} style={fieldStyle} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>OBSERVAÇÕES</label>
                <input value={ex.observacoes} onChange={e => updateEx(i, 'observacoes', e.target.value)}
                  placeholder="Ex: Foco na descida controlada"
                  className={inputCls} style={fieldStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>VÍDEO OU GIF</label>
                <input type="url" value={ex.video_url} onChange={e => updateEx(i, 'video_url', e.target.value)}
                  placeholder="https://exemplo.com/exercicio.gif"
                  className={inputCls} style={fieldStyle} />
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>Cole um link de vídeo, GIF ou demonstração do exercício.</p>
              </div>
            </div>
          ))}

          <button onClick={addEx}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01]"
            style={{ border: '1px dashed var(--border)', color: 'var(--accent)', background: 'transparent' }}>
            + Adicionar exercício
          </button>
        </div>

        <button onClick={salvar} disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-50 transition-all hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', boxShadow: '0 0 25px rgba(249,115,22,0.3)' }}>
          {loading ? 'Salvando...' : 'Salvar Treino'}
        </button>
      </main>
    </div>
  )
}
