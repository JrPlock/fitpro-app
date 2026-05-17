import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type Aluno = {
  nome: string | null
  email: string | null
}

type Treino = {
  id: string
  nome: string
  objetivo: string | null
  descricao: string | null
  ativo: boolean
  profiles: Aluno | Aluno[] | null
}

type Exercicio = {
  id: string
  nome: string
  series: number
  repeticoes: string
  descanso_segundos: number
  observacoes: string | null
}

type RegistroExercicio = {
  exercicio_id: string
  data: string
  concluido: boolean
  status_execucao: 'pendente' | 'feito' | 'nao_feito' | null
  peso: number | null
  dor: 'nao' | 'leve' | 'moderada' | 'forte' | null
  dificuldade: number | null
  observacoes: string | null
  motivo_nao_feito: string | null
  updated_at: string | null
}

function alunoFromProfile(profile: Treino['profiles']) {
  if (Array.isArray(profile)) return profile[0]
  return profile
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')
}

function statusAtual(registro?: RegistroExercicio) {
  if (!registro) return 'sem_registro'
  return registro.status_execucao || (registro.concluido ? 'feito' : 'pendente')
}

function statusBadge(registro?: RegistroExercicio) {
  const status = statusAtual(registro)
  if (status === 'feito') return { label: 'Feito', bg: 'rgba(34,197,94,0.14)', color: 'var(--success)' }
  if (status === 'nao_feito') return { label: 'Não feito', bg: 'var(--danger-bg)', color: 'var(--danger)' }
  if (status === 'pendente') return { label: 'Pendente', bg: 'var(--bg-card2)', color: 'var(--text-dim)' }
  return { label: 'Sem registro', bg: 'var(--bg-card2)', color: 'var(--text-dimmer)' }
}

function dorLabel(dor: RegistroExercicio['dor']) {
  const labels = {
    nao: 'Sem dor',
    leve: 'Dor leve',
    moderada: 'Dor moderada',
    forte: 'Dor forte',
  }
  return dor ? labels[dor] : 'Não informado'
}

export default async function TreinoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: treino } = await supabase
    .from('treinos')
    .select('id, nome, objetivo, descricao, ativo, profiles!treinos_aluno_id_fkey(nome, email)')
    .eq('id', id)
    .eq('personal_id', user.id)
    .single()

  if (!treino) redirect('/dashboard/personal/treinos')

  const [{ data: exercicios }, { data: registros }] = await Promise.all([
    supabase.from('exercicios').select('id, nome, series, repeticoes, descanso_segundos, observacoes').eq('treino_id', id).order('ordem'),
    supabase
      .from('registros_exercicios')
      .select('exercicio_id, data, concluido, status_execucao, peso, dor, dificuldade, observacoes, motivo_nao_feito, updated_at')
      .eq('treino_id', id)
      .order('data', { ascending: false })
      .order('updated_at', { ascending: false }),
  ])

  const treinoData = treino as unknown as Treino
  const aluno = alunoFromProfile(treinoData.profiles)
  const exerciciosData = (exercicios || []) as Exercicio[]
  const registrosRecentes = new Map<string, RegistroExercicio>()

  ;((registros || []) as RegistroExercicio[]).forEach(registro => {
    if (!registrosRecentes.has(registro.exercicio_id)) {
      registrosRecentes.set(registro.exercicio_id, registro)
    }
  })

  const totalFeitos = Array.from(registrosRecentes.values()).filter(registro => statusAtual(registro) === 'feito').length
  const totalNaoFeitos = Array.from(registrosRecentes.values()).filter(registro => statusAtual(registro) === 'nao_feito').length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personal/treinos" style={{ color: 'var(--text-dim)' }} className="text-sm hover:text-white">← Treinos</Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-bold text-white truncate max-w-48">{treinoData.nome}</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl font-extrabold text-white">{treinoData.nome}</h1>
              {treinoData.objetivo && (
                <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-semibold"
                  style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{treinoData.objetivo}</span>
              )}
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
              style={treinoData.ativo ? { background: 'var(--accent-glow)', color: 'var(--accent)' } : { background: 'var(--bg-card2)', color: 'var(--text-dimmer)' }}>
              {treinoData.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          {treinoData.descricao && (
            <p className="text-sm rounded-xl p-3" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>{treinoData.descricao}</p>
          )}

          {aluno && (
            <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                {aluno.nome?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{aluno.nome}</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{aluno.email}</p>
              </div>
            </div>
          )}

          {exerciciosData.length > 0 && (
            <div className="mt-4 pt-4 grid grid-cols-3 gap-2" style={{ borderTop: '1px solid var(--border)' }}>
              <div>
                <p className="text-lg font-extrabold" style={{ color: 'var(--success)' }}>{totalFeitos}/{exerciciosData.length}</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Feitos</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-white">{registrosRecentes.size}</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Com retorno</p>
              </div>
              <div>
                <p className="text-lg font-extrabold" style={{ color: 'var(--danger)' }}>{totalNaoFeitos}</p>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Não feitos</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>EXERCÍCIOS ({exerciciosData.length})</p>
          {exerciciosData.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-dimmer)' }}>Nenhum exercício</p>
            </div>
          ) : exerciciosData.map((exercicio, index) => {
            const registro = registrosRecentes.get(exercicio.id)
            const badge = statusBadge(registro)

            return (
              <div key={exercicio.id} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-white">{exercicio.nome}</p>
                      <span className="text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0"
                        style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex gap-4 mt-2">
                      {[
                        ['Séries', exercicio.series],
                        ['Reps', exercicio.repeticoes],
                        ['Descanso', exercicio.descanso_segundos >= 60 ? `${Math.floor(exercicio.descanso_segundos / 60)}min` : `${exercicio.descanso_segundos}s`],
                      ].map(([label, value]) => (
                        <div key={label as string} className="text-center">
                          <p className="text-base font-extrabold" style={{ color: 'var(--accent)' }}>{value}</p>
                          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{label}</p>
                        </div>
                      ))}
                    </div>

                    {exercicio.observacoes && (
                      <p className="text-xs mt-2 rounded-lg px-2 py-1.5" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
                        Observação do treino: {exercicio.observacoes}
                      </p>
                    )}

                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {registro ? (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Data</p>
                              <p className="text-sm font-bold text-white">{formatDate(registro.data)}</p>
                            </div>
                            <div>
                              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Peso</p>
                              <p className="text-sm font-bold text-white">{registro.peso ? `${registro.peso}kg` : '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Dor</p>
                              <p className="text-sm font-bold text-white">{dorLabel(registro.dor)}</p>
                            </div>
                            <div>
                              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Dificuldade</p>
                              <p className="text-sm font-bold text-white">{registro.dificuldade ? `${registro.dificuldade}/10` : '-'}</p>
                            </div>
                          </div>

                          {registro.motivo_nao_feito && (
                            <p className="text-xs mt-3 rounded-lg px-2 py-1.5" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                              Motivo: {registro.motivo_nao_feito}
                            </p>
                          )}

                          {registro.observacoes && (
                            <p className="text-xs mt-3 rounded-lg px-2 py-1.5" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
                              Observação do aluno: {registro.observacoes}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs" style={{ color: 'var(--text-dimmer)' }}>O aluno ainda não salvou retorno para este exercício.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
