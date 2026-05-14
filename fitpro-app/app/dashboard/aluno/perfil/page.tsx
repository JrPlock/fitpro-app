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
      if (data) {
        setProfile(data)
        setNome(data.nome || '')
        setTelefone(data.telefone || '')
        setDataNasc(data.data_nascimento || '')
        setAvatarUrl(data.avatar_url || null)
      }
    }
    carregar()
  }, [])

  async function uploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      setErro('Imagem muito grande. Máximo 3MB.')
      return
    }

    setUploading(true)
    setErro('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (upErr) {
      setErro(`Erro no upload: ${upErr.message}`)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const urlComCache = `${publicUrl}?t=${Date.now()}`

    await supabase.from('profiles').update({ avatar_url: urlComCache }).eq('id', user.id)
    setAvatarUrl(urlComCache)
    setUploading(false)
    setMsg('Foto atualizada!')
    setTimeout(() => setMsg(''), 3000)
  }

  async function salvar() {
    setSaving(true)
    setErro('')
    setMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').update({
      nome,
      telefone: telefone || null,
      data_nascimento: dataNasc || null,
    }).eq('id', user.id)

    if (error) { setErro(`Erro: ${error.message}`); setSaving(false); return }
    setMsg('Perfil atualizado com sucesso!')
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const cls = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">👤 Meu Perfil</span>
        </div>
        <button onClick={sair} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
          Sair
        </button>
      </nav>

      <main className="max-w-lg mx-auto p-6 space-y-5">
        {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3">{msg}</div>}
        {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{erro}</div>}

        {/* Foto de perfil */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar"
                className="w-28 h-28 rounded-full object-cover border-4 border-green-200 shadow-md" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-4xl border-4 border-green-200 shadow-md">
                {nome?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors shadow-md text-lg"
            >
              📷
            </button>
          </div>

          <input ref={fileRef} type="file" accept="image/*" onChange={uploadFoto} className="hidden" />

          <div className="text-center">
            <p className="font-semibold text-gray-900 text-lg">{nome}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-5 py-2 border border-green-300 text-green-700 text-sm font-medium rounded-xl hover:bg-green-50 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Enviando...' : '📷 Alterar foto'}
          </button>
          <p className="text-xs text-gray-400">JPG, PNG ou WEBP · máx. 3MB</p>
        </div>

        {/* Informações pessoais */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-900">✏️ Informações pessoais</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} className={cls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input type="email" value={profile?.email || ''} disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
            <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
              placeholder="(21) 99999-9999" className={cls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
            <input type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)} className={cls} />
          </div>

          <button onClick={salvar} disabled={saving}
            className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
            {saving ? 'Salvando...' : '💾 Salvar alterações'}
          </button>
        </div>
      </main>
    </div>
  )
}
