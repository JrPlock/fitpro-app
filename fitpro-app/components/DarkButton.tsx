'use client'

interface Props {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  className?: string
  type?: 'button' | 'submit'
  full?: boolean
}

export default function DarkButton({ onClick, disabled, children, variant = 'primary', className = '', full }: Props) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 0 20px rgba(249,115,22,0.25)' },
    secondary: { background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#f97316' },
    danger: { background: '#1c1c1c', border: '1px solid #3a1515', color: '#f87171' },
    ghost: { background: 'transparent', border: '1px solid #2a2a2a', color: '#888' },
  }

  return (
    <button onClick={onClick} disabled={disabled}
      className={`${full ? 'w-full' : ''} px-5 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={styles[variant]}>
      {children}
    </button>
  )
}
