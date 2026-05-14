'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdicionarAlunoPage() {
  const [email, setEmail] = useState('')
  const [aluno, setAluno] = useState<any>(null)
  const [buscando, setBuscando] = useState(false)
  const [vinculando, setVinculando] = useState(false)
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function buscar() {
    if (!email.trim()) { setErro('Digite um e-mail.'); return }
    setBuscando(true)
    setErro('')
    setAluno(null)
    setMsg('')

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('role', 'aluno')
      .single()

    if (!data) {
      setErro('Nenhum aluno encontrado com esse e-mail. Verifique se ele já criou uma conta no FitPro como Aluno.')
    } else if (data.personal_id) {
      setErro('Este aluno já está vinculado a outro personal trainer.')
    } else {
      setAluno(data)
    }
    setBuscando(false)
  }

  async function vincular() {
    if (!aluno) return
    setVinculando(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ personal_id: user.id })
      .eq('id', aluno.id)

    if (error) {
      setErro(`Erro ao vincular: ${error.message}`)
      setVinculando(false)
      return
    }

    setMsg('✅ Aluno vinculado com sucesso!')
    setTimeout(() => router.push('/dashboard/personal/alunos'), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href="/dashboard/personal/alunos" className="text-gray-400 hover:text-gray-600 text-sm">← Alunos</Link>
        <span className="text-gray-300">|</span>
        <span className="font-bold text-gray-900">Vincular Aluno</span>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-5">

        {/* Instrução */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
          <strong>Como funciona:</strong> o aluno precisa primeiro criar uma conta no FitPro como <strong>Aluno</strong>. Depois você busca pelo e-mail dele aqui para vincular.
        </div>

        {/* Busca */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-900">Buscar por e-mail</h2>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setAluno(null); setErro(''); setMsg('') }}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="email@doaluno.com"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
            />
            <button onClick={buscar} disabled={buscando}
              className="px-5 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {buscando ? '...' : '🔍'}
            </button>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{erro}</div>
          )}
          {msg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3">{msg}</div>
          )}
        </div>

        {/* Card do aluno encontrado */}
        {aluno && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200 space-y-4">
            <h3 className="font-semibold text-gray-900">Aluno encontrado ✓</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xl">
                {aluno.nome?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-lg">{aluno.nome}</div>
                <div className="text-sm text-gray-500">{aluno.email}</div>
              </div>
            </div>

            <button onClick={vincular} disabled={vinculando}
              className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
              {vinculando ? 'Vinculando...' : '✅ Confirmar vínculo'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
