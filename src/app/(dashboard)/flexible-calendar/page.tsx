'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Check, AlertTriangle } from 'lucide-react'
import { Modal, Button, FormField, Select, Textarea } from '@/components/ui'
import { TIMES, MODALITY_LABELS, getWeekStart, getWeekdayFromDate } from '@/lib/utils'

interface FlexClass {
  id: string; code: string; studentNames: string; lessonsPerWeek: number; modality: string
  schedulesThisWeek: number
}
interface Teacher { id: string; name: string }

export default function FlexibleCalendarPage() {
  const [flexClasses, setFlexClasses] = useState<FlexClass[]>([])
  const [teachers,    setTeachers]    = useState<Teacher[]>([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState(false)
  const [sel,         setSel]         = useState<any>({ classId: '', teacherId: '', date: '', startTime: '07:00', endTime: '08:00', modality: 'ONLINE', notes: '' })
  const [saving,      setSaving]      = useState(false)
  const [weekOffset,  setWeekOffset]  = useState(0)

  const weekStart = getWeekStart(new Date(Date.now() + weekOffset * 7 * 86400000))
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 5)
  const weekLabel = `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

  const load = useCallback(async () => {
    setLoading(true)
    const [cr, tr] = await Promise.all([
      fetch(`/api/flexible-calendar?weekStart=${weekStart.toISOString()}`),
      fetch('/api/teachers'),
    ])
    setFlexClasses(await cr.json())
    setTeachers(await tr.json())
    setLoading(false)
  }, [weekOffset])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    const date = new Date(sel.date + 'T12:00:00')
    const weekday = getWeekdayFromDate(date)
    const res = await fetch('/api/flexible-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sel, weekday, weekStart: weekStart.toISOString() }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.conflict) { toast.error(data.errors?.join(' ') || 'Conflito!'); return }
    if (!res.ok) { toast.error(data.error || 'Erro'); return }
    toast.success('Aula agendada!')
    setModal(false); load()
  }

  const complete = flexClasses.filter(c => c.schedulesThisWeek >= c.lessonsPerWeek)
  const missing  = flexClasses.filter(c => c.schedulesThisWeek < c.lessonsPerWeek)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Calendário de Aulas Flexíveis</h1>
          <p className="text-sm text-gray-500 mt-0.5">Agende as aulas das turmas flexíveis</p>
        </div>
        <Button onClick={() => { setSel({ classId: '', teacherId: '', date: '', startTime: '07:00', endTime: '08:00', modality: 'ONLINE', notes: '' }); setModal(true) }}>
          <Plus className="w-4 h-4" />Agendar aula
        </Button>
      </div>

      {/* Week navigator */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setWeekOffset(w => w-1)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">← Semana anterior</button>
        <span className="text-sm font-bold text-gray-700 bg-gray-100 px-4 py-1.5 rounded-lg">Semana {weekLabel}</span>
        <button onClick={() => setWeekOffset(w => w+1)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Próxima semana →</button>
        {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-red-600 underline">Hoje</button>}
      </div>

      {/* Alert */}
      {missing.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-2 text-sm text-yellow-700">
          <AlertTriangle className="w-4 h-4" />
          <strong>{missing.length} turma(s)</strong> ainda não completou as aulas desta semana.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 max-w-xs mb-5">
        <div className="bg-white border border-gray-200 border-l-4 border-l-green-400 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Semana completa</p>
          <p className="text-2xl font-bold text-green-700">{complete.length}</p>
        </div>
        <div className="bg-white border border-gray-200 border-l-4 border-l-yellow-400 rounded-xl p-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Faltando aulas</p>
          <p className="text-2xl font-bold text-yellow-700">{missing.length}</p>
        </div>
      </div>

      {/* Missing lessons first */}
      {missing.length > 0 && (
        <>
          <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">Precisam de aulas esta semana</p>
          <div className="space-y-2 mb-5">
            {missing.map(c => (
              <div key={c.id} className="bg-white border border-yellow-200 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{c.code}</span>
                    <span className="text-sm text-gray-600">{c.studentNames}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-1">
                      {Array.from({ length: c.lessonsPerWeek }).map((_, i) => (
                        <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < c.schedulesThisWeek ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {i < c.schedulesThisWeek ? '✓' : i+1}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{c.schedulesThisWeek}/{c.lessonsPerWeek} aulas</span>
                    <span className="text-xs text-yellow-700 font-semibold">Falta {c.lessonsPerWeek - c.schedulesThisWeek}</span>
                  </div>
                </div>
                <button onClick={() => { setSel({ classId: c.id, teacherId: '', date: '', startTime: '07:00', endTime: '08:00', modality: c.modality, notes: '' }); setModal(true) }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors">
                  Agendar
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Complete */}
      {complete.length > 0 && (
        <>
          <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">Semana completa ✓</p>
          <div className="space-y-1.5">
            {complete.map(c => (
              <div key={c.id} className="bg-white border border-green-100 rounded-xl p-3 flex items-center gap-3">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="font-bold text-gray-700">{c.code}</span>
                <span className="text-sm text-gray-500">{c.studentNames}</span>
                <span className="ml-auto text-xs text-green-600 font-semibold">{c.schedulesThisWeek}/{c.lessonsPerWeek} aulas ✓</span>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && (
        <Modal title="Agendar Aula Flexível" onClose={() => setModal(false)} size="lg">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Turma" required>
              <Select value={sel.classId} onChange={e => setSel((p: any) => ({ ...p, classId: e.target.value }))}>
                <option value="">Selecionar turma...</option>
                {[...missing, ...complete].map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.studentNames} ({c.schedulesThisWeek}/{c.lessonsPerWeek})</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Professor">
              <Select value={sel.teacherId} onChange={e => setSel((p: any) => ({ ...p, teacherId: e.target.value || null }))}>
                <option value="">— Sem professor —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Data" required>
              <input type="date" value={sel.date} onChange={e => setSel((p: any) => ({ ...p, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
            </FormField>
            <FormField label="Modalidade">
              <Select value={sel.modality} onChange={e => setSel((p: any) => ({ ...p, modality: e.target.value }))}>
                {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Início">
              <Select value={sel.startTime} onChange={e => setSel((p: any) => ({ ...p, startTime: e.target.value }))}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Fim">
              <Select value={sel.endTime} onChange={e => setSel((p: any) => ({ ...p, endTime: e.target.value }))}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FormField>
            <div className="col-span-2">
              <FormField label="Observações">
                <Textarea rows={2} value={sel.notes || ''} onChange={e => setSel((p: any) => ({ ...p, notes: e.target.value }))} />
              </FormField>
            </div>
          </div>

          {sel.classId && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              {(() => {
                const c = [...missing, ...complete].find(x => x.id === sel.classId)
                if (!c) return null
                return <p className="text-sm text-blue-700"><strong>{c.code}</strong> — {c.schedulesThisWeek}/{c.lessonsPerWeek} aulas esta semana. Falta {Math.max(0, c.lessonsPerWeek - c.schedulesThisWeek)}.</p>
              })()}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Agendar aula'}</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
