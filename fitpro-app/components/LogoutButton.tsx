'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button onClick={handleLogout}
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110"
      style={{ background: '#1c1c1c', border: '1px solid #2a2a2a', color: '#888' }}
      title="Sair">
      ↩
    </button>
  )
}
