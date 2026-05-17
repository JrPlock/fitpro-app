'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  href: string
  icon: string
  label: string
}

interface Props {
  items: NavItem[]
  role: 'personal' | 'aluno'
  userName?: string
  avatarUrl?: string
}

export default function Sidebar({ items, role, userName, avatarUrl }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 z-20"
      style={{ background: '#0d0d0d', borderRight: '1px solid #1f1f1f' }}>

      {/* Logo */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid #1f1f1f' }}>
        <span className="text-xl font-extrabold text-white">
          Fit<span style={{ color: '#f97316' }}>Pro</span>
        </span>
        <div className="mt-0.5">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
            {role === 'personal' ? 'Personal' : 'Aluno'}
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
              style={{
                background: active ? 'rgba(249,115,22,0.12)' : 'transparent',
                border: `1px solid ${active ? 'rgba(249,115,22,0.25)' : 'transparent'}`,
              }}>
              <span className="text-lg w-6 text-center">{item.icon}</span>
              <span className="text-sm font-medium transition-colors"
                style={{ color: active ? '#f97316' : '#666' }}
                onMouseEnter={e => { if (!active) (e.target as HTMLElement).style.color = '#aaa' }}
                onMouseLeave={e => { if (!active) (e.target as HTMLElement).style.color = '#666' }}>
                {item.label}
              </span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#f97316' }} />}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid #1f1f1f' }}>
        <Link href={role === 'aluno' ? '/dashboard/aluno/perfil' : '#'}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              style={{ border: '2px solid #f97316' }} />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white' }}>
              {userName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userName || 'Usuário'}</p>
            <p className="text-xs truncate" style={{ color: '#555' }}>{role === 'personal' ? 'Personal Trainer' : 'Aluno'}</p>
          </div>
        </Link>

        <button onClick={sair}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5 text-left">
          <span className="text-lg w-6 text-center">↩</span>
          <span className="text-sm font-medium" style={{ color: '#555' }}>Sair</span>
        </button>
      </div>
    </aside>
  )
}
