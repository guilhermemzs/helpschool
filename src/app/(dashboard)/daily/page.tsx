'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { CheckCircle, XCircle, RefreshCw, Clock, AlertTriangle } from 'lucide-react'
import { ModalityBadge, StatusBadge, StatCard, SectionHeader } from '@/components/ui'
import { WEEKDAYS } from '@/lib/utils'

interface Lesson {
  id: string; weekday: string; startTime: string; endTime: string; modality: string; status: string; notes?: string
  class: { code: string; studentNames: string; level: string }
  teacher?: { id: string; name: string }
}

const WEEKDAY_DATES: Record<string, string> = {
  'Segunda':'19/05','Terça':'20/05','Quarta':'21/05','Quinta':'22/05','Sexta':'23/05','Sábado':'24/05',
}

export default function DailyPage() {
  const [selDay,   setSelDay]   = useState('Segunda')
  const [lessons,  setLessons]  = useState<Lesson[]>([])
  const [loading,  setLoading]  = useState(true)
  const [schedules, setSchedules] = useState<any[]>([])
  const [scheduleId, setScheduleId] = useState('')

  useEffect(() => {
    fetch('/api/schedules').then(r => r.json()).then(data => {
      setSchedules(data)
      if (data[0]) setScheduleId(data[0].id)
    })
  }, [])

  const loadLessons = useCallback(async () => {
    if (!scheduleId) return
    setLoading(true)
    const res = await fetch(`/api/lessons?scheduleId=${scheduleId}&weekday=${encodeURIComponent(selDay)}`)
    const data: Lesson[] = await res.json()
    setLessons(data.sort((a, b) => a.startTime.localeCompare(b.startTime)))
    setLoading(false)
  }, [selDay, scheduleId])

  useEffect(() => { loadLessons() }, [loadLessons])

  async function patch(id: string, status: string) {
    const res = await fetch(`/api/lessons/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) { toast.success(`Aula marcada como ${status}`); loadLessons() }
    else toast.error('Erro ao atualizar')
  }

  const stats = {
    total:     lessons.length,
    confirmed: lessons.filter(l => l.status === 'CONFIRMED').length,
    pending:   lessons.filter(l => l.status === 'PENDING').length,
    noTeacher: lessons.filter(l => !l.teacher && l.status !== 'CANCELLED').length,
    online:    lessons.filter(l => l.modality === 'ONLINE').length,
    presencial:lessons.filter(l => l.modality === 'PRESENCIAL').length,
  }

  const waText = lessons
    .filter(l => l.status !== 'CANCELLED')
    .map(l => `${l.startTime} - ${l.endTime} | ${l.modality === 'ONLINE' ? 'Online' : l.modality === 'PRESENCIAL' ? 'Presencial' : l.modality === 'DOMICILIO' ? 'Domicílio' : 'Híbrida'} | ${l.class?.code} | ${l.class?.studentNames}`)
    .join('\n')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Escala Diária</h1>
        <div className="flex gap-2">
          <select value={scheduleId} onChange={e => setScheduleId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
            {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={loadLessons} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-1 mb-5 overflow-x-auto">
        {WEEKDAYS.map(d => (
          <button key={d} onClick={() => setSelDay(d)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${d === selDay ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-red-400'}`}>
            {d}
            <span className="ml-1.5 text-[10px] opacity-60">{WEEKDAY_DATES[d]}</span>
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
        <StatCard label="Total"      value={stats.total}     />
        <StatCard label="Confirm."   value={stats.confirmed} accent="border-l-green-400" />
        <StatCard label="Pendentes"  value={stats.pending}   accent="border-l-yellow-400" />
        <StatCard label="Sem prof."  value={stats.noTeacher} accent="border-l-red-400" />
        <StatCard label="Online"     value={stats.online}    />
        <StatCard label="Presencial" value={stats.presencial} accent="border-l-red-600" />
      </div>

      {/* Alerts */}
      {stats.noTeacher > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{stats.noTeacher} aula(s) sem professor</strong> — confira antes de iniciar o dia.</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid bg-gray-50 border-b border-gray-200" style={{ gridTemplateColumns: '90px 1fr 150px 110px 110px 120px' }}>
          {['Horário','Turma / Aluno','Professor','Modalidade','Status','Ações'].map(h => (
            <div key={h} className="px-3 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Carregando...</div>
        ) : lessons.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma aula para {selDay}.</p>
          </div>
        ) : lessons.map(l => (
          <div key={l.id}
            className={`grid border-b border-gray-100 hover:bg-gray-50 transition-colors ${!l.teacher && l.status !== 'CANCELLED' ? 'bg-red-50/30' : ''} ${l.status === 'CANCELLED' ? 'opacity-50' : ''}`}
            style={{ gridTemplateColumns: '90px 1fr 150px 110px 110px 120px' }}>
            <div className="px-3 py-3 flex flex-col justify-center">
              <span className="font-bold text-sm">{l.startTime}</span>
              <span className="text-xs text-gray-400">até {l.endTime}</span>
            </div>
            <div className="px-3 py-3">
              <div className="font-bold text-sm text-gray-900">{l.class?.code}</div>
              <div className="text-xs text-gray-500">{l.class?.studentNames}</div>
              {l.notes && <div className="text-xs text-yellow-600 mt-0.5">{l.notes}</div>}
            </div>
            <div className="px-3 py-3 flex items-center text-sm">
              {l.teacher
                ? <span className="font-medium text-gray-800">{l.teacher.name}</span>
                : <span className="text-red-600 font-bold text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Sem professor</span>
              }
            </div>
            <div className="px-3 py-3 flex items-center"><ModalityBadge modality={l.modality} /></div>
            <div className="px-3 py-3 flex items-center"><StatusBadge status={l.status} /></div>
            <div className="px-3 py-3 flex items-center gap-1">
              {l.status !== 'CONFIRMED' && l.status !== 'CANCELLED' && (
                <button onClick={() => patch(l.id, 'CONFIRMED')} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  <CheckCircle className="w-3 h-3" />Confirmar
                </button>
              )}
              {l.status !== 'CANCELLED' && (
                <button onClick={() => patch(l.id, 'CANCELLED')} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancelar">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* WhatsApp export */}
      {lessons.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="Resumo para WhatsApp" />
          <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs text-green-400 whitespace-pre-wrap mb-3">{`📚 HELP SCHOOL — ${selDay.toUpperCase()}\n\n${waText}`}</div>
          <button
            onClick={() => { navigator.clipboard.writeText(`📚 HELP SCHOOL — ${selDay.toUpperCase()}\n\n${waText}`); toast.success('Copiado para a área de transferência!') }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            📋 Copiar resumo
          </button>
        </div>
      )}
    </div>
  )
}
