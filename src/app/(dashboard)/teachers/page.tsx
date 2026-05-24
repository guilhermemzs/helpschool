'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Pencil, UserX, RefreshCw } from 'lucide-react'
import { Modal, Button, FormField, Input, Select, Textarea, ModalityBadge, SectionHeader, Alert } from '@/components/ui'
import { MODALITY_LABELS, WEEKDAYS } from '@/lib/utils'

interface Availability { weekday: string; startTime?: string; endTime?: string }
interface Teacher {
  id: string; name: string; type: string; modality: string
  specialty?: string; needsConfirm: boolean; notes?: string; active: boolean
  availability: Availability[]
  _count?: { lessons: number }
}

const EMPTY_TEACHER: Partial<Teacher> = {
  name: '', type: 'FLEXIBLE', modality: 'ONLINE', specialty: '', needsConfirm: true, notes: '', active: true,
  availability: WEEKDAYS.map(d => ({ weekday: d, startTime: '', endTime: '' })),
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [typeF,    setTypeF]    = useState('')
  const [modal,    setModal]    = useState<'create'|'edit'|null>(null)
  const [sel,      setSel]      = useState<Partial<Teacher>>(EMPTY_TEACHER)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ search, type: typeF })
    const res = await fetch(`/api/teachers?${p}`)
    setTeachers(await res.json())
    setLoading(false)
  }, [search, typeF])

  useEffect(() => { load() }, [load])

  function initials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }

  const avatarColors = ['bg-red-100 text-red-700','bg-blue-100 text-blue-700','bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700','bg-orange-100 text-orange-700','bg-teal-100 text-teal-700']

  function avatarColor(name: string) { return avatarColors[name.length % avatarColors.length] }

  async function save() {
    setSaving(true)
    const isEdit = !!sel.id
    const body = {
      ...sel,
      availability: (sel.availability || []).filter(a => a.startTime && a.endTime),
    }
    const res = await fetch(isEdit ? `/api/teachers/${sel.id}` : '/api/teachers', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error || 'Erro ao salvar'); return }
    toast.success(isEdit ? 'Professor atualizado!' : 'Professor cadastrado!')
    setModal(null); load()
  }

  async function deactivate(t: Teacher) {
    if (!confirm(`Desativar ${t.name}?`)) return
    await fetch(`/api/teachers/${t.id}`, { method: 'DELETE' })
    toast.success('Professor desativado'); load()
  }

  function openEdit(t: Teacher) {
    const avail = WEEKDAYS.map(d => {
      const existing = t.availability?.find(a => a.weekday === d)
      return existing || { weekday: d, startTime: '', endTime: '' }
    })
    setSel({ ...t, availability: avail }); setModal('edit')
  }

  function openCreate() { setSel({ ...EMPTY_TEACHER, availability: WEEKDAYS.map(d => ({ weekday: d, startTime: '', endTime: '' })) }); setModal('create') }

  function setAvail(weekday: string, field: 'startTime'|'endTime', value: string) {
    setSel(prev => ({
      ...prev,
      availability: (prev.availability || []).map(a => a.weekday === weekday ? { ...a, [field]: value } : a)
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Professores</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />Novo Professor</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar professor..."
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-52 focus:outline-none focus:border-red-500" />
        </div>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
          <option value="">Todos os tipos</option>
          <option value="FIXED">Fixo</option>
          <option value="FLEXIBLE">Flexível</option>
        </select>
        <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"><RefreshCw className="w-3.5 h-3.5 text-gray-500" /></button>
        <span className="ml-auto text-xs text-gray-400 self-center">{teachers.length} professor(es)</span>
      </div>

      {/* Teachers list */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-12">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {teachers.map(t => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor(t.name)}`}>
                {initials(t.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{t.name}</span>
                  {t.specialty && (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{t.specialty}</span>
                  )}
                  <ModalityBadge modality={t.modality} />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.type === 'FIXED' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {t.type === 'FIXED' ? 'Fixo' : 'Flexível'}
                  </span>
                  {t.needsConfirm && (
                    <span className="text-xs text-yellow-600 font-medium">⚠ Confirmar antes</span>
                  )}
                </div>
                {t.notes && <p className="text-xs text-gray-500 mt-1">{t.notes}</p>}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {WEEKDAYS.map(d => {
                    const avail = t.availability?.find(a => a.weekday === d)
                    const hasAvail = avail?.startTime && avail?.endTime
                    return (
                      <span key={d} className={`text-xs px-2 py-0.5 rounded-full font-medium ${hasAvail ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {d.slice(0, 3)}{hasAvail ? ` ${avail!.startTime}` : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors" title="Editar">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deactivate(t)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Desativar">
                  <UserX className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={modal === 'create' ? 'Novo Professor' : `Editar — ${sel.name}`} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormField label="Nome" required>
              <Input value={sel.name || ''} onChange={e => setSel(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
            </FormField>
            <FormField label="Tipo">
              <Select value={sel.type} onChange={e => setSel(p => ({ ...p, type: e.target.value }))}>
                <option value="FLEXIBLE">Flexível</option>
                <option value="FIXED">Fixo</option>
              </Select>
            </FormField>
            <FormField label="Modalidade">
              <Select value={sel.modality} onChange={e => setSel(p => ({ ...p, modality: e.target.value }))}>
                {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Especialidade">
              <Input value={sel.specialty || ''} onChange={e => setSel(p => ({ ...p, specialty: e.target.value }))} placeholder="Ex: Espanhol" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Observações">
                <Textarea rows={2} value={sel.notes || ''} onChange={e => setSel(p => ({ ...p, notes: e.target.value }))} />
              </FormField>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="confirm" checked={!!sel.needsConfirm} onChange={e => setSel(p => ({ ...p, needsConfirm: e.target.checked }))} className="w-4 h-4 accent-red-600" />
              <label htmlFor="confirm" className="text-sm text-gray-700 font-medium">Precisa confirmar disponibilidade antes de marcar aulas</label>
            </div>
          </div>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Disponibilidade por dia</p>
          <div className="space-y-2">
            {WEEKDAYS.map(day => {
              const avail = sel.availability?.find(a => a.weekday === day) || { weekday: day }
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 w-16">{day}</span>
                  <input type="time" value={avail.startTime || ''} onChange={e => setAvail(day, 'startTime', e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-500" />
                  <span className="text-gray-400 text-xs">às</span>
                  <input type="time" value={avail.endTime || ''} onChange={e => setAvail(day, 'endTime', e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-500" />
                </div>
              )
            })}
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
