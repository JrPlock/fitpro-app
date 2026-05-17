'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

const METRICAS = [
  { key: 'peso', label: 'Peso (kg)', cor: '#16a34a' },
  { key: 'percentual_gordura', label: '% Gordura', cor: 'var(--accent)' },
  { key: 'cintura', label: 'Cintura (cm)', cor: '#8b5cf6' },
  { key: 'quadril', label: 'Quadril (cm)', cor: '#ec4899' },
  { key: 'braco_dir', label: 'Braço D (cm)', cor: '#3b82f6' },
  { key: 'coxa_dir', label: 'Coxa D (cm)', cor: '#f59e0b' },
]

export default function AvaliacoesAlunoPage() {
  const params = useParams()
  const alunoId = params.id as string
  const [medidas, setMedidas] = useState<any[]>([])
  const [aluno, setAluno] = useState<any>(null)
  const [metrica, setMetrica] = useState('peso')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function carregar() {
      const [{ data: perfil }, { data: med }] = await Promise.all([
        supabase.from('profiles').select('nome, email').eq('id', alunoId).single(),
        supabase.from('medidas').select('*').eq('aluno_id', alunoId).order('data', { ascending: true })
      ])
      setAluno(perfil)
      setMedidas(med?.map(m => ({
        ...m,
        dataFormatada: new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      })) || [])
      setLoading(false)
    }
    carregar()
  }, [alunoId])

  const metricaAtual = METRICAS.find(m => m.key === metrica)!
  const dadosValidos = medidas.filter(d => d[metrica] != null)
  const ultima = medidas[medidas.length - 1]
  const primeira = medidas[0]

  function variacao(campo: string) {
    if (!ultima?.[campo] || !primeira?.[campo] || medidas.length < 2) return null
    return (ultima[campo] - primeira[campo]).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/personal/alunos/${alunoId}`} className="text-gray-400 hover:text-gray-600 text-sm">← Perfil do aluno</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">📏 Avaliações — {aluno?.nome}</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Carregando...</div>
        ) : medidas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <div className="text-5xl mb-3">📏</div>
            <p className="text-gray-500">Este aluno ainda não registrou nenhuma avaliação.</p>
          </div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Avaliações', value: medidas.length, unit: '', icon: '📋' },
                { label: 'Peso atual', value: ultima?.peso ?? '—', unit: 'kg', icon: '⚖️' },
                { label: 'Var. peso', value: variacao('peso') ? `${parseFloat(variacao('peso')!) > 0 ? '+' : ''}${variacao('peso')}` : '—', unit: 'kg', icon: '📉', cor: variacao('peso') && parseFloat(variacao('peso')!) < 0 ? 'text-green-600' : 'text-red-500' },
                { label: '% Gordura', value: ultima?.percentual_gordura ?? '—', unit: '%', icon: '🔥' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div className={`text-2xl font-bold ${(card as any).cor || 'text-gray-900'}`}>{card.value}{card.unit && card.value !== '—' ? ` ${card.unit}` : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Seletor de métrica */}
            <div className="flex flex-wrap gap-2">
              {METRICAS.map(m => (
                <button key={m.key} onClick={() => setMetrica(m.key)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${metrica === m.key ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
                  style={metrica === m.key ? { backgroundColor: m.cor } : {}}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Gráfico */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">{metricaAtual.label} ao longo do tempo</h2>
              {dadosValidos.length < 2 ? (
                <p className="text-center text-gray-400 text-sm py-8">Dados insuficientes para esta métrica</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={dadosValidos} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="dataFormatada" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 13 }}
                      formatter={(v: any) => [`${v}`, metricaAtual.label]} />
                    <Line type="monotone" dataKey={metrica} stroke={metricaAtual.cor} strokeWidth={3}
                      dot={{ fill: metricaAtual.cor, r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tabela de avaliações */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Histórico completo</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Data', 'Peso', '% Gord.', 'Cintura', 'Quadril', 'Braço D', 'Observações'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...medidas].reverse().map((m, i) => (
                      <tr key={m.id} className={i === 0 ? 'bg-green-50' : ''}>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                          {i === 0 && <span className="ml-2 text-xs text-green-600 font-semibold">Recente</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{m.peso ? `${m.peso} kg` : '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{m.percentual_gordura ? `${m.percentual_gordura}%` : '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{m.cintura ? `${m.cintura} cm` : '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{m.quadril ? `${m.quadril} cm` : '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{m.braco_dir ? `${m.braco_dir} cm` : '—'}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{m.observacoes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
