'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const METRICAS = [
  { key: 'peso', label: 'Peso (kg)', cor: 'var(--accent)' },
  { key: 'percentual_gordura', label: '% Gordura', cor: '#fb923c' },
  { key: 'cintura', label: 'Cintura (cm)', cor: '#a78bfa' },
  { key: 'quadril', label: 'Quadril (cm)', cor: '#f472b6' },
  { key: 'braco_dir', label: 'Braço D (cm)', cor: '#60a5fa' },
  { key: 'coxa_dir', label: 'Coxa D (cm)', cor: '#fbbf24' },
]

export default function EvolucaoPage() {
  const [dados, setDados] = useState<any[]>([])
  const [metrica, setMetrica] = useState('peso')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return
      const { data } = await supabase.from('medidas').select('*').eq('aluno_id', user.id).order('data', { ascending: true })
      if (data) setDados(data.map(m => ({ ...m, dataFormatada: new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'short' }) })))
      setLoading(false)
    }
    load()
  }, [])

  const ma = METRICAS.find(m => m.key === metrica)!
  const dv = dados.filter(d => d[metrica] != null)
  const primeiro = dv[0]?.[metrica], ultimo = dv[dv.length-1]?.[metrica]
  const variacao = primeiro && ultimo ? (ultimo - primeiro).toFixed(1) : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/aluno/medidas" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Medidas</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white">📈 Evolução</span>
        </div>
        <Link href="/dashboard/aluno/medidas/nova" className="px-3 py-2 rounded-xl text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>+ Nova</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {loading ? <p className="text-center py-20" style={{ color: 'var(--text-dim)' }}>Carregando...</p>
        : dados.length < 2 ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--bg-card)', border: '1px dashed #2a2a2a' }}>
            <div className="text-5xl mb-3">📈</div>
            <p className="font-semibold text-white mb-1">Poucas avaliações</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-dim)' }}>Você precisa de ao menos 2 avaliações para ver gráficos</p>
            <Link href="/dashboard/aluno/medidas/nova" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>Registrar avaliação</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {METRICAS.map(m => (
                <button key={m.key} onClick={() => setMetrica(m.key)}
                  className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                  style={metrica === m.key ? { background: m.cor, color: 'white' } : { background: 'var(--bg-card)', border: '1px solid #2a2a2a', color: 'var(--text-muted)' }}>
                  {m.label}
                </button>
              ))}
            </div>

            {variacao && (
              <div className="flex items-center justify-between rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{ma.label.toUpperCase()} ATUAL</p>
                  <p className="text-3xl font-extrabold" style={{ color: ma.cor }}>{ultimo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>VARIAÇÃO TOTAL</p>
                  <p className="text-2xl font-extrabold" style={{ color: parseFloat(variacao) < 0 ? 'var(--success)' : parseFloat(variacao) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {parseFloat(variacao) > 0 ? '+' : ''}{variacao}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>{dv.length} avaliações</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
              <h2 className="font-bold text-white mb-4">{ma.label} ao longo do tempo</h2>
              {dv.length < 2 ? <p className="text-center py-8 text-sm" style={{ color: 'var(--text-dim)' }}>Dados insuficientes</p> : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={dv} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-sidebar)" />
                    <XAxis dataKey="dataFormatada" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} stroke="var(--text-dimmer)" />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} stroke="var(--text-dimmer)" domain={['auto','auto']} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a', borderRadius: '12px', fontSize: 13, color: 'white' }}
                      formatter={(v: any) => [`${v}`, ma.label]} labelFormatter={l => `Data: ${l}`} />
                    <Line type="monotone" dataKey={metrica} stroke={ma.cor} strokeWidth={3} dot={{ fill: ma.cor, r: 5 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid #2a2a2a' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f1f1f' }}>
                <h2 className="font-bold text-white">Histórico</h2>
              </div>
              {[...dados].reverse().map((m, i) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>Recente</span>}
                    <span className="text-sm font-medium text-white">{new Date(m.data + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}</span>
                  </div>
                  <div className="flex gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {m.peso && <span><strong className="text-white">{m.peso}</strong> kg</span>}
                    {m.cintura && <span>Cin: <strong className="text-white">{m.cintura}</strong></span>}
                    {m.percentual_gordura && <span><strong className="text-white">{m.percentual_gordura}</strong>%</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
