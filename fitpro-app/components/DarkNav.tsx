import Link from 'next/link'

interface Props {
  back?: { href: string; label: string }
  title: string
  action?: { href: string; label: string }
}

export default function DarkNav({ back, title, action }: Props) {
  return (
    <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10"
      style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
      <div className="flex items-center gap-3">
        {back && (
          <>
            <Link href={back.href} className="text-sm font-medium transition-colors hover:text-white"
              style={{ color: '#555' }}>← {back.label}</Link>
            <span style={{ color: '#2a2a2a' }}>|</span>
          </>
        )}
        <span className="font-bold text-white">{title}</span>
      </div>
      {action && (
        <Link href={action.href}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
          {action.label}
        </Link>
      )}
    </nav>
  )
}
