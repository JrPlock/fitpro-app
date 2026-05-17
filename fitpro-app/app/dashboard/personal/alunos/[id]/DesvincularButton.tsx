'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DesvincularButton({ alunoId, alunoNome }: { alunoId: string; alunoNome: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function desvincular() {
    setLoading(true)
    await supabase.from('profiles').update({ personal_id: null }).eq('id', alunoId)
    router.push('/dashboard/personal/alunos')
  }

  if (confirmando) return (
    <div className="flex items-center gap-2">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Desvincular?</span>
      <button onClick={desvincular} disabled={loading}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
        style={{ background: '#dc2626' }}>{loading ? '...' : 'Sim'}</button>
      <button onClick={() => setConfirmando(false)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold"
        style={{ background: 'var(--bg-card2)', border: '1px solid #2a2a2a', color: 'var(--text-muted)' }}>Não</button>
    </div>
  )

  return (
    <button onClick={() => setConfirmando(true)}
      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
      style={{ background: 'var(--bg-card2)', border: '1px solid #3a1515', color: 'var(--danger)' }}>
      Desvincular
    </button>
  )
}
