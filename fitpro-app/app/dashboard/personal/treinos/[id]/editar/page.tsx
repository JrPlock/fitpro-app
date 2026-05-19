'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { EXERCISE_GROUPS, EXERCISE_LIBRARY } from '@/lib/exerciseLibrary'

type Exercicio = {
  id?: string
  nome: string
  series: number
  repeticoes: string
  descanso_segundos: number
  observacoes: string
  video_url: string
}

type Aluno = {
  id: string
  nome: string
  email: string
}

const inputCls = 'w-full px-4 py-3 rounded-xl text-sm outline-none transition-all'
const fieldStyle = { background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)' }

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

export default function EditarTreinoPage() {
  const params = useParams()
  const treinoId = params.id as string
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [alunoId, setAlunoId] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [dataVencimento, setDataVencimento] = useState('')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [exerciciosOriginais, setExerciciosOriginais] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setErro('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setErro('Sessao expirada. Entre novamente para editar o treino.')
        setLoading(false)
        return
      }

      const [{ data: treino }, { data: exerciciosData }, { data: alunosData }] = await Promise.all([
        supabase.from('treinos').select('id, nome, descricao, objetivo, aluno_id, ativo, data_vencimento').eq('id', treinoId).eq('personal_id', user.id).single(),
        supabase.from('exercicios').select('id, nome, series, repeticoes, descanso_segundos, observacoes, video_url').eq('treino_id', treinoId).order('ordem'),
        supabase.from('profiles').select('id, nome, email').eq('role', 'aluno').eq('personal_id', user.id).order('nome'),
      ])

      if (!treino) {
        setErro('Treino nao encontrado.')
        setLoading(false)
        return
      }

      setNome(treino.nome || '')
      setDescricao(treino.descricao || '')
      setObjetivo(treino.objetivo || '')
      setAlunoId(treino.aluno_id || '')
      setAtivo(Boolean(treino.ativo))
      setDataVencimento(treino.data_vencimento || '')
      setAlunos(alunosData || [])
      setExercicios((exerciciosData || []).map(ex => ({
        id: ex.id,
        nome: ex.nome || '',
        series: ex.series || 3,
        repeticoes: ex.repeticoes || '10-12',
        descanso_segundos: ex.descanso_segundos || 60,
        observacoes: ex.observacoes || '',
        video_url: ex.video_url || '',
      })))
      setExerciciosOriginais((exerciciosData || []).map(ex => ex.id))
      setLoading(false)
    }

    load()
  }, [supabase, treinoId])

  function addEx() {
    setExercicios(prev => [...prev, novoExercicio()])
  }

  function removeEx(index: number) {
    setExercicios(prev => prev.filter((_, idx) => idx !== index))
  }

  function updateEx(index: number, campo: keyof Exercicio, val: string | number | undefined) {
    setExercicios(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [campo]: val }
      return next
    })
  }

  function selectExercise(index: number, exerciseName: string) {
    const exercise = EXERCISE_LIBRARY.find(item => item.name === exerciseName)
    updateEx(index, 'nome', exerciseName)
    updateEx(index, 'video_url', exercise?.gifUrl || '')
  }

  async function salvar() {
    if (!nome.trim()) { setErro('De um nome ao treino.'); return }
    if (!alunoId) { setErro('Selecione um aluno para este treino.'); return }
    if (!dataVencimento) { setErro('Informe a data de revisao do treino.'); return }
    if (exercicios.length === 0) { setErro('Mantenha pelo menos um exercicio no treino.'); return }
    if (exercicios.some(ex => !ex.nome.trim())) { setErro('Preencha o nome de todos os exercicios.'); return }

    setSaving(true)
    setErro('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErro('Sessao expirada. Entre novamente para salvar o treino.')
      setSaving(false)
      return
    }

    const { error: treinoError } = await supabase
      .from('treinos')
      .update({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        objetivo: objetivo || null,
        aluno_id: alunoId,
        ativo,
        data_vencimento: dataVencimento,
      })
      .eq('id', treinoId)
      .eq('personal_id', user.id)

    if (treinoError) {
      setErro(treinoError.message)
      setSaving(false)
      return
    }

    const idsAtuais = exercicios.map(ex => ex.id).filter(Boolean) as string[]
    const idsRemovidos = exerciciosOriginais.filter(id => !idsAtuais.includes(id))

    if (idsRemovidos.length > 0) {
      const { error } = await supabase.from('exercicios').delete().in('id', idsRemovidos).eq('treino_id', treinoId)
      if (error) {
        setErro(error.message)
        setSaving(false)
        return
      }
    }

    for (const [ordem, exercicio] of exercicios.entries()) {
      const payload = {
        treino_id: treinoId,
        nome: exercicio.nome.trim(),
        series: Number(exercicio.series) || 1,
        repeticoes: exercicio.repeticoes || '10-12',
        descanso_segundos: Number(exercicio.descanso_segundos) || 60,
        observacoes: exercicio.observacoes.trim() || null,
        video_url: exercicio.video_url.trim() || null,
        ordem,
      }

      const { error } = exercicio.id
        ? await supabase.from('exercicios').update(payload).eq('id', exercicio.id).eq('treino_id', treinoId)
        : await supabase.from('exercicios').insert(payload)

      if (error) {
        setErro(error.message)
        setSaving(false)
        return
      }
    }

    router.push(`/dashboard/personal/treinos/${treinoId}`)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><p style={{ color: 'var(--text-dim)' }}>Carregando...</p></div>
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/personal/treinos/${treinoId}`} style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Treino</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white">Editar Treino</span>
        </div>
        <button onClick={salvar} disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {erro && <div className="text-xs rounded-xl px-4 py-3" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>{erro}</div>}

        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-bold text-white">Informacoes do treino</h2>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>NOME DO TREINO *</label>
            <input value={nome} onChange={event => setNome(event.target.value)} className={inputCls} style={fieldStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>OBJETIVO</label>
              <select value={objetivo} onChange={event => setObjetivo(event.target.value)} className={inputCls} style={fieldStyle}>
                <option value="">Selecione...</option>
                {['Hipertrofia', 'Emagrecimento', 'Resistencia', 'Forca', 'Condicionamento'].map(item => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>ALUNO *</label>
              <select value={alunoId} onChange={event => setAlunoId(event.target.value)} className={inputCls} style={fieldStyle}>
                <option value="">Selecione um aluno</option>
                {alunos.map(aluno => <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label className="block text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>REVISAR/TROCAR ATE *</label>
                <button type="button" onClick={() => setDataVencimento(dateOffset(45))} className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                  usar 45 dias
                </button>
              </div>
              <input type="date" value={dataVencimento} onChange={event => setDataVencimento(event.target.value)} className={inputCls} style={fieldStyle} />
            </div>
            <label className="flex items-center gap-3 rounded-xl px-4 py-3 mt-6" style={fieldStyle}>
              <input type="checkbox" checked={ativo} onChange={event => setAtivo(event.target.checked)} />
              <span className="text-sm font-semibold text-white">Treino ativo</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>OBSERVACOES</label>
            <textarea value={descricao} onChange={event => setDescricao(event.target.value)} rows={2}
              className={inputCls + ' resize-none'} style={fieldStyle} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">Exercicios</h2>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{exercicios.length} exercicio{exercicios.length !== 1 ? 's' : ''}</span>
          </div>

          {exercicios.map((exercicio, index) => (
            <div key={exercicio.id || index} className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>Exercicio {index + 1}</span>
                {exercicios.length > 1 && <button onClick={() => removeEx(index)} className="text-xs" style={{ color: 'var(--danger)' }}>Remover</button>}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>BIBLIOTECA</label>
                <select value={EXERCISE_LIBRARY.some(item => item.name === exercicio.nome) ? exercicio.nome : ''} onChange={event => selectExercise(index, event.target.value)}
                  className={inputCls} style={fieldStyle}>
                  <option value="">Selecionar exercicio...</option>
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
                <input value={exercicio.nome} onChange={event => updateEx(index, 'nome', event.target.value)} className={inputCls} style={fieldStyle} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>SERIES</label>
                  <input type="number" value={exercicio.series} onChange={event => updateEx(index, 'series', Number(event.target.value))} className={inputCls} style={fieldStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>REPS</label>
                  <input value={exercicio.repeticoes} onChange={event => updateEx(index, 'repeticoes', event.target.value)} className={inputCls} style={fieldStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>DESCANSO</label>
                  <input type="number" value={exercicio.descanso_segundos} onChange={event => updateEx(index, 'descanso_segundos', Number(event.target.value))} className={inputCls} style={fieldStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>OBSERVACOES</label>
                <input value={exercicio.observacoes} onChange={event => updateEx(index, 'observacoes', event.target.value)} className={inputCls} style={fieldStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>VIDEO OU GIF</label>
                <input type="url" value={exercicio.video_url} onChange={event => updateEx(index, 'video_url', event.target.value)} className={inputCls} style={fieldStyle} />
              </div>
            </div>
          ))}

          <button onClick={addEx}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01]"
            style={{ border: '1px dashed var(--border)', color: 'var(--accent)', background: 'transparent' }}>
            + Adicionar exercicio
          </button>
        </div>

        <button onClick={salvar} disabled={saving}
          className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-50 transition-all hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
          {saving ? 'Salvando...' : 'Salvar alteracoes'}
        </button>
      </main>
    </div>
  )
}
