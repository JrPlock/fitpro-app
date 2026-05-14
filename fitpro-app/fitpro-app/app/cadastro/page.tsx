'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Role = 'personal' | 'aluno'

export default function CadastroPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState<Role>('aluno')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCadastro() {
    setLoading(true)
    setErro('')

    if (!nome || !email || !senha) {
      setErro('Preencha todos os campos.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, role } },
    })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Cria perfil na tabela profiles (ignora se já existir)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        nome,
        email,
        role,
      }, { onConflict: 'id' })

      router.refresh()
      if (role === 'personal') router.push('/dashboard/personal')
      else router.push('/dashboard/aluno')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl">💪</div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta no FitPro</h1>
          <p className="text-sm text-gray-500">Escolha seu perfil para começar</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'personal', label: 'Personal Trainer', icon: '🏅' },
            { value: 'aluno', label: 'Aluno', icon: '🙋' },
          ] as const).map((r) => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                role === r.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-green-200'
              }`}
            >
              <div className="text-2xl mb-1">{r.icon}</div>
              <div className="text-sm font-medium">{r.label}</div>
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {erro}
            </div>
          )}

          <button
            onClick={handleCadastro}
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link href="/login" className="text-green-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
