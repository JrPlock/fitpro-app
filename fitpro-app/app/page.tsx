import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Verifica o tipo de usuário e redireciona
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'personal') redirect('/dashboard/personal')
    else redirect('/dashboard/aluno')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Logo */}
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-2xl shadow-lg">
            <span className="text-4xl">💪</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900">FitPro</h1>
          <p className="text-xl text-gray-600">
            Plataforma completa para Personal Trainers e seus alunos
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            { icon: '🏋️', title: 'Treinos', desc: 'Monte e envie planos personalizados' },
            { icon: '📏', title: 'Medidas', desc: 'Acompanhe a evolução do aluno' },
            { icon: '🥗', title: 'Nutrição', desc: 'Controle de macros e diário alimentar' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-md"
          >
            Entrar na plataforma
          </Link>
          <Link
            href="/cadastro"
            className="px-8 py-4 bg-white text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-colors shadow-md border border-green-200"
          >
            Criar conta grátis
          </Link>
        </div>
      </div>
    </main>
  )
}
