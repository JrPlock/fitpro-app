'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
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

  async function handleCadastro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErro('')

    const emailNormalizado = email.trim().toLowerCase()
    if (!nome.trim() || !emailNormalizado || !senha) {
      setErro('Preencha todos os campos.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: emailNormalizado,
      password: senha,
      options: { data: { nome: nome.trim(), role } },
    })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { id: data.user.id, nome: nome.trim(), email: emailNormalizado, role },
          { onConflict: 'id' }
        )

      if (profileError) {
        setErro('Conta criada, mas não foi possível salvar o perfil. Tente entrar novamente em alguns instantes.')
        setLoading(false)
        return
      }

      router.refresh()
      router.push(role === 'personal' ? '/dashboard/personal' : '/dashboard/aluno')
      return
    }

    setErro('Cadastro iniciado. Verifique seu e-mail para confirmar a conta.')
    setLoading(false)
  }

  const inputCls = "w-full px-4 py-3.5 rounded-xl text-white text-sm outline-none transition-all"

  return (
    <main className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--accent-glow) 0%, var(--bg) 60%)' }}>
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-2xl font-extrabold mb-2 text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', boxShadow: '0 0 25px rgba(249,115,22,0.4)' }}>
            FP
          </div>
          <h1 className="text-2xl font-extrabold text-white">Criar conta</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Comece gratuitamente hoje</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'personal', label: 'Personal Trainer', icon: 'PT' },
            { value: 'aluno', label: 'Aluno', icon: 'AL' },
          ] as const).map(r => (
            <button key={r.value} type="button" onClick={() => setRole(r.value)}
              className="p-4 rounded-2xl text-center transition-all"
              style={{
                background: role === r.value ? 'var(--accent-glow)' : 'var(--bg-card)',
                border: `1px solid ${role === r.value ? 'var(--accent)' : 'var(--border)'}`,
                color: role === r.value ? 'var(--accent)' : 'var(--text-muted)'
              }}>
              <div className="text-sm font-extrabold mb-1">{r.icon}</div>
              <div className="text-xs font-semibold">{r.label}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleCadastro} className="card p-6 space-y-4">
          {[
            { label: 'NOME', value: nome, set: setNome, type: 'text', placeholder: 'Seu nome completo' },
            { label: 'E-MAIL', value: email, set: setEmail, type: 'email', placeholder: 'seu@email.com' },
            { label: 'SENHA', value: senha, set: setSenha, type: 'password', placeholder: 'Mínimo 6 caracteres' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
              <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder} className={inputCls}
                style={{ background: 'var(--bg-card2)', border: '1px solid #2a2a2a' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          ))}

          {erro && <p className="text-xs text-red-400 bg-red-950 border border-red-900 rounded-xl px-3 py-2">{erro}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', boxShadow: '0 0 20px rgba(249,115,22,0.3)' }}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm" style={{ color: 'var(--text-dim)' }}>
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>Entrar</Link>
        </p>
      </div>
    </main>
  )
}
