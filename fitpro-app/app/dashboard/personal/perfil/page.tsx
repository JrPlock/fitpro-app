'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Profile = {
  nome: string | null
  email: string | null
  avatar_url: string | null
  logo_url: string | null
  telefone: string | null
  whatsapp: string | null
  instagram: string | null
  site: string | null
  bio: string | null
}

const inputCls = 'w-full px-4 py-3 rounded-xl text-sm outline-none transition-all'
const fieldStyle = { background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text)' }

export default function PerfilPersonalPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [site, setSite] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const avatarRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('nome, email, avatar_url, logo_url, telefone, whatsapp, instagram, site, bio')
        .eq('id', user.id)
        .single()

      if (error) {
        setErro(error.message)
        return
      }

      if (data) {
        setProfile(data)
        setNome(data.nome || '')
        setTelefone(data.telefone || '')
        setWhatsapp(data.whatsapp || '')
        setInstagram(data.instagram || '')
        setSite(data.site || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || null)
        setLogoUrl(data.logo_url || null)
      }
    }

    carregar()
  }, [supabase])

  async function uploadImagem(file: File, tipo: 'avatar' | 'logo') {
    if (file.size > 3 * 1024 * 1024) {
      setErro('Use uma imagem de ate 3MB.')
      return
    }

    if (tipo === 'avatar') setUploadingAvatar(true)
    else setUploadingLogo(true)
    setErro('')
    setMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErro('Sessao expirada. Entre novamente.')
      setUploadingAvatar(false)
      setUploadingLogo(false)
      return
    }

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${tipo}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })

    if (uploadError) {
      setErro(uploadError.message)
      setUploadingAvatar(false)
      setUploadingLogo(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${publicUrl}?t=${Date.now()}`
    const { error: updateError } = await supabase
      .from('profiles')
      .update(tipo === 'avatar' ? { avatar_url: url } : { logo_url: url })
      .eq('id', user.id)

    if (updateError) {
      setErro(updateError.message)
    } else {
      if (tipo === 'avatar') setAvatarUrl(url)
      else setLogoUrl(url)
      setMsg(tipo === 'avatar' ? 'Foto atualizada!' : 'Logo atualizada!')
      setTimeout(() => setMsg(''), 3000)
    }

    setUploadingAvatar(false)
    setUploadingLogo(false)
  }

  async function salvar() {
    setSaving(true)
    setErro('')
    setMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErro('Sessao expirada. Entre novamente.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        instagram: instagram.trim() || null,
        site: site.trim() || null,
        bio: bio.trim() || null,
      })
      .eq('id', user.id)

    if (error) {
      setErro(error.message)
      setSaving(false)
      return
    }

    setMsg('Perfil atualizado!')
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Dashboard</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white">Perfil do personal</span>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="text-sm font-medium transition-colors hover:text-white" style={{ color: 'var(--text-dim)' }}>Sair</button>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {msg && <div className="text-xs rounded-xl px-4 py-3" style={{ background: 'var(--accent-glow)', border: '1px solid rgba(249,115,22,0.3)', color: 'var(--accent)' }}>{msg}</div>}
        {erro && <div className="text-xs rounded-xl px-4 py-3" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>{erro}</div>}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 flex flex-col items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover" style={{ border: '3px solid var(--accent)' }} />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center font-extrabold text-3xl"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'white' }}>
                  {nome?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <input ref={avatarRef} type="file" accept="image/*" onChange={event => event.target.files?.[0] && uploadImagem(event.target.files[0], 'avatar')} className="hidden" />
            <div className="text-center">
              <p className="font-bold text-white text-lg">{nome || 'Seu nome'}</p>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{profile?.email}</p>
            </div>
            <button onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'var(--bg-card2)', border: '1px solid rgba(249,115,22,0.4)', color: 'var(--accent)' }}>
              {uploadingAvatar ? 'Enviando...' : 'Alterar foto'}
            </button>
          </div>

          <div className="rounded-2xl p-6 flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="w-full h-24 rounded-xl flex items-center justify-center px-4" style={{ background: 'var(--bg-card2)', border: '1px dashed var(--border)' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-16 max-w-full object-contain" />
              ) : (
                <p className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>Sua logo aparece aqui</p>
              )}
            </div>
            <input ref={logoRef} type="file" accept="image/*" onChange={event => event.target.files?.[0] && uploadImagem(event.target.files[0], 'logo')} className="hidden" />
            <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'var(--bg-card2)', border: '1px solid rgba(249,115,22,0.4)', color: 'var(--accent)' }}>
              {uploadingLogo ? 'Enviando...' : 'Alterar logo'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-bold text-white">Informacoes publicas</h2>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>NOME</label>
            <input value={nome} onChange={event => setNome(event.target.value)} className={inputCls} style={fieldStyle} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>TELEFONE</label>
              <input value={telefone} onChange={event => setTelefone(event.target.value)} placeholder="(21) 99999-9999" className={inputCls} style={fieldStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>WHATSAPP</label>
              <input value={whatsapp} onChange={event => setWhatsapp(event.target.value)} placeholder="(21) 99999-9999" className={inputCls} style={fieldStyle} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>INSTAGRAM</label>
              <input value={instagram} onChange={event => setInstagram(event.target.value)} placeholder="@seuperfil" className={inputCls} style={fieldStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>SITE</label>
              <input value={site} onChange={event => setSite(event.target.value)} placeholder="https://..." className={inputCls} style={fieldStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>BIO / APRESENTACAO</label>
            <textarea value={bio} onChange={event => setBio(event.target.value)}
              rows={4} placeholder="Conte sua especialidade, forma de atendimento e orientacoes para o aluno."
              className={inputCls + ' resize-none'} style={fieldStyle} />
          </div>
          <button onClick={salvar} disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
            {saving ? 'Salvando...' : 'Salvar alteracoes'}
          </button>
        </div>
      </main>
    </div>
  )
}
