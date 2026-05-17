'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Exercicio { nome: string; series: number; repeticoes: string; descanso_segundos: number; observacoes: string }
interface Aluno { id: string; nome: string; email: string }

const inputCls = "w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"

export default function NovoTreinoPage() {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [alunoId, setAlunoId] = useState('')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [exercicios, setExercicios] = useState<Exercicio[]>([{ nome: '', series: 3, repeticoes: '10-12', descanso_segundos: 60, observacoes: '' }])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('id, nome, email').eq('role', 'aluno').eq('personal_id', user.id)
      setAlunos(data || [])
      const params = new URLSearchParams(window.location.search)
      const alunoParam = params.get('aluno')
      if (alunoParam) setAlunoId(alunoParam)
    }
    load()
  }, [])

  function addEx() { setExercicios([...exercicios, { nome: '', series: 3, repeticoes: '10-12', descanso_segundos: 60, observacoes: '' }]) }
  function removeEx(i: number) { setExercicios(exercicios.filter((_, idx) => idx !== i)) }
  function updateEx(i: number, campo: keyof Exercicio, val: any) {
    const n = [...exercicios]; n[i] = { ...n[i], [campo]: val }; setExercicios(n)
  }

  async function salvar() {
    if (!nome.trim()) { setErro('Dê um nome ao treino.'); return }
    if (exercicios.some(e => !e.nome.trim())) { setErro('Preencha o nome de todos os exercícios.'); return }
    setLoading(true); setErro('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: treino, error } = await supabase.from('treinos')
      .insert({ nome, descricao, objetivo, personal_id: user.id, aluno_id: alunoId || null })
      .select().single()
    if (error || !treino) { setErro('Erro ao salvar.'); setLoading(false); return }
    await supabase.from('exercicios').insert(exercicios.map((ex, i) => ({ ...ex, treino_id: treino.id, ordem: i })))
    router.push(`/dashboard/personal/treinos/${treino.id}`)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal/treinos" style={{ color: '#555' }} className="text-sm hover:text-white">← Treinos</Link>
          <span style={{ color: '#2a2a2a' }}>|</span>
          <span className="font-bold text-white">Novo Treino</span>
        </div>
        <button onClick={salvar} disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
          {loading ? 'Salvando...' : '💾 Salvar'}
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {erro && <div className="text-xs rounded-xl px-4 py-3" style={{ background: '#1a0a0a', border: '1px solid #3a1515', color: '#f87171' }}>{erro}</div>}

        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <h2 className="font-bold text-white">📋 Informações do treino</h2>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#666' }}>NOME DO TREINO *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Treino A — Peito e Tríceps"
              className={inputCls} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#666' }}>OBJETIVO</label>
              <select value={objetivo} onChange={e => setObjetivo(e.target.value)}
                className={inputCls} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                <option value="">Selecione...</option>
                {['Hipertrofia','Emagrecimento','Resistência','Força','Condicionamento'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#666' }}>ALUNO</label>
              <select value={alunoId} onChange={e => setAlunoId(e.target.value)}
                className={inputCls} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}>
                <option value="">Sem aluno</option>
                {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#666' }}>OBSERVAÇÕES</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2}
              className={inputCls + ' resize-none'} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">💪 Exercícios</h2>
            <span className="text-xs" style={{ color: '#555' }}>{exercicios.length} exercício{exercicios.length !== 1 ? 's' : ''}</span>
          </div>

          {exercicios.map((ex, i) => (
            <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>Exercício {i + 1}</span>
                {exercicios.length > 1 && <button onClick={() => removeEx(i)} className="text-xs" style={{ color: '#f87171' }}>🗑 Remover</button>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#666' }}>NOME *</label>
                <input value={ex.nome} onChange={e => updateEx(i, 'nome', e.target.value)} placeholder="Ex: Supino reto com barra"
                  className={inputCls} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[['SÉRIES', 'series', 'number', '3'], ['REPETIÇÕES', 'repeticoes', 'text', '10-12'], ['DESCANSO (s)', 'descanso_segundos', 'number', '60']].map(([l, c, t, p]) => (
                  <div key={l}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#666' }}>{l}</label>
                    <input type={t} value={(ex as any)[c]} placeholder={p}
                      onChange={e => updateEx(i, c as keyof Exercicio, t === 'number' ? parseInt(e.target.value) : e.target.value)}
                      className={inputCls} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#666' }}>OBSERVAÇÕES</label>
                <input value={ex.observacoes} onChange={e => updateEx(i, 'observacoes', e.target.value)}
                  placeholder="Ex: Foco na descida controlada"
                  className={inputCls} style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }} />
              </div>
            </div>
          ))}

          <button onClick={addEx}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01]"
            style={{ border: '1px dashed #2a2a2a', color: '#f97316', background: 'transparent' }}>
            + Adicionar exercício
          </button>
        </div>

        <button onClick={salvar} disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-50 transition-all hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 0 25px rgba(249,115,22,0.3)' }}>
          {loading ? 'Salvando...' : '💾 Salvar Treino'}
        </button>
      </main>
    </div>
  )
}
