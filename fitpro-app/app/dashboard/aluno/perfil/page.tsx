'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PerfilAlunoPage() {
  const [profile, setProfile] = useState<any>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNasc, setDataNasc] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) { setProfile(data); setNome(data.nome || ''); setTelefone(data.telefone || ''); setDataNasc(data.data_nascimento || ''); setAvatarUrl(data.avatar_url || null) }
    }
    carregar()
  }, [])

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setErro('Máximo 3MB.'); return }
    setUploading(true); setErro('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { setErro(`Erro: ${upErr.message}`); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
    setAvatarUrl(url); setUploading(false); setMsg('Foto atualizada!'); setTimeout(() => setMsg(''), 3000)
  }

  async function salvar() {
    setSaving(true); setErro(''); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ nome, telefone: telefone || null, data_nascimento: dataNasc || null }).eq('id', user.id)
    if (error) { setErro(`Erro: ${error.message}`); setSaving(false); return }
    setMsg('Perfil atualizado!'); setSaving(false); setTimeout(() => setMsg(''), 3000)
  }

  const inputCls = "w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Dashboard</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white">👤 Meu Perfil</span>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="text-sm font-medium transition-colors hover:text-white" style={{ color: 'var(--text-dim)' }}>Sair</button>
      </nav>

      <main className="max-w-md mx-auto px-5 py-6 space-y-4">
        {msg && <div className="text-xs rounded-xl px-4 py-3" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(249,115,22,0.3)', color: 'var(--accent)' }}>{msg}</div>}
        {erro && <div className="text-xs rounded-xl px-4 py-3" style={{ background: 'var(--danger-bg)', border: '1px solid #3a1515', color: 'var(--danger)' }}>{erro}</div>}

        {/* Avatar */}
        <div className="rounded-2xl p-6 flex flex-col items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-24 h-24 rounded-full object-cover" style={{ border: '3px solid #f97316' }} />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center font-extrabold text-3xl"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'white' }}>
                {nome?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
              style={{ background: 'var(--accent)' }}>📷</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadFoto} className="hidden" />
          <div className="text-center">
            <p className="font-bold text-white text-lg">{nome}</p>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{profile?.email}</p>
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: 'var(--bg-card2)', border: '1px solid rgba(249,115,22,0.4)', color: 'var(--accent)' }}>
            {uploading ? 'Enviando...' : '📷 Alterar foto'}
          </button>
        </div>

        {/* Info pessoal */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
          <h2 className="font-bold text-white">Informações pessoais</h2>
          {[
            { label: 'NOME', value: nome, set: setNome, type: 'text', placeholder: 'Seu nome' },
            { label: 'TELEFONE', value: telefone, set: setTelefone, type: 'text', placeholder: '(21) 99999-9999' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
              <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                className={inputCls} style={{ background: 'var(--bg-card2)', border: '1px solid #2a2a2a' }} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>E-MAIL</label>
            <input type="email" value={profile?.email || ''} disabled
              className={inputCls} style={{ background: 'var(--bg)', border: '1px solid #1a1a1a', color: 'var(--text-dimmer)', cursor: 'not-allowed' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>DATA DE NASCIMENTO</label>
            <input type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)}
              className={inputCls} style={{ background: 'var(--bg-card2)', border: '1px solid #2a2a2a' }} />
          </div>
          <button onClick={salvar} disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
            {saving ? 'Salvando...' : '💾 Salvar alterações'}
          </button>
        </div>
      </main>
    </div>
  )
}
