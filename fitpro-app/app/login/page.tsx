'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true); setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro('E-mail ou senha inválidos.'); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      router.refresh()
      if (profile?.role === 'personal') router.push('/dashboard/personal')
      else router.push('/dashboard/aluno')
    }
  }

  const inputCls = "w-full px-4 py-3.5 rounded-xl text-white text-sm outline-none transition-all"

  return (
    <main className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.1) 0%, #0a0a0a 60%)' }}>
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-3xl mb-2"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 0 25px rgba(249,115,22,0.4)' }}>
            💪
          </div>
          <h1 className="text-2xl font-extrabold text-white">Bem-vindo de volta</h1>
          <p className="text-sm" style={{ color: '#666' }}>Entre na sua conta FitPro</p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#888' }}>E-MAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={inputCls}
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
              onFocus={e => e.target.style.borderColor = '#f97316'}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#888' }}>SENHA</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
              onFocus={e => e.target.style.borderColor = '#f97316'}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>

          {erro && <p className="text-xs text-red-400 bg-red-950 border border-red-900 rounded-xl px-3 py-2">{erro}</p>}

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 0 20px rgba(249,115,22,0.3)' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        <p className="text-center text-sm" style={{ color: '#555' }}>
          Não tem conta?{' '}
          <Link href="/cadastro" className="font-semibold" style={{ color: '#f97316' }}>Cadastre-se</Link>
        </p>
      </div>
    </main>
  )
}
