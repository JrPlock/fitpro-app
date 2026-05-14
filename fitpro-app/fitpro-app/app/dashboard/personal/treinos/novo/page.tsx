'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Exercicio {
  nome: string
  series: number
  repeticoes: string
  descanso_segundos: number
  observacoes: string
}

interface Aluno {
  id: string
  nome: string
  email: string
}

export default function NovoTreinoPage() {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [alunoId, setAlunoId] = useState('')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [exercicios, setExercicios] = useState<Exercicio[]>([
    { nome: '', series: 3, repeticoes: '10-12', descanso_segundos: 60, observacoes: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function carregarAlunos() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .eq('role', 'aluno')
        .eq('personal_id', user.id)
      setAlunos(data || [])
    }
    carregarAlunos()
  }, [])

  function adicionarExercicio() {
    setExercicios([...exercicios, { nome: '', series: 3, repeticoes: '10-12', descanso_segundos: 60, observacoes: '' }])
  }

  function removerExercicio(index: number) {
    setExercicios(exercicios.filter((_, i) => i !== index))
  }

  function atualizarExercicio(index: number, campo: keyof Exercicio, valor: string | number) {
    const novos = [...exercicios]
    novos[index] = { ...novos[index], [campo]: valor }
    setExercicios(novos)
  }

  async function salvarTreino() {
    if (!nome.trim()) { setErro('Dê um nome ao treino.'); return }
    if (exercicios.some(e => !e.nome.trim())) { setErro('Preencha o nome de todos os exercícios.'); return }

    setLoading(true)
    setErro('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: treino, error } = await supabase
      .from('treinos')
      .insert({ nome, descricao, objetivo, personal_id: user.id, aluno_id: alunoId || null })
      .select()
      .single()

    if (error || !treino) {
      setErro('Erro ao salvar treino.')
      setLoading(false)
      return
    }

    const exerciciosData = exercicios.map((ex, i) => ({ ...ex, treino_id: treino.id, ordem: i }))
    await supabase.from('exercicios').insert(exerciciosData)

    router.push(`/dashboard/personal/treinos/${treino.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal/treinos" className="text-gray-400 hover:text-gray-600 text-sm">← Treinos</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">Novo Treino</span>
        </div>
        <button
          onClick={salvarTreino}
          disabled={loading}
          className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Salvando...' : '💾 Salvar Treino'}
        </button>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{erro}</div>
        )}

        {/* Informações gerais */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-900 text-lg">📋 Informações do treino</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do treino *</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="Ex: Treino A — Peito e Tríceps"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
              <select
                value={objetivo}
                onChange={e => setObjetivo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
              >
                <option value="">Selecione...</option>
                <option>Hipertrofia</option>
                <option>Emagrecimento</option>
                <option>Resistência</option>
                <option>Força</option>
                <option>Condicionamento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vincular aluno</label>
              <select
                value={alunoId}
                onChange={e => setAlunoId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
              >
                <option value="">Sem aluno por agora</option>
                {alunos.map(a => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / observações gerais</label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 resize-none"
              placeholder="Informações extras sobre o treino..."
            />
          </div>
        </div>

        {/* Exercícios */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-lg">💪 Exercícios</h2>
            <span className="text-sm text-gray-500">{exercicios.length} exercício{exercicios.length !== 1 ? 's' : ''}</span>
          </div>

          {exercicios.map((ex, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  Exercício {i + 1}
                </span>
                {exercicios.length > 1 && (
                  <button onClick={() => removerExercicio(i)} className="text-red-400 hover:text-red-600 text-sm">
                    🗑 Remover
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do exercício *</label>
                <input
                  value={ex.nome}
                  onChange={e => atualizarExercicio(i, 'nome', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="Ex: Supino reto com barra"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Séries</label>
                  <input
                    type="number"
                    min={1}
                    value={ex.series}
                    onChange={e => atualizarExercicio(i, 'series', parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repetições</label>
                  <input
                    value={ex.repeticoes}
                    onChange={e => atualizarExercicio(i, 'repeticoes', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    placeholder="10-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descanso (seg)</label>
                  <input
                    type="number"
                    min={0}
                    step={15}
                    value={ex.descanso_segundos}
                    onChange={e => atualizarExercicio(i, 'descanso_segundos', parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <input
                  value={ex.observacoes}
                  onChange={e => atualizarExercicio(i, 'observacoes', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  placeholder="Ex: Foco na descida controlada, 3 segundos"
                />
              </div>
            </div>
          ))}

          <button
            onClick={adicionarExercicio}
            className="w-full py-4 border-2 border-dashed border-green-300 text-green-700 font-medium rounded-2xl hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            + Adicionar exercício
          </button>
        </div>

        <button
          onClick={salvarTreino}
          disabled={loading}
          className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 disabled:opacity-50 transition-colors text-lg"
        >
          {loading ? 'Salvando...' : '💾 Salvar Treino'}
        </button>
      </main>
    </div>
  )
}
