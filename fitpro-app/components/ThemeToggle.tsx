'use client'

import { useState } from 'react'
import { useTheme } from './ThemeProvider'

const THEMES = [
  { id: 'dark', label: 'Dark', icon: '🌙', color: '#1a1a1a', border: '#444' },
  { id: 'light', label: 'Claro', icon: '☀️', color: '#f5f5f5', border: '#ddd' },
  { id: 'blue', label: 'Blue', icon: '💙', color: '#0d1b35', border: '#1e3a6e' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const current = THEMES.find(t => t.id === theme) || THEMES[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl w-full transition-all"
        style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        <span className="text-base">{current.icon}</span>
        <span className="text-xs font-semibold flex-1 text-left">{current.label}</span>
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id as any); setOpen(false) }}
              className="flex items-center gap-3 w-full px-4 py-3 transition-all text-left"
              style={{
                background: theme === t.id ? 'var(--accent-glow)' : 'transparent',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {/* Preview do tema */}
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                style={{ background: t.color, border: `2px solid ${theme === t.id ? 'var(--accent)' : t.border}` }}>
                {t.icon}
              </div>
              <span className="text-sm font-semibold" style={{ color: theme === t.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                {t.label}
              </span>
              {theme === t.id && <span className="ml-auto text-xs" style={{ color: 'var(--accent)' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
