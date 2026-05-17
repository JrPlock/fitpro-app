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
    setBuscando(true); setErro(''); setAluno(null); setMsg('')
    const { data } = await supabase.from('profiles').select('*').eq('email', email.trim().toLowerCase()).eq('role', 'aluno').single()
    if (!data) setErro('Nenhum aluno encontrado com esse e-mail.')
    else if (data.personal_id) setErro('Este aluno já está vinculado a outro personal.')
    else setAluno(data)
    setBuscando(false)
  }

  async function vincular() {
    if (!aluno) return
    setVinculando(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ personal_id: user.id }).eq('id', aluno.id)
    if (error) { setErro(`Erro: ${error.message}`); setVinculando(false); return }
    setMsg('✅ Aluno vinculado!')
    setTimeout(() => router.push('/dashboard/personal/alunos'), 1500)
  }

  const inputCls = "w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <nav className="px-5 py-4 flex items-center gap-3 sticky top-0 z-10" style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/dashboard/personal/alunos" style={{ color: '#555' }} className="text-sm hover:text-white">← Alunos</Link>
        <span style={{ color: '#2a2a2a' }}>|</span>
        <span className="font-bold text-white">Vincular Aluno</span>
      </nav>

      <main className="max-w-md mx-auto px-5 py-6 space-y-4">
        <div className="rounded-2xl p-4 text-sm" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
          O aluno precisa criar uma conta no FitPro como <strong>Aluno</strong> primeiro.
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
          <h2 className="font-bold text-white">Buscar por e-mail</h2>
          <div className="flex gap-2">
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setAluno(null); setErro(''); setMsg('') }}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="email@doaluno.com" className={inputCls}
              style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }} />
            <button onClick={buscar} disabled={buscando}
              className="px-4 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', minWidth: 48 }}>
              {buscando ? '...' : '🔍'}
            </button>
          </div>
          {erro && <p className="text-xs rounded-xl px-3 py-2" style={{ background: '#1a0a0a', border: '1px solid #3a1515', color: '#f87171' }}>{erro}</p>}
          {msg && <p className="text-xs rounded-xl px-3 py-2" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>{msg}</p>}
        </div>

        {aluno && (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: '#141414', border: '1px solid rgba(249,115,22,0.4)' }}>
            <p className="text-sm font-semibold" style={{ color: '#f97316' }}>Aluno encontrado ✓</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}>
                {aluno.nome?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-white">{aluno.nome}</p>
                <p className="text-sm" style={{ color: '#666' }}>{aluno.email}</p>
              </div>
            </div>
            <button onClick={vincular} disabled={vinculando}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              {vinculando ? 'Vinculando...' : '✅ Confirmar vínculo'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
