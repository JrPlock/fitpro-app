'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  icon: string
  label: string
}

interface Props {
  items: NavItem[]
  userName?: string
  avatarUrl?: string
}

export default function MobileNav({ items, userName, avatarUrl }: Props) {
  const pathname = usePathname()

  // Mostra só os 4 principais no bottom nav mobile
  const mainItems = items.slice(0, 4)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 px-2 pb-2"
      style={{ background: 'linear-gradient(to top, #0a0a0a 70%, transparent)' }}>
      <div className="flex items-center justify-around px-2 py-2 rounded-2xl"
        style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
        {mainItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all"
              style={{ color: active ? '#f97316' : '#444' }}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
