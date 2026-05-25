'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Modal, Button, FormField, Select, Textarea, Table, Th, Td, ModalityBadge } from '@/components/ui'
import { WEEKDAYS, TIMES, MODALITY_LABELS } from '@/lib/utils'

interface FixedLesson {
  id: string; weekday: string; startTime: string; endTime: string; modality: string; notes?: string; active: boolean
  class: { code: string; studentNames: string }
}
interface Class { id: string; code: string; studentNames: string }

const EMPTY = { classId: '', weekday: 'Segunda', startTime: '07:00', endTime: '08:00', modality: 'ONLINE', notes: '', active: true }

export default function FixedLessonsPage() {
  const [lessons,  setLessons]  = useState<FixedLesson[]>([])
  const [classes,  setClasses]  = useState<Class[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selDay,   setSelDay]   = useState('Segunda')
  const [modal,    setModal]    = useState<'create'|'edit'|null>(null)
  const [sel,      setSel]      = useState<any>(EMPTY)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [lr, cr] = await Promise.all([
      fetch(`/api/fixed-lessons?weekday=${encodeURIComponent(selDay)}`),
      fetch('/api/classes?status=ACTIVE'),
    ])
    setLessons(await lr.json())
    setClasses(await cr.json())
    setLoading(false)
  }, [selDay])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    const isEdit = !!sel.id
    const res = await fetch(isEdit ? `/api/fixed-lessons/${sel.id}` : '/api/fixed-lessons', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sel),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error || 'Erro'); return }
    toast.success(isEdit ? 'Aula fixa atualizada!' : 'Aula fixa criada!')
    setModal(null); load()
  }

  async function del(id: string) {
    if (!confirm('Excluir esta aula fixa?')) return
    await fetch(`/api/fixed-lessons/${id}`, { method: 'DELETE' })
    toast.success('Excluída'); load()
  }

  const byDay = (day: string) => lessons.filter(l => l.weekday === day).sort((a,b) => a.startTime.localeCompare(b.startTime))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Grade Fixa</h1>
          <p className="text-sm text-gray-500 mt-0.5">Aulas com dia e horário fixos na semana</p>
        </div>
        <Button onClick={() => { setSel({ ...EMPTY, weekday: selDay }); setModal('create') }}>
          <Plus className="w-4 h-4" />Adicionar aula fixa
        </Button>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto">
        {WEEKDAYS.map(d => (
          <button key={d} onClick={() => setSelDay(d)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${d === selDay ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-red-400'}`}>
            {d}
            <span className="ml-1.5 text-xs opacity-60">{byDay(d).length}</span>
          </button>
        ))}
      </div>

      {/* All days view */}
      <div className="space-y-6">
        {[selDay].map(day => (
          <div key={day}>
            <h2 className="text-sm font-bold text-gray-700 mb-3">{day} — {byDay(day).length} aula(s)</h2>
            <Table>
              <thead>
                <tr><Th>Horário</Th><Th>Turma</Th><Th>Aluno(s)</Th><Th>Modalidade</Th><Th>Obs</Th><Th>Ativo</Th><Th></Th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-400">Carregando...</td></tr>
                ) : byDay(day).length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-6 text-gray-400">Nenhuma aula fixa para {day}.</td></tr>
                ) : byDay(day).map(l => (
                  <tr key={l.id} className={`hover:bg-gray-50 ${!l.active ? 'opacity-50' : ''}`}>
                    <Td><span className="font-mono font-bold text-sm">{l.startTime} - {l.endTime}</span></Td>
                    <Td><span className="font-bold">{l.class?.code}</span></Td>
                    <Td>{l.class?.studentNames}</Td>
                    <Td><ModalityBadge modality={l.modality} /></Td>
                    <Td className="text-xs text-gray-400">{l.notes}</Td>
                    <Td>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${l.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {l.active ? 'Sim' : 'Não'}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => { setSel({ ...l, classId: '' }); setModal('edit') }} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(l.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'Nova Aula Fixa' : 'Editar Aula Fixa'} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Turma" required>
              <Select value={sel.classId || ''} onChange={e => setSel((p: any) => ({ ...p, classId: e.target.value }))}>
                <option value="">Selecionar turma...</option>
                {classes.filter(c => true).map(c => <option key={c.id} value={c.id}>{c.code} — {c.studentNames}</option>)}
              </Select>
            </FormField>
            <FormField label="Dia da semana">
              <Select value={sel.weekday} onChange={e => setSel((p: any) => ({ ...p, weekday: e.target.value }))}>
                {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FormField>
            <FormField label="Horário início">
              <Select value={sel.startTime} onChange={e => setSel((p: any) => ({ ...p, startTime: e.target.value }))}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Horário fim">
              <Select value={sel.endTime} onChange={e => setSel((p: any) => ({ ...p, endTime: e.target.value }))}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </FormField>
            <FormField label="Modalidade">
              <Select value={sel.modality} onChange={e => setSel((p: any) => ({ ...p, modality: e.target.value }))}>
                {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Ativo">
              <Select value={sel.active ? 'true' : 'false'} onChange={e => setSel((p: any) => ({ ...p, active: e.target.value === 'true' }))}>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </Select>
            </FormField>
            <div className="col-span-2">
              <FormField label="Observações">
                <Textarea rows={2} value={sel.notes || ''} onChange={e => setSel((p: any) => ({ ...p, notes: e.target.value }))} />
              </FormField>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
