'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const cls = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"

export default function NovaMedidaPage() {
  const [dataAvaliacao, setDataAvaliacao] = useState(new Date().toISOString().split('T')[0])
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [gordura, setGordura] = useState('')
  const [bracDir, setBracDir] = useState('')
  const [bracEsq, setBracEsq] = useState('')
  const [peitoral, setPeitoral] = useState('')
  const [abdomen, setAbdomen] = useState('')
  const [cintura, setCintura] = useState('')
  const [quadril, setQuadril] = useState('')
  const [coxaDir, setCoxaDir] = useState('')
  const [coxaEsq, setCoxaEsq] = useState('')
  const [pantDir, setPantDir] = useState('')
  const [pantEsq, setPantEsq] = useState('')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function toNum(v: string) {
    const n = parseFloat(v.replace(',', '.'))
    return isNaN(n) ? null : n
  }

  async function salvar() {
    if (!peso && !altura) { setErro('Informe ao menos o peso ou altura.'); return }
    setLoading(true)
    setErro('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setErro('Sessão expirada.'); setLoading(false); return }
    const { error } = await supabase.from('medidas').insert({
      aluno_id: user.id,
      data: dataAvaliacao,
      peso: toNum(peso), altura: toNum(altura),
      percentual_gordura: toNum(gordura),
      braco_dir: toNum(bracDir), braco_esq: toNum(bracEsq),
      peitoral: toNum(peitoral), abdomen: toNum(abdomen),
      cintura: toNum(cintura), quadril: toNum(quadril),
      coxa_dir: toNum(coxaDir), coxa_esq: toNum(coxaEsq),
      panturrilha_dir: toNum(pantDir), panturrilha_esq: toNum(pantEsq),
      observacoes: obs || null,
    })
    if (error) { setErro(`Erro: ${error.message}`); setLoading(false); return }
    router.push('/dashboard/aluno/medidas')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno/medidas" className="text-gray-400 hover:text-gray-600 text-sm">← Medidas</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">Nova Avaliação</span>
        </div>
        <button onClick={salvar} disabled={loading} className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
          {loading ? 'Salvando...' : '💾 Salvar'}
        </button>
      </nav>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{erro}</div>}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">📅 Data da avaliação</h2>
          <input type="date" value={dataAvaliacao} onChange={e => setDataAvaliacao(e.target.value)} className={cls} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-900">⚖️ Dados gerais</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input type="text" placeholder="75.0" value={peso} onChange={e => setPeso(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
              <input type="text" placeholder="175" value={altura} onChange={e => setAltura(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">% Gordura</label>
              <input type="text" placeholder="15.0" value={gordura} onChange={e => setGordura(e.target.value)} className={cls} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-900">📐 Medidas corporais (cm)</h2>
          <p className="text-xs text-gray-400">Todos os campos são opcionais</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Braço direito</label>
              <input type="text" placeholder="0.0" value={bracDir} onChange={e => setBracDir(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Braço esquerdo</label>
              <input type="text" placeholder="0.0" value={bracEsq} onChange={e => setBracEsq(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peitoral</label>
              <input type="text" placeholder="0.0" value={peitoral} onChange={e => setPeitoral(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Abdômen</label>
              <input type="text" placeholder="0.0" value={abdomen} onChange={e => setAbdomen(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cintura</label>
              <input type="text" placeholder="0.0" value={cintura} onChange={e => setCintura(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quadril</label>
              <input type="text" placeholder="0.0" value={quadril} onChange={e => setQuadril(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coxa direita</label>
              <input type="text" placeholder="0.0" value={coxaDir} onChange={e => setCoxaDir(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coxa esquerda</label>
              <input type="text" placeholder="0.0" value={coxaEsq} onChange={e => setCoxaEsq(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Panturrilha direita</label>
              <input type="text" placeholder="0.0" value={pantDir} onChange={e => setPantDir(e.target.value)} className={cls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Panturrilha esquerda</label>
              <input type="text" placeholder="0.0" value={pantEsq} onChange={e => setPantEsq(e.target.value)} className={cls} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">💬 Observações</h2>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3}
            placeholder="Como você está se sentindo?" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 resize-none" />
        </div>

        <button onClick={salvar} disabled={loading}
          className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 disabled:opacity-50 transition-colors text-lg">
          {loading ? 'Salvando...' : '💾 Salvar avaliação'}
        </button>
      </main>
    </div>
  )
}
