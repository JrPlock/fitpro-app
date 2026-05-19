'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type TipoAtendimento = 'presencial' | 'online' | 'hibrido'
type StatusPacote = 'ativo' | 'pausado' | 'cancelado'

type PacoteAluno = {
  id: string
  tipo_atendimento: TipoAtendimento
  data_inicio: string
  data_vencimento: string
  sessoes_semana: number | null
  dias_treino: string[] | null
  valor_mensal: number | null
  status: StatusPacote
  observacoes: string | null
}

const diasSemana = [
  { id: 'segunda', label: 'Seg' },
  { id: 'terca', label: 'Ter' },
  { id: 'quarta', label: 'Qua' },
  { id: 'quinta', label: 'Qui' },
  { id: 'sexta', label: 'Sex' },
  { id: 'sabado', label: 'Sab' },
  { id: 'domingo', label: 'Dom' },
]

const inputCls = 'w-full px-4 py-3 rounded-xl text-sm outline-none transition-all'
const fieldStyle = { background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)' }

export default function EditarPacotePage() {
  const params = useParams()
  const alunoId = params.id as string
  const [pacoteId, setPacoteId] = useState('')
  const [alunoNome, setAlunoNome] = useState('')
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento>('presencial')
  const [dataInicio, setDataInicio] = useState('')
  const [dataVencimento, setDataVencimento] = useState('')
  const [sessoesSemana, setSessoesSemana] = useState('')
  const [diasTreino, setDiasTreino] = useState<string[]>([])
  const [valorMensal, setValorMensal] = useState('')
  const [status, setStatus] = useState<StatusPacote>('ativo')
  const [observacoes, setObservacoes] = useState('')
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
        setErro('Sessao expirada. Entre novamente para editar o pacote.')
        setLoading(false)
        return
      }

      const [{ data: aluno }, { data: pacote }] = await Promise.all([
        supabase.from('profiles').select('nome').eq('id', alunoId).eq('personal_id', user.id).single(),
        supabase
          .from('pacotes_alunos')
          .select('id, tipo_atendimento, data_inicio, data_vencimento, sessoes_semana, dias_treino, valor_mensal, status, observacoes')
          .eq('aluno_id', alunoId)
          .eq('personal_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (!aluno || !pacote) {
        setErro('Pacote nao encontrado para este aluno.')
        setLoading(false)
        return
      }

      const pacoteData = pacote as PacoteAluno
      setAlunoNome(aluno.nome || '')
      setPacoteId(pacoteData.id)
      setTipoAtendimento(pacoteData.tipo_atendimento)
      setDataInicio(pacoteData.data_inicio)
      setDataVencimento(pacoteData.data_vencimento)
      setSessoesSemana(pacoteData.sessoes_semana ? String(pacoteData.sessoes_semana) : '')
      setDiasTreino(pacoteData.dias_treino || [])
      setValorMensal(pacoteData.valor_mensal ? String(pacoteData.valor_mensal).replace('.', ',') : '')
      setStatus(pacoteData.status)
      setObservacoes(pacoteData.observacoes || '')
      setLoading(false)
    }

    load()
  }, [alunoId, supabase])

  function toggleDia(dia: string) {
    setDiasTreino(prev => prev.includes(dia) ? prev.filter(item => item !== dia) : [...prev, dia])
  }

  async function salvar() {
    if (!dataInicio || !dataVencimento) { setErro('Informe a data de inicio e vencimento do pacote.'); return }
    if (new Date(dataVencimento) < new Date(dataInicio)) { setErro('O vencimento nao pode ser anterior ao inicio.'); return }

    setSaving(true)
    setErro('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErro('Sessao expirada. Entre novamente para salvar o pacote.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('pacotes_alunos')
      .update({
        tipo_atendimento: tipoAtendimento,
        data_inicio: dataInicio,
        data_vencimento: dataVencimento,
        sessoes_semana: sessoesSemana ? Number(sessoesSemana) : null,
        dias_treino: diasTreino,
        valor_mensal: valorMensal ? Number(valorMensal.replace(',', '.')) : null,
        status,
        observacoes: observacoes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pacoteId)
      .eq('aluno_id', alunoId)
      .eq('personal_id', user.id)

    if (error) {
      setErro(error.message)
      setSaving(false)
      return
    }

    router.push(`/dashboard/personal/alunos/${alunoId}`)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><p style={{ color: 'var(--text-dim)' }}>Carregando...</p></div>
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/personal/alunos/${alunoId}`} style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Aluno</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white truncate">Editar pacote</span>
        </div>
        <button onClick={salvar} disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </nav>

      <main className="max-w-md mx-auto px-5 py-6 space-y-4">
        {erro && <p className="text-xs rounded-xl px-3 py-2" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>{erro}</p>}

        <div className="rounded-2xl p-5 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Aluno</p>
            <h1 className="text-xl font-extrabold text-white">{alunoNome}</h1>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>TIPO DE ATENDIMENTO</label>
            <select value={tipoAtendimento} onChange={event => setTipoAtendimento(event.target.value as TipoAtendimento)}
              className={inputCls} style={fieldStyle}>
              <option value="presencial">Presencial</option>
              <option value="online">Online / consultoria</option>
              <option value="hibrido">Hibrido</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>INICIO</label>
              <input type="date" value={dataInicio} onChange={event => setDataInicio(event.target.value)}
                className={inputCls} style={fieldStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>VENCIMENTO</label>
              <input type="date" value={dataVencimento} onChange={event => setDataVencimento(event.target.value)}
                className={inputCls} style={fieldStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>DIAS/SEMANA</label>
              <input type="number" min="0" max="14" value={sessoesSemana} onChange={event => setSessoesSemana(event.target.value)}
                className={inputCls} style={fieldStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>VALOR MENSAL</label>
              <input type="text" inputMode="decimal" value={valorMensal} onChange={event => setValorMensal(event.target.value)}
                className={inputCls} style={fieldStyle} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>DIAS COMBINADOS</label>
            <div className="grid grid-cols-7 gap-1.5">
              {diasSemana.map(dia => {
                const active = diasTreino.includes(dia.id)
                return (
                  <button key={dia.id} type="button" onClick={() => toggleDia(dia.id)}
                    className="py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: active ? 'var(--accent-glow)' : 'var(--bg-card2)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                    }}>
                    {dia.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>STATUS</label>
            <select value={status} onChange={event => setStatus(event.target.value as StatusPacote)}
              className={inputCls} style={fieldStyle}>
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>OBSERVACOES</label>
            <textarea value={observacoes} onChange={event => setObservacoes(event.target.value)}
              rows={3} className={inputCls + ' resize-none'} style={fieldStyle} />
          </div>
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
