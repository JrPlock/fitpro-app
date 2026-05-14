'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const METRICAS = [
  { key: 'peso', label: 'Peso (kg)', cor: '#16a34a' },
  { key: 'percentual_gordura', label: '% Gordura', cor: '#f97316' },
  { key: 'cintura', label: 'Cintura (cm)', cor: '#8b5cf6' },
  { key: 'quadril', label: 'Quadril (cm)', cor: '#ec4899' },
  { key: 'braco_dir', label: 'Braço D (cm)', cor: '#3b82f6' },
  { key: 'coxa_dir', label: 'Coxa D (cm)', cor: '#f59e0b' },
]

export default function EvolucaoPage() {
  const [dados, setDados] = useState<any[]>([])
  const [metricaSelecionada, setMetricaSelecionada] = useState('peso')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('medidas')
        .select('*')
        .eq('aluno_id', user.id)
        .order('data', { ascending: true })

      if (data) {
        setDados(data.map(m => ({
          ...m,
          dataFormatada: new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        })))
      }
      setLoading(false)
    }
    carregar()
  }, [])

  const metricaAtual = METRICAS.find(m => m.key === metricaSelecionada)!
  const dadosValidos = dados.filter(d => d[metricaSelecionada] !== null && d[metricaSelecionada] !== undefined)

  const primeiro = dadosValidos[0]?.[metricaSelecionada]
  const ultimo = dadosValidos[dadosValidos.length - 1]?.[metricaSelecionada]
  const variacao = primeiro && ultimo ? (ultimo - primeiro).toFixed(1) : null
  const variacaoNum = variacao ? parseFloat(variacao) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno/medidas" className="text-gray-400 hover:text-gray-600 text-sm">← Medidas</Link>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-gray-900">📈 Evolução</span>
        </div>
        <Link href="/dashboard/aluno/medidas/nova"
          className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
          + Nova medida
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-6">

        {loading ? (
          <div className="text-center py-20 text-gray-400">Carregando dados...</div>
        ) : dados.length < 2 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
            <div className="text-5xl mb-3">📈</div>
            <p className="text-gray-500 text-sm mb-2">Você precisa de ao menos 2 avaliações para ver gráficos</p>
            <Link href="/dashboard/aluno/medidas/nova"
              className="inline-block mt-3 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors text-sm">
              Registrar avaliação
            </Link>
          </div>
        ) : (
          <>
            {/* Selector de métrica */}
            <div className="flex flex-wrap gap-2">
              {METRICAS.map(m => (
                <button key={m.key} onClick={() => setMetricaSelecionada(m.key)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${metricaSelecionada === m.key
                    ? 'text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                  style={metricaSelecionada === m.key ? { backgroundColor: m.cor } : {}}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Card de variação */}
            {variacao && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Variação total — {metricaAtual.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color: metricaAtual.cor }}>
                    {ultimo}
                  </p>
                  <p className="text-xs text-gray-400">valor atual</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${variacaoNum < 0 ? 'text-green-600' : variacaoNum > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {variacaoNum > 0 ? '+' : ''}{variacao}
                  </p>
                  <p className="text-xs text-gray-400">desde o início</p>
                  <p className="text-xs text-gray-400">{dadosValidos.length} avaliações</p>
                </div>
              </div>
            )}

            {/* Gráfico */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">{metricaAtual.label} ao longo do tempo</h2>
              {dadosValidos.length < 2 ? (
                <p className="text-center text-gray-400 text-sm py-8">Dados insuficientes para esta métrica</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dadosValidos} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="dataFormatada" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 13 }}
                      formatter={(v: any) => [`${v}`, metricaAtual.label]}
                      labelFormatter={(l) => `Data: ${l}`}
                    />
                    <Line
                      type="monotone"
                      dataKey={metricaSelecionada}
                      stroke={metricaAtual.cor}
                      strokeWidth={3}
                      dot={{ fill: metricaAtual.cor, r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tabela histórico */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Histórico de avaliações</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {[...dados].reverse().map((m, i) => (
                  <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {i === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Recente</span>}
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-500">
                      {m.peso && <span><strong className="text-gray-900">{m.peso}</strong> kg</span>}
                      {m.cintura && <span>Cintura: <strong className="text-gray-900">{m.cintura}</strong> cm</span>}
                      {m.percentual_gordura && <span><strong className="text-gray-900">{m.percentual_gordura}</strong>% gord.</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
