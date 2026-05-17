'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Droplets, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme, type Theme } from './ThemeProvider'

const THEMES: Array<{
  id: Theme
  label: string
  icon: LucideIcon
  color: string
  border: string
}> = [
  { id: 'dark', label: 'Dark', icon: Moon, color: '#1a1a1a', border: '#444' },
  { id: 'light', label: 'Claro', icon: Sun, color: '#f5f5f5', border: '#ddd' },
  { id: 'blue', label: 'Blue', icon: Droplets, color: '#0d1b35', border: '#1e3a6e' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const current = THEMES.find(t => t.id === theme) || THEMES[0]
  const CurrentIcon = current.icon

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl w-full transition-all"
        style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <CurrentIcon size={16} aria-hidden="true" />
        <span className="text-xs font-semibold flex-1 text-left">{current.label}</span>
        {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {THEMES.map(t => {
            const Icon = t.icon

            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false) }}
                className="flex items-center gap-3 w-full px-4 py-3 transition-all text-left"
                style={{
                  background: theme === t.id ? 'var(--accent-glow)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: t.color, border: `2px solid ${theme === t.id ? 'var(--accent)' : t.border}`, color: t.id === 'light' ? '#111' : '#fff' }}>
                  <Icon size={14} aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold" style={{ color: theme === t.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {t.label}
                </span>
                {theme === t.id && <Check size={14} className="ml-auto" style={{ color: 'var(--accent)' }} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
