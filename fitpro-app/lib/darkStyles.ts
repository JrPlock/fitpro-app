export const ds = {
  page: { background: '#0a0a0a' } as React.CSSProperties,
  card: { background: '#141414', border: '1px solid #2a2a2a', borderRadius: '1.25rem' } as React.CSSProperties,
  card2: { background: '#1c1c1c', border: '1px solid #2a2a2a', borderRadius: '1rem' } as React.CSSProperties,
  input: { background: '#1c1c1c', border: '1px solid #2a2a2a', color: 'white' } as React.CSSProperties,
  divider: { borderColor: '#1f1f1f' } as React.CSSProperties,
  muted: { color: '#666' } as React.CSSProperties,
  dim: { color: '#444' } as React.CSSProperties,
  orange: { color: '#f97316' } as React.CSSProperties,
  badge: (active: boolean) => ({
    background: active ? 'rgba(249,115,22,0.15)' : '#1c1c1c',
    border: `1px solid ${active ? 'rgba(249,115,22,0.4)' : '#2a2a2a'}`,
    color: active ? '#f97316' : '#555',
    borderRadius: '999px', padding: '2px 10px', fontSize: '12px', fontWeight: 600,
  }) as React.CSSProperties,
  btnPrimary: {
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    boxShadow: '0 0 20px rgba(249,115,22,0.25)',
  } as React.CSSProperties,
  avatar: (letter: string) => letter,
}

export const inputCls = "w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
export const selectCls = "w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
