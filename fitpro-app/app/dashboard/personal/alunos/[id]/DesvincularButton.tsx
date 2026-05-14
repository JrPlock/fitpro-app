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

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Desvincular {alunoNome}?</span>
        <button onClick={desvincular} disabled={loading}
          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
          {loading ? '...' : 'Sim, desvincular'}
        </button>
        <button onClick={() => setConfirmando(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200">
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirmando(true)}
      className="px-4 py-2 text-red-500 border border-red-200 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors">
      Desvincular aluno
    </button>
  )
}
