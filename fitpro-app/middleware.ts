import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // 1. Configuração do Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Pega o usuário logado e a rota que ele está tentando acessar
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // 2. Rotas públicas (todo mundo pode acessar)
  const publicRoutes = ['/', '/login', '/cadastro', '/auth/callback']
  if (publicRoutes.includes(pathname)) {
    return supabaseResponse
  }

  // 3. Catraca Principal: Se não estiver logado, chuta para o login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 4. O Segurança das Salas: Verifica a permissão (role) do usuário
  const userRole = user.user_metadata?.role

  // Se a rota for do Personal, mas o usuário for aluno...
  if (pathname.startsWith('/dashboard/personal')) {
    if (userRole !== 'personal') {
      // Chuta para o painel de aluno
      return NextResponse.redirect(new URL('/dashboard/aluno', request.url))
    }
  }

  // Se a rota for do Aluno, mas o usuário for personal...
  if (pathname.startsWith('/dashboard/aluno')) {
    if (userRole === 'personal') {
      // Chuta para o painel de personal
      return NextResponse.redirect(new URL('/dashboard/personal', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}