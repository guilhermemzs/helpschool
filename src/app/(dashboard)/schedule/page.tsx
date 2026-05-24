'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Copy, RefreshCw, Download, ChevronLeft, ChevronRight, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Modal, Button, FormField, Input, Select, Textarea, Alert } from '@/components/ui'
import { WEEKDAYS, MODALITY_LABELS, TIMES, STATUS_LABELS } from '@/lib/utils'

interface Schedule { id: string; name: string; weekStartDate: string; weekEndDate: string; _count?: { lessons: number } }
interface Lesson {
  id: string; weekday: string; startTime: string; endTime: string; modality: string; status: string; notes?: string
  class: { code: string; studentNames: string; teachingModality: string; level: string }
  teacher?: { id: string; name: string }
}
interface Teacher { id: string; name: string }
interface Class  { id: string; code: string; studentNames: string }

const MODAL_COL_COLORS: Record<string, string> = {
  ONLINE:     'bg-gray-100 border-l-2 border-l-gray-600 text-gray-800',
  PRESENCIAL: 'bg-red-50 border-l-2 border-l-red-600 text-red-800',
  DOMICILIO:  'bg-blue-50 border-l-2 border-l-blue-600 text-blue-800',
  HIBRIDA:    'bg-purple-50 border-l-2 border-l-purple-600 text-purple-800',
}

const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00']

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [current,   setCurrent]   = useState<Schedule | null>(null)
  const [lessons,   setLessons]   = useState<Lesson[]>([])
  const [teachers,  setTeachers]  = useState<Teacher[]>([])
  const [classes,   setClasses]   = useState<Class[]>([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState<'lesson'|'schedule'|'lesson-edit'|null>(null)
  const [selLesson, setSelLesson] = useState<any>({ weekday: 'Segunda', startTime: '07:00', endTime: '08:00', modality: 'ONLINE', status: 'PENDING', notes: '' })
  const [filterDay,    setFilterDay]    = useState('')
  const [filterProf,   setFilterProf]   = useState('')
  const [filterModal,  setFilterModal]  = useState('')
  const [suggestions,  setSuggestions]  = useState<any[]>([])
  const [conflicts,    setConflicts]     = useState<{ errors: string[]; warnings: string[] } | null>(null)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { loadSchedules() }, [])

  async function loadSchedules() {
    const res = await fetch('/api/schedules')
    const data: Schedule[] = await res.json()
    setSchedules(data)
    if (data.length > 0) { setCurrent(data[0]); await loadLessons(data[0].id) }
    setLoading(false)
  }

  async function loadLessons(scheduleId: string) {
    const [lr, tr, cr] = await Promise.all([
      fetch(`/api/lessons?scheduleId=${scheduleId}`),
      fetch('/api/teachers'),
      fetch('/api/classes?status=ACTIVE'),
    ])
    setLessons(await lr.json())
    setTeachers(await tr.json())
    setClasses(await cr.json())
  }

  async function selectSchedule(s: Schedule) {
    setCurrent(s); setLoading(true)
    await loadLessons(s.id)
    setLoading(false)
  }

  async function loadSuggestions() {
    if (!selLesson.classId || !selLesson.weekday || !selLesson.startTime) return
    const p = new URLSearchParams({
      weekday: selLesson.weekday, startTime: selLesson.startTime,
      endTime: selLesson.endTime || '08:00', modality: selLesson.modality || 'ONLINE',
      scheduleId: current?.id || '', classId: selLesson.classId,
    })
    const res = await fetch(`/api/teachers/suggest?${p}`)
    setSuggestions(await res.json())
  }

  useEffect(() => { if (modal === 'lesson') loadSuggestions() }, [selLesson.weekday, selLesson.startTime, selLesson.modality, selLesson.classId])

  async function saveLesson() {
    setSaving(true); setConflicts(null)
    const isEdit = !!selLesson.id
    const body = { ...selLesson, scheduleId: current?.id, date: current?.weekStartDate, force: false }

    const res = await fetch(isEdit ? `/api/lessons/${selLesson.id}` : '/api/lessons', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)

    if (res.status === 409) {
      setConflicts({ errors: data.errors || [], warnings: data.warnings || [] })
      return
    }
    if (!res.ok) { toast.error(data.error || 'Erro ao salvar'); return }

    if (data.warnings?.length) data.warnings.forEach((w: string) => toast.warning(w))
    toast.success(isEdit ? 'Aula atualizada!' : 'Aula adicionada!')
    setModal(null); current && loadLessons(current.id)
  }

  async function saveForce() {
    setSaving(true)
    const isEdit = !!selLesson.id
    const body = { ...selLesson, scheduleId: current?.id, date: current?.weekStartDate, force: true }
    const res = await fetch(isEdit ? `/api/lessons/${selLesson.id}` : '/api/lessons', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) { toast.success('Aula salva mesmo com conflito'); setModal(null); setConflicts(null); current && loadLessons(current.id) }
  }

  async function deleteLesson(id: string) {
    if (!confirm('Excluir esta aula?')) return
    await fetch(`/api/lessons/${id}`, { method: 'DELETE' })
    toast.success('Aula excluída'); current && loadLessons(current.id)
  }

  async function patchLesson(id: string, data: any) {
    await fetch(`/api/lessons/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    toast.success('Aula atualizada'); current && loadLessons(current.id)
  }

  function openCreate(weekday?: string, hour?: string) {
    setConflicts(null)
    setSelLesson({ weekday: weekday || 'Segunda', startTime: hour || '07:00', endTime: hour ? `${String(parseInt(hour) + 1).padStart(2,'0')}:00` : '08:00', modality: 'ONLINE', status: 'PENDING', notes: '' })
    setModal('lesson')
  }

  function openEdit(l: Lesson) {
    setConflicts(null)
    setSelLesson({ ...l, teacherId: l.teacher?.id || '', classId: l.class ? '' : '' })
    setModal('lesson-edit')
  }

  const filteredLessons = lessons.filter(l => {
    if (filterDay   && l.weekday !== filterDay) return false
    if (filterProf  && l.teacher?.id !== filterProf) return false
    if (filterModal && l.modality !== filterModal) return false
    return true
  })

  const lessonsByDayHour = (day: string, hour: string) =>
    filteredLessons.filter(l => l.weekday === day && l.startTime === hour)

  async function createNewWeek() {
    const today   = new Date()
    const monday  = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 8)
    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)

    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const name = `Semana ${fmt(monday)} - ${fmt(saturday)}`

    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekStartDate: monday.toISOString(),
        weekEndDate:   saturday.toISOString(),
        name,
        copyFromId:    current?.id,
      }),
    })
    const data = await res.json()
    if (res.ok) { toast.success(`Semana criada: ${name}`); loadSchedules() }
    else toast.error(data.error || 'Erro ao criar semana')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Escala Semanal</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => current && window.open(`/api/export?type=lessons&scheduleId=${current.id}`)}>
            <Download className="w-3.5 h-3.5" />Excel
          </Button>
          <Button variant="secondary" size="sm" onClick={createNewWeek}>
            <Copy className="w-3.5 h-3.5" />Nova semana (copiar)
          </Button>
          <Button onClick={() => openCreate()}>
            <Plus className="w-4 h-4" />Adicionar aula
          </Button>
        </div>
      </div>

      {/* Schedule selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {schedules.map(s => (
          <button key={s.id} onClick={() => selectSchedule(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${current?.id === s.id ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200 hover:border-red-400'}`}>
            {s.name}
            <span className="ml-2 text-xs opacity-70">{s._count?.lessons || 0} aulas</span>
          </button>
        ))}
        {schedules.length === 0 && <p className="text-sm text-gray-400">Nenhuma semana criada. <button className="text-red-600 underline" onClick={createNewWeek}>Criar agora</button></p>}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-500">
          <option value="">Todos os dias</option>
          {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterProf} onChange={e => setFilterProf(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-500">
          <option value="">Todos os professores</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterModal} onChange={e => setFilterModal(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-500">
          <option value="">Todas modalidades</option>
          {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {/* Legend */}
        <div className="ml-auto flex gap-3 items-center">
          {[['ONLINE','Online'],['PRESENCIAL','Presencial'],['DOMICILIO','Domicílio'],['HIBRIDA','Híbrida']].map(([k,l]) => (
            <div key={k} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-sm border-l-2 ${MODAL_COL_COLORS[k].split(' ').slice(0,2).join(' ')}`} />
              <span className="text-xs text-gray-500">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? <p className="text-center py-16 text-gray-400">Carregando...</p> : !current ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-semibold mb-2">Nenhuma semana selecionada</p>
          <Button onClick={createNewWeek}><Plus className="w-4 h-4" />Criar primeira semana</Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-auto">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="w-16 bg-gray-50 border-b border-r border-gray-200 px-2 py-2.5 text-center text-gray-500 font-bold uppercase text-[10px]">Hora</th>
                {WEEKDAYS.map((d, i) => (
                  <th key={d} className="bg-gray-50 border-b border-r border-gray-200 px-2 py-2.5 text-center font-bold text-gray-700 uppercase text-[10px]">
                    {d}<br />
                    <span className="font-normal text-gray-400 text-[9px]">
                      {current && (() => { const s = new Date(current.weekStartDate); s.setDate(s.getDate() + i); return s.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) })()}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="border-b border-gray-100">
                  <td className="bg-gray-50 border-r border-gray-200 px-2 py-1 text-center text-gray-500 font-bold text-[10px] align-top">{hour}</td>
                  {WEEKDAYS.map(day => {
                    const dayLessons = lessonsByDayHour(day, hour)
                    return (
                      <td key={day} className="border-r border-gray-100 p-1 align-top min-h-[48px]" style={{ minWidth: 120 }}>
                        <div className="space-y-0.5">
                          {dayLessons.map(l => (
                            <div key={l.id} className={`rounded px-1.5 py-1 cursor-pointer group relative ${MODAL_COL_COLORS[l.modality] || 'bg-gray-100'} ${l.status === 'CANCELLED' ? 'opacity-40 line-through' : ''}`}>
                              <div className="font-bold text-[9px] leading-tight">{l.class?.code}</div>
                              <div className="text-[9px] opacity-80 leading-tight">{l.teacher?.name || <span className="text-red-600 font-bold">⚠ Sem prof.</span>}</div>
                              {/* Action buttons on hover */}
                              <div className="absolute right-0 top-0 hidden group-hover:flex gap-0.5 bg-white border border-gray-200 rounded shadow-sm p-0.5 z-10">
                                <button onClick={() => openEdit(l)} className="p-0.5 hover:bg-gray-100 rounded" title="Editar"><Pencil className="w-2.5 h-2.5 text-gray-600" /></button>
                                <button onClick={() => patchLesson(l.id, { status: 'CONFIRMED' })} className="p-0.5 hover:bg-green-50 rounded" title="Confirmar"><CheckCircle className="w-2.5 h-2.5 text-green-600" /></button>
                                <button onClick={() => patchLesson(l.id, { status: 'CANCELLED' })} className="p-0.5 hover:bg-red-50 rounded" title="Cancelar"><XCircle className="w-2.5 h-2.5 text-red-600" /></button>
                                <button onClick={() => deleteLesson(l.id)} className="p-0.5 hover:bg-red-50 rounded" title="Excluir"><Trash2 className="w-2.5 h-2.5 text-red-500" /></button>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => openCreate(day, hour)} className="w-full h-5 rounded border border-dashed border-gray-200 text-gray-300 hover:border-red-400 hover:text-red-400 transition-colors text-[9px] font-bold flex items-center justify-center">
                            +
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lesson modal */}
      {(modal === 'lesson' || modal === 'lesson-edit') && (
        <Modal title={modal === 'lesson' ? 'Adicionar Aula' : 'Editar Aula'} onClose={() => { setModal(null); setConflicts(null) }} size="lg">
          {/* Conflict display */}
          {conflicts && (
            <div className="mb-4 space-y-2">
              {conflicts.errors.map((e, i) => <Alert key={i} type="error">⚠ {e}</Alert>)}
              {conflicts.warnings.map((w, i) => <Alert key={i} type="warning">ℹ {w}</Alert>)}
              <div className="flex gap-2 mt-2">
                <Button variant="danger" onClick={saveForce} disabled={saving}>Salvar mesmo assim</Button>
                <Button variant="secondary" onClick={() => setConflicts(null)}>Voltar e corrigir</Button>
              </div>
            </div>
          )}

          {!conflicts && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormField label="Dia da semana" required>
                  <Select value={selLesson.weekday} onChange={e => setSelLesson((p: any) => ({ ...p, weekday: e.target.value }))}>
                    {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </FormField>
                <FormField label="Turma" required>
                  <Select value={selLesson.classId || ''} onChange={e => setSelLesson((p: any) => ({ ...p, classId: e.target.value }))}>
                    <option value="">Selecionar turma...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.code} — {c.studentNames}</option>)}
                  </Select>
                </FormField>
                <FormField label="Horário início" required>
                  <Select value={selLesson.startTime} onChange={e => setSelLesson((p: any) => ({ ...p, startTime: e.target.value }))}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </FormField>
                <FormField label="Horário fim" required>
                  <Select value={selLesson.endTime} onChange={e => setSelLesson((p: any) => ({ ...p, endTime: e.target.value }))}>
                    {TIMES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </FormField>
                <FormField label="Modalidade">
                  <Select value={selLesson.modality} onChange={e => setSelLesson((p: any) => ({ ...p, modality: e.target.value }))}>
                    {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </FormField>
                <FormField label="Status">
                  <Select value={selLesson.status} onChange={e => setSelLesson((p: any) => ({ ...p, status: e.target.value }))}>
                    {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </FormField>
                <div className="col-span-2">
                  <FormField label="Professor">
                    <Select value={selLesson.teacherId || ''} onChange={e => setSelLesson((p: any) => ({ ...p, teacherId: e.target.value || null }))}>
                      <option value="">— Sem professor —</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                  </FormField>
                </div>
                <div className="col-span-2">
                  <FormField label="Observações">
                    <Textarea rows={2} value={selLesson.notes || ''} onChange={e => setSelLesson((p: any) => ({ ...p, notes: e.target.value }))} />
                  </FormField>
                </div>
              </div>

              {/* Teacher suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs font-bold text-green-700 mb-2">✨ Professores sugeridos:</p>
                  <div className="space-y-1">
                    {suggestions.slice(0, 5).map((s: any) => (
                      <button key={s.id} onClick={() => setSelLesson((p: any) => ({ ...p, teacherId: s.id }))}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${selLesson.teacherId === s.id ? 'bg-green-600 text-white' : 'bg-white border border-green-200 hover:bg-green-100 text-green-800'}`}>
                        <span className="font-bold">{s.name}</span>
                        <span className="opacity-70">{s.modality}</span>
                        {s.reasons?.map((r: string, i: number) => <span key={i} className="opacity-60 text-[10px]">· {r}</span>)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
                <Button onClick={saveLesson} disabled={saving}>{saving ? 'Salvando...' : 'Salvar aula'}</Button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
