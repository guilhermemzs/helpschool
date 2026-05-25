'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, CheckCircle, XCircle, Pencil, Trash2, RefreshCw, Copy, AlertTriangle } from 'lucide-react'
import { Modal, Button, FormField, Select, Textarea, Input, ModalityBadge, StatusBadge } from '@/components/ui'
import { WEEKDAYS, TIMES, MODALITY_LABELS, STATUS_LABELS, getWeekdayFromDate } from '@/lib/utils'

interface DailyLesson {
  id: string; startTime: string; endTime: string; modality: string; status: string
  isFromFixed: boolean; notes?: string; cancelReason?: string
  class: { code: string; studentNames: string; level: string }
  teacher?: { id: string; name: string }
}
interface Teacher { id: string; name: string }
interface Class   { id: string; code: string; studentNames: string }

export default function DailySchedulePage() {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const [date,     setDate]     = useState(fmt(today))
  const [lessons,  setLessons]  = useState<DailyLesson[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes,  setClasses]  = useState<Class[]>([])
  const [loading,  setLoading]  = useState(false)
  const [modal,    setModal]    = useState<'add'|'edit'|'cancel'|null>(null)
  const [sel,      setSel]      = useState<any>({})
  const [saving,   setSaving]   = useState(false)
  const [filterProf, setFilterProf] = useState('')
  const [filterMod,  setFilterMod]  = useState('')

  const weekday = getWeekdayFromDate(new Date(date + 'T12:00:00'))

  const load = useCallback(async () => {
    setLoading(true)
    const [lr, tr, cr] = await Promise.all([
      fetch(`/api/daily-schedule?date=${date}`),
      fetch('/api/teachers'),
      fetch('/api/classes?status=ACTIVE'),
    ])
    setLessons(await lr.json())
    setTeachers(await tr.json())
    setClasses(await cr.json())
    setLoading(false)
  }, [date])

  useEffect(() => { load() }, [load])

  async function loadFixedToDay() {
    if (!confirm(`Carregar aulas fixas de ${weekday} para ${new Date(date+'T12:00:00').toLocaleDateString('pt-BR')}?`)) return
    const res = await fetch('/api/daily-schedule/load-fixed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    })
    const data = await res.json()
    if (res.ok) { toast.success(`${data.count} aula(s) carregada(s)!`); load() }
    else toast.error(data.error || 'Erro')
  }

  async function addLesson() {
    setSaving(true)
    const res = await fetch('/api/daily-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sel, date, weekday }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.conflict) { toast.error(data.errors?.join(' | ') || 'Conflito de horário!'); return }
    if (!res.ok) { toast.error(data.error || 'Erro'); return }
    toast.success('Aula adicionada!')
    setModal(null); load()
  }

  async function patch(id: string, body: any) {
    await fetch(`/api/daily-schedule/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    load()
  }

  async function del(id: string) {
    if (!confirm('Excluir esta aula da escala?')) return
    await fetch(`/api/daily-schedule/${id}`, { method: 'DELETE' })
    toast.success('Removida'); load()
  }

  const filtered = lessons
    .filter(l => !filterProf || l.teacher?.id === filterProf)
    .filter(l => !filterMod  || l.modality === filterMod)
    .sort((a,b) => a.startTime.localeCompare(b.startTime))

  const stats = {
    total: lessons.length,
    confirmed: lessons.filter(l => l.status === 'CONFIRMED').length,
    pending:   lessons.filter(l => l.status === 'PENDING').length,
    cancelled: lessons.filter(l => l.status === 'CANCELLED').length,
    noTeacher: lessons.filter(l => !l.teacher && l.status !== 'CANCELLED').length,
  }

  const waText = filtered.filter(l => l.status !== 'CANCELLED')
    .map(l => `${l.startTime} - ${l.endTime}  ${l.class?.code}  ${l.teacher?.name || 'SEM PROF'}  ${l.modality}`)
    .join('\n')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Escala Diária</h1>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
          <Button variant="secondary" onClick={loadFixedToDay}>Carregar aulas fixas</Button>
          <Button onClick={() => { setSel({ classId: '', teacherId: '', startTime: '07:00', endTime: '08:00', modality: 'ONLINE', notes: '' }); setModal('add') }}>
            <Plus className="w-4 h-4" />Adicionar aula
          </Button>
        </div>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3 mb-4">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500" />
        <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-2 rounded-lg">{weekday}</span>
        <span className="text-sm text-gray-500">{new Date(date+'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
        {[
          { l: 'Total',      v: stats.total },
          { l: 'Confirm.',   v: stats.confirmed, c: 'text-green-700' },
          { l: 'Pendentes',  v: stats.pending,   c: 'text-yellow-700' },
          { l: 'Canceladas', v: stats.cancelled, c: 'text-gray-500' },
          { l: 'Sem prof.',  v: stats.noTeacher, c: 'text-red-700' },
        ].map(s => (
          <div key={s.l} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase">{s.l}</p>
            <p className={`text-xl font-bold ${s.c || 'text-gray-900'}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {stats.noTeacher > 0 && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4" /><strong>{stats.noTeacher} aula(s) sem professor!</strong>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <select value={filterProf} onChange={e => setFilterProf(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-500">
          <option value="">Todos os professores</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterMod} onChange={e => setFilterMod(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-red-500">
          <option value="">Todas modalidades</option>
          {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Lessons list */}
      <div className="space-y-1.5 mb-6">
        {loading ? <p className="text-center py-8 text-gray-400">Carregando...</p> :
          filtered.length === 0 ? (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <p className="text-gray-400 mb-3">Nenhuma aula para este dia.</p>
              <Button variant="secondary" onClick={loadFixedToDay}>Carregar aulas fixas de {weekday}</Button>
            </div>
          ) : filtered.map(l => (
            <div key={l.id} className={`bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 ${l.status === 'CANCELLED' ? 'opacity-50' : ''} ${!l.teacher && l.status !== 'CANCELLED' ? 'border-l-4 border-l-red-400' : ''}`}>
              <div className="text-center w-20 flex-shrink-0">
                <p className="font-mono font-bold text-sm">{l.startTime}</p>
                <p className="font-mono text-xs text-gray-400">{l.endTime}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{l.class?.code}</span>
                  <span className="text-sm text-gray-600">{l.class?.studentNames}</span>
                  <ModalityBadge modality={l.modality} />
                  <StatusBadge status={l.status} />
                  {l.isFromFixed && <span className="text-xs text-blue-500 font-medium">• Fixa</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {l.teacher
                    ? <span className="text-xs text-gray-500 font-medium">{l.teacher.name}</span>
                    : <span className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Sem professor</span>
                  }
                  {l.notes && <span className="text-xs text-gray-400">· {l.notes}</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {l.status !== 'CONFIRMED' && l.status !== 'CANCELLED' && (
                  <button onClick={() => { patch(l.id, { status: 'CONFIRMED' }); toast.success('Confirmada!') }} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Confirmar">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                {l.status !== 'CANCELLED' && (
                  <button onClick={() => { setSel(l); setModal('cancel') }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" title="Cancelar">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => { setSel({ ...l, classId: '', teacherId: l.teacher?.id || '' }); setModal('edit') }} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Editar">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => del(l.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" title="Excluir">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {/* WhatsApp summary */}
      {filtered.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Resumo do dia</p>
          <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs text-green-400 whitespace-pre mb-2">
            {`📚 HELP SCHOOL — ${weekday.toUpperCase()} ${new Date(date+'T12:00:00').toLocaleDateString('pt-BR')}\n\n${waText}`}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`📚 HELP SCHOOL — ${weekday.toUpperCase()} ${new Date(date+'T12:00:00').toLocaleDateString('pt-BR')}\n\n${waText}`); toast.success('Copiado!') }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors">
            <Copy className="w-4 h-4" />Copiar resumo
          </button>
        </div>
      )}

      {/* Add/Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Adicionar Aula' : 'Editar Aula'} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Turma" required>
              <Select value={sel.classId || ''} onChange={e => setSel((p: any) => ({ ...p, classId: e.target.value }))}>
                <option value="">Selecionar turma...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.code} — {c.studentNames}</option>)}
              </Select>
            </FormField>
            <FormField label="Professor">
              <Select value={sel.teacherId || ''} onChange={e => setSel((p: any) => ({ ...p, teacherId: e.target.value || null }))}>
                <option value="">— Sem professor —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
            <FormField label="Modalidade">
              <Select value={sel.modality} onChange={e => setSel((p: any) => ({ ...p, modality: e.target.value }))}>
                {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <div />
            <div className="col-span-2">
              <FormField label="Observações">
                <Textarea rows={2} value={sel.notes || ''} onChange={e => setSel((p: any) => ({ ...p, notes: e.target.value }))} />
              </FormField>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={modal === 'add' ? addLesson : async () => { setSaving(true); await patch(sel.id, sel); setSaving(false); setModal(null) }} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Cancel modal */}
      {modal === 'cancel' && (
        <Modal title="Cancelar aula" onClose={() => setModal(null)} size="sm">
          <FormField label="Motivo do cancelamento">
            <Textarea rows={3} value={sel.cancelReason || ''} onChange={e => setSel((p: any) => ({ ...p, cancelReason: e.target.value }))} placeholder="Ex: Aluno cancelou, professor indisponível..." />
          </FormField>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setModal(null)}>Voltar</Button>
            <Button variant="danger" onClick={async () => { await patch(sel.id, { status: 'CANCELLED', cancelReason: sel.cancelReason }); toast.success('Aula cancelada'); setModal(null) }}>
              Confirmar cancelamento
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
