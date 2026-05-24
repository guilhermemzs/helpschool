'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Copy, Printer } from 'lucide-react'
import { WEEKDAYS, MODALITY_LABELS } from '@/lib/utils'

export default function PrintPage() {
  const [schedules,   setSchedules]   = useState<any[]>([])
  const [scheduleId,  setScheduleId]  = useState('')
  const [teachers,    setTeachers]    = useState<any[]>([])
  const [selTeacher,  setSelTeacher]  = useState('')
  const [selDay,      setSelDay]      = useState('Segunda')
  const [lessons,     setLessons]     = useState<any[]>([])
  const [viewMode,    setViewMode]    = useState<'teacher'|'general'>('teacher')
  const [loading,     setLoading]     = useState(false)

  useEffect(() => {
    Promise.all([fetch('/api/schedules'), fetch('/api/teachers')])
      .then(([s, t]) => Promise.all([s.json(), t.json()]))
      .then(([s, t]) => {
        setSchedules(s); if (s[0]) setScheduleId(s[0].id)
        setTeachers(t)
      })
  }, [])

  useEffect(() => {
    if (!scheduleId) return
    setLoading(true)
    const params = new URLSearchParams({ scheduleId, weekday: selDay })
    fetch(`/api/lessons?${params}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setLessons(data.sort((a, b) => a.startTime.localeCompare(b.startTime)))
        setLoading(false)
      })
  }, [scheduleId, selDay])

  const teacherLessons = selTeacher
    ? lessons.filter(l => l.teacher?.id === selTeacher && l.status !== 'CANCELLED')
    : lessons.filter(l => l.status !== 'CANCELLED')

  const modalLabel = (m: string) => ({ ONLINE: 'Online', PRESENCIAL: 'Presencial', DOMICILIO: 'Domicílio', HIBRIDA: 'Híbrida' }[m] || m)

  const teacherName = teachers.find(t => t.id === selTeacher)?.name || 'Todos'
  const scheduleName = schedules.find(s => s.id === scheduleId)?.name || ''

  const teacherText = `📚 *HELP SCHOOL — ${selDay.toUpperCase()}*\n` +
    (selTeacher ? `👤 Professor: ${teacherName}\n` : '') +
    `\n${teacherLessons.map(l => `${l.startTime} - ${l.endTime} | ${modalLabel(l.modality)} | ${l.class?.code} | ${l.class?.studentNames}`).join('\n')}\n\n` +
    `Total: ${teacherLessons.length} aula(s)`

  const generalText = teacherLessons
    .map(l => `${l.startTime}  ${l.endTime}  ${(l.teacher?.name || '---').padEnd(15)}  ${modalLabel(l.modality).padEnd(12)}  ${l.class?.code}`)
    .join('\n')

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Impressão / Resumo</h1>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors no-print">
          <Printer className="w-4 h-4" />Imprimir
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 no-print">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Semana</label>
            <select value={scheduleId} onChange={e => setScheduleId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dia</label>
            <select value={selDay} onChange={e => setSelDay(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Professor</label>
            <select value={selTeacher} onChange={e => setSelTeacher(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              <option value="">Todos os professores</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Visualização</label>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('teacher')} className={`flex-1 py-2 text-sm font-semibold transition-colors ${viewMode === 'teacher' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>WhatsApp</button>
              <button onClick={() => setViewMode('general')} className={`flex-1 py-2 text-sm font-semibold transition-colors ${viewMode === 'general' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>Geral</button>
            </div>
          </div>
        </div>
      </div>

      {/* Print header (only visible on print) */}
      <div className="print-only mb-6 text-center">
        <h2 className="text-2xl font-black italic">Help<span className="text-red-600 text-base ml-1">school</span></h2>
        <p className="text-sm text-gray-600">{selDay} — {scheduleName} — {teacherName}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : teacherLessons.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhuma aula encontrada para esta seleção.</div>
      ) : viewMode === 'teacher' ? (
        <>
          {/* WhatsApp format */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 font-mono text-sm whitespace-pre-wrap text-gray-800 leading-relaxed mb-4">
            {teacherText}
          </div>
          <button onClick={() => copyToClipboard(teacherText)} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors no-print">
            <Copy className="w-4 h-4" />Copiar para WhatsApp
          </button>
        </>
      ) : (
        <>
          {/* General format */}
          <div className="bg-gray-950 rounded-xl p-5 font-mono text-xs text-gray-100 whitespace-pre leading-relaxed mb-4 overflow-x-auto">
            <p className="text-green-400 mb-2 text-sm">📚 HELP SCHOOL — {selDay.toUpperCase()} — {scheduleName}</p>
            <p className="text-gray-500 mb-3 text-[10px]">INÍCIO    FIM       PROFESSOR           MODALIDADE    TURMA</p>
            {generalText}
          </div>
          <div className="flex gap-2 no-print">
            <button onClick={() => copyToClipboard(generalText)} className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl transition-colors">
              <Copy className="w-4 h-4" />Copiar texto
            </button>
            <button onClick={() => window.open(`/api/export?type=lessons&scheduleId=${scheduleId}`)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors">
              Exportar Excel
            </button>
          </div>
        </>
      )}

      {/* Aulas table (visible on print) */}
      <div className="mt-8 hidden print:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 pr-4">Horário</th>
              <th className="text-left py-2 pr-4">Professor</th>
              <th className="text-left py-2 pr-4">Modalidade</th>
              <th className="text-left py-2 pr-4">Turma</th>
              <th className="text-left py-2">Aluno</th>
            </tr>
          </thead>
          <tbody>
            {teacherLessons.map(l => (
              <tr key={l.id} className="border-b border-gray-200">
                <td className="py-1.5 pr-4 font-mono text-xs">{l.startTime} - {l.endTime}</td>
                <td className="py-1.5 pr-4">{l.teacher?.name || '---'}</td>
                <td className="py-1.5 pr-4">{modalLabel(l.modality)}</td>
                <td className="py-1.5 pr-4 font-bold">{l.class?.code}</td>
                <td className="py-1.5">{l.class?.studentNames}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
