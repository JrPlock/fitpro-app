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
    setLoading(true); setErro('')
    if (!nome || !email || !senha) { setErro('Preencha todos os campos.'); setLoading(false); return }
    const { data, error } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome, role } } })
    if (error) { setErro(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, nome, email, role }, { onConflict: 'id' })
      router.refresh()
      if (role === 'personal') router.push('/dashboard/personal')
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
          <h1 className="text-2xl font-extrabold text-white">Criar conta</h1>
          <p className="text-sm" style={{ color: '#666' }}>Comece gratuitamente hoje</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'personal', label: 'Personal Trainer', icon: '🏅' },
            { value: 'aluno', label: 'Aluno', icon: '🙋' },
          ] as const).map(r => (
            <button key={r.value} onClick={() => setRole(r.value)}
              className="p-4 rounded-2xl text-center transition-all"
              style={{
                background: role === r.value ? 'rgba(249,115,22,0.15)' : '#141414',
                border: `1px solid ${role === r.value ? '#f97316' : '#2a2a2a'}`,
                color: role === r.value ? '#f97316' : '#666'
              }}>
              <div className="text-2xl mb-1">{r.icon}</div>
              <div className="text-xs font-semibold">{r.label}</div>
            </button>
          ))}
        </div>

        <div className="card p-6 space-y-4">
          {[
            { label: 'NOME', value: nome, set: setNome, type: 'text', placeholder: 'Seu nome completo' },
            { label: 'E-MAIL', value: email, set: setEmail, type: 'email', placeholder: 'seu@email.com' },
            { label: 'SENHA', value: senha, set: setSenha, type: 'password', placeholder: 'Mínimo 6 caracteres' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#888' }}>{f.label}</label>
              <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder} className={inputCls}
                style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
                onFocus={e => e.target.style.borderColor = '#f97316'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
            </div>
          ))}

          {erro && <p className="text-xs text-red-400 bg-red-950 border border-red-900 rounded-xl px-3 py-2">{erro}</p>}

          <button onClick={handleCadastro} disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 0 20px rgba(249,115,22,0.3)' }}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </div>

        <p className="text-center text-sm" style={{ color: '#555' }}>
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold" style={{ color: '#f97316' }}>Entrar</Link>
        </p>
      </div>
    </main>
  )
}
