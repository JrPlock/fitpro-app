import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'personal') redirect('/dashboard/personal')
    else redirect('/dashboard/aluno')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.12) 0%, #0a0a0a 60%)' }}>

      {/* Glow decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)' }} />

      <div className="max-w-md w-full text-center space-y-10 relative z-10">
        {/* Logo */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-4xl orange-glow"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            💪
          </div>
          <h1 className="text-5xl font-extrabold text-white">FitPro</h1>
          <p style={{ color: '#888' }} className="text-base">Plataforma completa para Personal Trainers</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🏋️', label: 'Treinos' },
            { icon: '📏', label: 'Medidas' },
            { icon: '🥗', label: 'Nutrição' },
          ].map(f => (
            <div key={f.label} className="card p-4 text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-sm font-medium" style={{ color: '#aaa' }}>{f.label}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link href="/login"
            className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 0 30px rgba(249,115,22,0.4)' }}>
            Entrar na plataforma
          </Link>
          <Link href="/cadastro"
            className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02]"
            style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#f97316' }}>
            Criar conta grátis
          </Link>
        </div>
      </div>
    </main>
  )
}
