'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

interface NavItem { href: string; icon: string; label: string }
interface Props { items: NavItem[]; role: 'personal' | 'aluno'; userName?: string; avatarUrl?: string }

export default function MobileNav({ items, role, userName, avatarUrl }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const mainItems = items.slice(0, 4)

  return (
    <>
      {/* Menu lateral mobile (quando aberto) */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />

          {/* Drawer */}
          <div className="relative w-64 h-full flex flex-col z-50"
            style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-sidebar)' }}>

            {/* Header do menu */}
            <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-sidebar)' }}>
              <span className="text-lg font-extrabold" style={{ color: 'var(--text)' }}>
                Fit<span style={{ color: 'var(--accent)' }}>Pro</span>
              </span>
              <button onClick={() => setMenuOpen(false)} className="text-xl" style={{ color: 'var(--text-dim)' }}>✕</button>
            </div>

            {/* Avatar e nome */}
            <Link href={role === 'aluno' ? '/dashboard/aluno/perfil' : '#'}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-sidebar)' }}>
              {avatarUrl ? (
                <img src={avatarUrl} className="w-11 h-11 rounded-full object-cover" style={{ border: '2px solid var(--accent)' }} />
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
                  {userName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{userName}</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {role === 'personal' ? 'Personal Trainer' : 'Aluno'} · Ver perfil →
                </p>
              </div>
            </Link>

            {/* Nav completo */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {items.map(item => {
                const active = pathname === item.href || (item.href !== '/dashboard/personal' && item.href !== '/dashboard/aluno' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                    style={{
                      background: active ? 'var(--accent-glow)' : 'transparent',
                      border: `1px solid ${active ? 'var(--accent-glow-strong)' : 'transparent'}`,
                    }}>
                    <span className="text-xl w-7 text-center">{item.icon}</span>
                    <span className="text-sm font-medium" style={{ color: active ? 'var(--accent)' : 'var(--text-dim)' }}>
                      {item.label}
                    </span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                  </Link>
                )
              })}
            </nav>

            {/* Theme toggle no menu mobile */}
            <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--border-sidebar)', paddingTop: '1rem' }}>
              <p className="text-xs font-semibold mb-2 px-1" style={{ color: 'var(--text-dim)' }}>TEMA</p>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-2 pb-2"
        style={{ background: `linear-gradient(to top, var(--bg) 70%, transparent)` }}>
        <div className="flex items-center justify-around px-1 py-2 rounded-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {mainItems.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard/personal' && item.href !== '/dashboard/aluno' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
                style={{ color: active ? 'var(--accent)' : 'var(--text-dimmer)' }}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}

          {/* Botão de menu (abre drawer) */}
          <button onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl"
            style={{ color: 'var(--text-dimmer)' }}>
            <span className="text-xl">☰</span>
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </nav>
    </>
  )
}
