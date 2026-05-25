'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, UserX } from 'lucide-react'
import { Modal, Button, FormField, Input, Select, Textarea } from '@/components/ui'
import { WEEKDAYS, MODALITY_LABELS } from '@/lib/utils'

interface Teacher {
  id: string; name: string; status: string; type: string; modalities: string
  languages: string; specialty?: string; needsConfirm: boolean; notes?: string; restrictions?: string
  availability: { weekday: string; startTime?: string; endTime?: string }[]
}

const EMPTY: any = { name: '', status: 'ACTIVE', type: 'FLEXIBLE', modalities: '["ONLINE"]', languages: 'Inglês', specialty: '', needsConfirm: true, notes: '', restrictions: '', availability: WEEKDAYS.map(d => ({ weekday: d, startTime: '', endTime: '' })) }

const STATUS_OPTS = [['ACTIVE','Ativo'],['INACTIVE','Inativo'],['VACATION','Férias'],['UNAVAILABLE','Indisponível']]

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'create'|'edit'|null>(null)
  const [sel,      setSel]      = useState<any>(EMPTY)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/teachers')
    setTeachers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    const isEdit = !!sel.id
    const body = { ...sel, availability: sel.availability.filter((a: any) => a.startTime && a.endTime) }
    const res = await fetch(isEdit ? `/api/teachers/${sel.id}` : '/api/teachers', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Erro ao salvar'); return }
    toast.success(isEdit ? 'Professor atualizado!' : 'Professor cadastrado!')
    setModal(null); load()
  }

  function initials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) }
  const colors = ['bg-red-100 text-red-700','bg-blue-100 text-blue-700','bg-green-100 text-green-700','bg-purple-100 text-purple-700','bg-orange-100 text-orange-700']
  const color  = (name: string) => colors[name.length % colors.length]

  function openEdit(t: Teacher) {
    const avail = WEEKDAYS.map(d => sel.availability?.find((a: any) => a.weekday === d) || t.availability?.find(a => a.weekday === d) || { weekday: d, startTime: '', endTime: '' })
    setSel({ ...t, availability: avail }); setModal('edit')
  }

  function openCreate() { setSel({ ...EMPTY, availability: WEEKDAYS.map(d => ({ weekday: d, startTime: '', endTime: '' })) }); setModal('create') }

  const modality_parsed = (m: string) => { try { return JSON.parse(m) } catch { return [m] } }

  const toggleModality = (mod: string) => {
    const current = modality_parsed(sel.modalities)
    const next = current.includes(mod) ? current.filter((m: string) => m !== mod) : [...current, mod]
    setSel((p: any) => ({ ...p, modalities: JSON.stringify(next) }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Professores</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />Novo Professor</Button>
      </div>

      {loading ? <p className="text-center py-8 text-gray-400">Carregando...</p> : (
        <div className="space-y-2">
          {teachers.map(t => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${color(t.name)}`}>{initials(t.name)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">{t.name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.type === 'FIXED' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{t.type === 'FIXED' ? 'Fixo' : 'Flexível'}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{STATUS_OPTS.find(s => s[0] === t.status)?.[1] || t.status}</span>
                  {t.languages && <span className="text-xs text-purple-600 font-medium">{t.languages}</span>}
                  {t.needsConfirm && <span className="text-xs text-yellow-600">⚠ Confirmar</span>}
                  <div className="flex gap-1">
                    {modality_parsed(t.modalities).map((m: string) => (
                      <span key={m} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{MODALITY_LABELS[m] || m}</span>
                    ))}
                  </div>
                </div>
                {t.notes && <p className="text-xs text-gray-500 mt-1">{t.notes}</p>}
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {WEEKDAYS.map(d => {
                    const a = t.availability?.find(x => x.weekday === d)
                    return (
                      <span key={d} className={`text-xs px-2 py-0.5 rounded-full font-medium ${a?.startTime ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {d.slice(0,3)}{a?.startTime ? ` ${a.startTime}` : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Pencil className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Novo Professor' : `Editar — ${sel.name}`} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormField label="Nome" required>
              <Input value={sel.name || ''} onChange={e => setSel((p: any) => ({ ...p, name: e.target.value }))} />
            </FormField>
            <FormField label="Status">
              <Select value={sel.status} onChange={e => setSel((p: any) => ({ ...p, status: e.target.value }))}>
                {STATUS_OPTS.map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Tipo">
              <Select value={sel.type} onChange={e => setSel((p: any) => ({ ...p, type: e.target.value }))}>
                <option value="FLEXIBLE">Flexível</option>
                <option value="FIXED">Fixo</option>
              </Select>
            </FormField>
            <FormField label="Idioma(s)">
              <Input value={sel.languages || ''} onChange={e => setSel((p: any) => ({ ...p, languages: e.target.value }))} placeholder="Inglês, Espanhol" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Modalidades que atende">
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(MODALITY_LABELS).map(([k,v]) => {
                    const checked = modality_parsed(sel.modalities).includes(k)
                    return (
                      <label key={k} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer text-sm transition-colors ${checked ? 'bg-red-50 border-red-400 text-red-700 font-semibold' : 'border-gray-300 text-gray-600'}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleModality(k)} className="hidden" />{v}
                      </label>
                    )
                  })}
                </div>
              </FormField>
            </div>
            <FormField label="Especialidade">
              <Input value={sel.specialty || ''} onChange={e => setSel((p: any) => ({ ...p, specialty: e.target.value }))} placeholder="Ex: Espanhol avançado" />
            </FormField>
            <FormField label="Restrições">
              <Input value={sel.restrictions || ''} onChange={e => setSel((p: any) => ({ ...p, restrictions: e.target.value }))} placeholder="Ex: Não faz domicílio" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Observações">
                <Textarea rows={2} value={sel.notes || ''} onChange={e => setSel((p: any) => ({ ...p, notes: e.target.value }))} />
              </FormField>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="confirm" checked={!!sel.needsConfirm} onChange={e => setSel((p: any) => ({ ...p, needsConfirm: e.target.checked }))} className="w-4 h-4 accent-red-600" />
              <label htmlFor="confirm" className="text-sm text-gray-700">Precisa confirmar disponibilidade antes de marcar aulas</label>
            </div>
          </div>

          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Disponibilidade por dia</p>
          <div className="space-y-2">
            {WEEKDAYS.map(day => {
              const a = sel.availability?.find((x: any) => x.weekday === day) || { weekday: day }
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700 w-16">{day}</span>
                  <input type="time" value={a.startTime || ''} onChange={e => setSel((p: any) => ({ ...p, availability: p.availability.map((av: any) => av.weekday === day ? { ...av, startTime: e.target.value } : av) }))}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-500" />
                  <span className="text-gray-400 text-xs">às</span>
                  <input type="time" value={a.endTime || ''} onChange={e => setSel((p: any) => ({ ...p, availability: p.availability.map((av: any) => av.weekday === day ? { ...av, endTime: e.target.value } : av) }))}
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
