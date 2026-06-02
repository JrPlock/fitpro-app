import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/dashboard/aluno', icon: '🏠', label: 'Início' },
  { href: '/dashboard/aluno/treinos', icon: '🏋️', label: 'Treinos' },
  { href: '/dashboard/aluno/medidas', icon: '📏', label: 'Medidas' },
  { href: '/dashboard/aluno/nutricao', icon: '🥗', label: 'Nutrição' },
  { href: '/dashboard/aluno/evolucao', icon: '📈', label: 'Evolução' },
  { href: '/dashboard/aluno/perfil', icon: '👤', label: 'Perfil' },
]

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('nome, avatar_url, role, personal_id').eq('id', user.id).single()
  if (profile?.role !== 'aluno') redirect('/dashboard/personal')

  const { data: personalRows } = await supabase.rpc('get_student_personal_profile')
  const personal = personalRows?.[0] || null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar items={NAV_ITEMS} role="aluno" userName={profile?.nome} avatarUrl={profile?.avatar_url} logoUrl={personal?.logo_url} />

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 sticky top-0 z-10"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border-sidebar)' }}>
        <span className="text-lg font-extrabold flex items-center gap-2 min-w-0" style={{ color: 'var(--text)' }}>
          {personal?.logo_url ? (
            <img src={personal.logo_url} alt="Logo" className="h-9 max-w-32 object-contain object-left" />
          ) : (
            <>Fit<span style={{ color: 'var(--accent)' }}>Pro</span></>
          )}
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent-glow-strong)' }}>
            Aluno
          </span>
        </span>
        <Link href="/dashboard/aluno/perfil">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover"
              style={{ border: '2px solid var(--accent)' }} />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
              {profile?.nome?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </Link>
      </header>

      <main className="md:ml-60 pb-24 md:pb-0">{children}</main>

      <MobileNav items={NAV_ITEMS} role="aluno" userName={profile?.nome} avatarUrl={profile?.avatar_url} logoUrl={personal?.logo_url} />
    </div>
  )
}
