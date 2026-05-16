import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] })

export const metadata: Metadata = {
  title: 'FitPro — Plataforma de Personal Trainer',
  description: 'Gerencie seus alunos, treinos e dietas em um só lugar.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={dmSans.className}>{children}</body>
    </html>
  )
}
