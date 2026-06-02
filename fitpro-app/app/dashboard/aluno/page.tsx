import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Phone } from 'lucide-react'

type PacoteAluno = {
  personal_id: string
  tipo_atendimento: 'presencial' | 'online' | 'hibrido'
  data_inicio: string
  data_vencimento: string
  sessoes_semana: number | null
  dias_treino: string[] | null
  status: 'ativo' | 'pausado' | 'cancelado'
  observacoes: string | null
}

type PersonalProfile = {
  id: string
  nome: string | null
  avatar_url: string | null
  logo_url: string | null
  telefone: string | null
  whatsapp: string | null
  instagram: string | null
  site: string | null
  bio: string | null
}

const tipoLabels: Record<PacoteAluno['tipo_atendimento'], string> = {
  presencial: 'Presencial',
  online: 'Online / consultoria',
  hibrido: 'Híbrido',
}

const diasLabels: Record<string, string> = {
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
  domingo: 'Dom',
}

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'; if (h < 18) return 'Boa tarde'; return 'Boa noite'
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function diasAte(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function vencimentoLabel(date: string) {
  const diff = diasAte(date)
  if (diff < 0) return `Vencido há ${Math.abs(diff)} dia${Math.abs(diff) === 1 ? '' : 's'}`
  if (diff === 0) return 'Vence hoje'
  return `Faltam ${diff} dia${diff === 1 ? '' : 's'}`
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, '')
}

function whatsappHref(value: string) {
  const phone = onlyNumbers(value)
  return phone ? `https://wa.me/${phone.startsWith('55') ? phone : `55${phone}`}` : null
}

function instagramHref(value: string) {
  const user = value.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '')
  return user ? `https://instagram.com/${user}` : null
}

function siteHref(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export default async function DashboardAluno() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: treinos }, { data: ultimaMedida }, { data: pacote }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('treinos').select('*').eq('aluno_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('medidas').select('*').eq('aluno_id', user.id).order('data', { ascending: false }).limit(1).single(),
    supabase.from('pacotes_alunos').select('*').eq('aluno_id', user.id).eq('status', 'ativo').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const pacoteAtivo = pacote as PacoteAluno | null
  const { data: personalRows } = await supabase.rpc('get_student_personal_profile')

  const firstName = profile?.nome?.split(' ')[0] || 'Aluno'
  const personal = (personalRows?.[0] || null) as PersonalProfile | null
  const vencimentoDiff = pacoteAtivo ? diasAte(pacoteAtivo.data_vencimento) : null

  return (
    <div className="px-5 py-6 space-y-5 max-w-3xl mx-auto">
      <div className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, var(--bg-card2) 0%, var(--bg-card) 100%)', border: '1px solid var(--border)' }}>
        <p className="text-sm mb-0.5" style={{ color: 'var(--text-muted)' }}>{saudacao()},</p>
        <p className="text-2xl font-extrabold text-white mb-4">{firstName}</p>

        {ultimaMedida ? (
          <div className="grid grid-cols-3 gap-2">
            {[
              ['peso atual', `${ultimaMedida.peso}kg`],
              ['altura', `${ultimaMedida.altura}cm`],
              ['% gordura', `${ultimaMedida.percentual_gordura || '—'}%`],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl p-3" style={{ background: 'var(--bg)' }}>
                <p className="text-xl font-extrabold text-white">{v}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{l}</p>
              </div>
            ))}
          </div>
        ) : (
          <Link href="/dashboard/aluno/medidas/nova"
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'var(--accent-glow)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Registrar primeira medida</span>
            <span style={{ color: 'var(--accent)' }}>→</span>
          </Link>
        )}
      </div>

      {pacoteAtivo && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white">Meu pacote</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>
                {tipoLabels[pacoteAtivo.tipo_atendimento]}
                {pacoteAtivo.sessoes_semana ? ` · ${pacoteAtivo.sessoes_semana}x por semana` : ''}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{
                background: vencimentoDiff !== null && vencimentoDiff < 0 ? 'var(--danger-bg)' : 'var(--accent-glow)',
                color: vencimentoDiff !== null && vencimentoDiff < 0 ? 'var(--danger)' : 'var(--accent)',
                border: `1px solid ${vencimentoDiff !== null && vencimentoDiff < 0 ? 'var(--danger-border)' : 'rgba(249,115,22,0.3)'}`,
              }}>
              {vencimentoLabel(pacoteAtivo.data_vencimento)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-card2)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>INÍCIO</p>
              <p className="font-bold text-white mt-1">{formatDate(pacoteAtivo.data_inicio)}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--bg-card2)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>VENCIMENTO</p>
              <p className="font-bold text-white mt-1">{formatDate(pacoteAtivo.data_vencimento)}</p>
            </div>
          </div>

          {pacoteAtivo.dias_treino && pacoteAtivo.dias_treino.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pacoteAtivo.dias_treino.map(dia => (
                <span key={dia} className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {diasLabels[dia] || dia}
                </span>
              ))}
            </div>
          )}

          {pacoteAtivo.observacoes && (
            <p className="text-sm rounded-xl px-3 py-2" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
              {pacoteAtivo.observacoes}
            </p>
          )}
        </div>
      )}

      {personal && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            {personal.avatar_url ? (
              <img src={personal.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" style={{ border: '2px solid var(--accent)' }} />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-lg"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'white' }}>
                {personal.nome?.charAt(0)?.toUpperCase() || 'P'}
              </div>
            )}
            <div className="min-w-0">
              {personal.logo_url && <img src={personal.logo_url} alt="Logo do personal" className="h-7 max-w-40 object-contain object-left mb-1" />}
              <p className="font-bold text-white truncate">{personal.nome || 'Personal'}</p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Seu personal</p>
            </div>
          </div>

          {personal.bio && (
            <p className="text-sm rounded-xl px-3 py-2" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
              {personal.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {personal.whatsapp && whatsappHref(personal.whatsapp) && (
              <a href={whatsappHref(personal.whatsapp) || '#'} target="_blank" rel="noreferrer"
                aria-label="Abrir WhatsApp do personal"
                className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm transition-all hover:scale-105"
                style={{ background: '#16a34a', color: 'white' }}>
                W
              </a>
            )}
            {personal.instagram && instagramHref(personal.instagram) && (
              <a href={instagramHref(personal.instagram) || '#'} target="_blank" rel="noreferrer"
                aria-label="Abrir Instagram do personal"
                className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #f97316, #db2777, #7c3aed)', color: 'white' }}>
                IG
              </a>
            )}
            {personal.telefone && (
              <a href={`tel:${onlyNumbers(personal.telefone)}`}
                aria-label="Ligar para o personal"
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{ background: 'var(--bg-card2)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                <Phone size={20} />
              </a>
            )}
            {personal.site && siteHref(personal.site) && (
              <a href={siteHref(personal.site) || '#'} target="_blank" rel="noreferrer"
                aria-label="Abrir site do personal"
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{ background: 'var(--bg-card2)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                <ExternalLink size={20} />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:hidden">
        {[
          { label: 'Medidas', href: '/dashboard/aluno/medidas' },
          { label: 'Nutrição', href: '/dashboard/aluno/nutricao' },
        ].map(c => (
          <Link key={c.label} href={c.href}
            className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:scale-[1.02]"
            style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
            <span className="font-semibold text-white text-sm">{c.label}</span>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="font-bold text-white">Meus treinos</span>
          <Link href="/dashboard/aluno/treinos" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Ver todos →</Link>
        </div>
        {treinos && treinos.length > 0 ? treinos.map(treino => (
          <Link key={treino.id} href={`/dashboard/aluno/treinos/${treino.id}`}
            className="flex items-center justify-between px-5 py-4 transition-all hover:bg-white/5"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <p className="text-sm font-semibold text-white">{treino.nome}</p>
              {treino.objetivo && <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{treino.objetivo}</p>}
            </div>
            <span style={{ color: 'var(--accent)' }}>›</span>
          </Link>
        )) : (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Seu personal ainda não enviou treinos</p>
          </div>
        )}
      </div>
    </div>
  )
}
