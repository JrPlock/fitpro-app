import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

const NAV_ITEMS = [
  { href: '/dashboard/personal', icon: '🏠', label: 'Início' },
  { href: '/dashboard/personal/alunos', icon: '👥', label: 'Alunos' },
  { href: '/dashboard/personal/treinos', icon: '🏋️', label: 'Treinos' },
  { href: '/dashboard/personal/avaliacoes', icon: '📏', label: 'Avaliações' },
  { href: '/dashboard/personal/relatorios', icon: '📊', label: 'Relatórios' },
]

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('nome, avatar_url, role').eq('id', user.id).single()
  if (profile?.role !== 'personal') redirect('/dashboard/aluno')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Sidebar desktop */}
      <Sidebar items={NAV_ITEMS} role="personal" userName={profile?.nome} avatarUrl={profile?.avatar_url} />

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 sticky top-0 z-10"
        style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <span className="text-lg font-extrabold text-white">
          Fit<span style={{ color: '#f97316' }}>Pro</span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>Personal</span>
        </span>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover"
            style={{ border: '2px solid #f97316' }} />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }}>
            {profile?.nome?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="md:ml-60 pb-24 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileNav items={NAV_ITEMS} userName={profile?.nome} avatarUrl={profile?.avatar_url} />
    </div>
  )
}
