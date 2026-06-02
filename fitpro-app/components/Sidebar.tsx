'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

interface NavItem { href: string; icon: string; label: string }
interface Props { items: NavItem[]; role: 'personal' | 'aluno'; userName?: string; avatarUrl?: string; logoUrl?: string | null }

export default function Sidebar({ items, role, userName, avatarUrl, logoUrl }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 z-20"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-sidebar)' }}>

      {/* Logo */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--border-sidebar)' }}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-10 max-w-36 object-contain object-left" />
        ) : (
          <span className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>
            Fit<span style={{ color: 'var(--accent)' }}>Pro</span>
          </span>
        )}
        <div className="mt-1">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent-glow-strong)' }}>
            {role === 'personal' ? 'Personal' : 'Aluno'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard/personal' && item.href !== '/dashboard/aluno' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{
                background: active ? 'var(--accent-glow)' : 'transparent',
                border: `1px solid ${active ? 'var(--accent-glow-strong)' : 'transparent'}`,
              }}>
              <span className="text-lg w-6 text-center">{item.icon}</span>
              <span className="text-sm font-medium" style={{ color: active ? 'var(--accent)' : 'var(--text-dim)' }}>
                {item.label}
              </span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 space-y-2" style={{ borderTop: '1px solid var(--border-sidebar)' }}>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User */}
        <Link href={role === 'aluno' ? '/dashboard/aluno/perfil' : '/dashboard/personal/perfil'}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{ background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              style={{ border: '2px solid var(--accent)' }} />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
              {userName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{userName}</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{role === 'personal' ? 'Personal Trainer' : 'Aluno'}</p>
          </div>
        </Link>

        <button onClick={sair}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <span className="text-lg w-6 text-center">↩</span>
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
