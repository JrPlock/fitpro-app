'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AlunoProfile {
  id: string
  nome: string
  email: string
  personal_id: string | null
}

type TipoAtendimento = 'presencial' | 'online' | 'hibrido'

const diasSemana = [
  { id: 'segunda', label: 'Seg' },
  { id: 'terca', label: 'Ter' },
  { id: 'quarta', label: 'Qua' },
  { id: 'quinta', label: 'Qui' },
  { id: 'sexta', label: 'Sex' },
  { id: 'sabado', label: 'Sáb' },
  { id: 'domingo', label: 'Dom' },
]

function dateOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export default function AdicionarAlunoPage() {
  const [email, setEmail] = useState('')
  const [aluno, setAluno] = useState<AlunoProfile | null>(null)
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento>('presencial')
  const [dataInicio, setDataInicio] = useState(() => dateOffset(0))
  const [dataVencimento, setDataVencimento] = useState(() => dateOffset(30))
  const [sessoesSemana, setSessoesSemana] = useState('3')
  const [diasTreino, setDiasTreino] = useState<string[]>([])
  const [valorMensal, setValorMensal] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [vinculando, setVinculando] = useState(false)
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  async function buscar() {
    const emailNormalizado = email.trim().toLowerCase()
    if (!emailNormalizado) { setErro('Digite um e-mail.'); return }

    setBuscando(true)
    setErro('')
    setAluno(null)
    setMsg('')

    const { data } = await supabase
      .from('profiles')
      .select('id, nome, email, personal_id')
      .eq('email', emailNormalizado)
      .eq('role', 'aluno')
      .single()

    if (!data) setErro('Nenhum aluno encontrado com esse e-mail.')
    else if (data.personal_id) setErro('Este aluno já está vinculado a outro personal.')
    else setAluno(data)

    setBuscando(false)
  }

  function toggleDia(dia: string) {
    setDiasTreino(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia])
  }

  async function vincular() {
    if (!aluno) return
    if (!dataInicio || !dataVencimento) { setErro('Informe a data de início e vencimento do pacote.'); return }
    if (new Date(dataVencimento) < new Date(dataInicio)) { setErro('O vencimento não pode ser anterior ao início.'); return }

    setVinculando(true)
    setErro('')
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setErro('Sua sessão expirou. Entre novamente para vincular o aluno.')
      setVinculando(false)
      return
    }

    const { error: linkError } = await supabase
      .from('profiles')
      .update({ personal_id: user.id })
      .eq('id', aluno.id)
      .is('personal_id', null)

    if (linkError) {
      setErro(`Erro: ${linkError.message}`)
      setVinculando(false)
      return
    }

    const { error: packageError } = await supabase
      .from('pacotes_alunos')
      .insert({
        personal_id: user.id,
        aluno_id: aluno.id,
        tipo_atendimento: tipoAtendimento,
        data_inicio: dataInicio,
        data_vencimento: dataVencimento,
        sessoes_semana: sessoesSemana ? Number(sessoesSemana) : null,
        dias_treino: diasTreino,
        valor_mensal: valorMensal ? Number(valorMensal.replace(',', '.')) : null,
        observacoes: observacoes.trim() || null,
        status: 'ativo',
      })

    if (packageError) {
      await supabase.from('profiles').update({ personal_id: null }).eq('id', aluno.id)
      setErro(`Aluno não foi vinculado porque o pacote não pôde ser criado: ${packageError.message}`)
      setVinculando(false)
      return
    }

    setMsg('Aluno vinculado com pacote ativo!')
    setTimeout(() => router.push('/dashboard/personal/alunos'), 1200)
  }

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
  const fieldStyle = { background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center gap-3 sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard/personal/alunos" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Alunos</Link>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span className="font-bold text-white">Vincular Aluno</span>
      </nav>

      <main className="max-w-md mx-auto px-5 py-6 space-y-4">
        <div className="rounded-2xl p-4 text-sm" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(249,115,22,0.2)', color: 'var(--accent)' }}>
          O aluno precisa criar uma conta no FitPro como <strong>Aluno</strong> primeiro.
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-bold text-white">Buscar por e-mail</h2>
          <div className="flex gap-2">
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setAluno(null); setErro(''); setMsg('') }}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="email@doaluno.com" className={inputCls}
              style={fieldStyle} />
            <button onClick={buscar} disabled={buscando}
              className="px-4 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', minWidth: 48 }}>
              {buscando ? '...' : 'Buscar'}
            </button>
          </div>
          {erro && <p className="text-xs rounded-xl px-3 py-2" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>{erro}</p>}
          {msg && <p className="text-xs rounded-xl px-3 py-2" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(249,115,22,0.3)', color: 'var(--accent)' }}>{msg}</p>}
        </div>

        {aluno && (
          <div className="rounded-2xl p-5 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid rgba(249,115,22,0.4)' }}>
            <div className="space-y-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Aluno encontrado</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  {aluno.nome?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white">{aluno.nome}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{aluno.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-bold text-white">Pacote contratado</h2>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>TIPO DE ATENDIMENTO</label>
                <select value={tipoAtendimento} onChange={e => setTipoAtendimento(e.target.value as TipoAtendimento)}
                  className={inputCls} style={fieldStyle}>
                  <option value="presencial">Presencial</option>
                  <option value="online">Online / consultoria</option>
                  <option value="hibrido">Híbrido</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>INÍCIO</label>
                  <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                    className={inputCls} style={fieldStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>VENCIMENTO</label>
                  <input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)}
                    className={inputCls} style={fieldStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>DIAS/SEMANA</label>
                  <input type="number" min="0" max="14" value={sessoesSemana} onChange={e => setSessoesSemana(e.target.value)}
                    className={inputCls} style={fieldStyle} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>VALOR MENSAL</label>
                  <input type="text" inputMode="decimal" value={valorMensal} onChange={e => setValorMensal(e.target.value)}
                    placeholder="Opcional" className={inputCls} style={fieldStyle} />
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
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>OBSERVAÇÕES</label>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
                  placeholder="Ex: consultoria online com revisão semanal" rows={3}
                  className={inputCls + ' resize-none'} style={fieldStyle} />
              </div>
            </div>

            <button onClick={vincular} disabled={vinculando}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
              {vinculando ? 'Vinculando...' : 'Confirmar vínculo e pacote'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
