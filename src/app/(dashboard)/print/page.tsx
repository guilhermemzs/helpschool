'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Copy, Printer } from 'lucide-react'

interface Teacher  { id: string; name: string }
interface Lesson   { startTime: string; endTime: string; modality: string; class: { code: string; studentNames: string }; teacher?: { name: string } }

const MOD: Record<string,string> = { ONLINE: 'online', PRESENCIAL: 'presencial', DOMICILIO: 'domicílio', HIBRIDA: 'híbrida' }

export default function PrintPage() {
  const [teachers,   setTeachers]   = useState<Teacher[]>([])
  const [selTeacher, setSelTeacher] = useState('')
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0])
  const [lessons,    setLessons]    = useState<Lesson[]>([])
  const [loading,    setLoading]    = useState(false)

  useEffect(() => { fetch('/api/teachers').then(r => r.json()).then(setTeachers) }, [])

  useEffect(() => {
    if (!date) return
    setLoading(true)
    const p = new URLSearchParams({ date, teacherId: selTeacher })
    fetch(`/api/daily-schedule?${p}`)
      .then(r => r.json())
      .then(data => { setLessons(data.filter((l: any) => l.status !== 'CANCELLED')); setLoading(false) })
  }, [date, selTeacher])

  const teacherName = teachers.find(t => t.id === selTeacher)?.name || 'Todos os professores'
  const dateLabel   = new Date(date+'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  const waMsg = `*Help School*\n${dateLabel}\n\n*Professor: ${teacherName}*\n\n` +
    lessons.map(l => `${l.startTime}h ${l.class?.code} ${MOD[l.modality] || l.modality}`).join('\n')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Impressão / WhatsApp</h1>
        <button onClick={() => window.print()} className="no-print flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50">
          <Printer className="w-4 h-4" />Imprimir
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 no-print">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Professor</label>
            <select value={selTeacher} onChange={e => setSelTeacher(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
              <option value="">Todos os professores</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? <p className="text-center py-8 text-gray-400">Carregando...</p> :
        lessons.length === 0 ? (
          <p className="text-center py-8 text-gray-400">Nenhuma aula encontrada para esta seleção.</p>
        ) : (
          <>
            {/* WhatsApp preview */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 font-mono text-sm whitespace-pre-wrap text-gray-800 leading-loose mb-4">
              {waMsg}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(waMsg); toast.success('Copiado para o WhatsApp!') }}
              className="no-print flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors mb-6">
              <Copy className="w-4 h-4" />Copiar para WhatsApp
            </button>

            {/* Print table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Horário</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Turma</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Aluno</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Modalidade</th>
                    {!selTeacher && <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Professor</th>}
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-4 py-2.5 font-mono font-bold text-sm">{l.startTime}</td>
                      <td className="px-4 py-2.5 font-bold">{l.class?.code}</td>
                      <td className="px-4 py-2.5 text-gray-600">{l.class?.studentNames}</td>
                      <td className="px-4 py-2.5 text-gray-600 capitalize">{MOD[l.modality] || l.modality}</td>
                      {!selTeacher && <td className="px-4 py-2.5 text-gray-600">{l.teacher?.name || '—'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      }
    </div>
  )
}
