'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { Modal, Button, FormField, Input, Select, Textarea, Table, Th, Td, ModalityBadge, Alert } from '@/components/ui'
import { MODALITY_LABELS } from '@/lib/utils'

interface FlexStudent {
  id: string; studentName: string; lessonsPerWeek: number; preferredModality?: string
  notes?: string; status: string; lastLesson?: string; nextLesson?: string
  class: { code: string }
}

const EMPTY = { studentName: '', classCode: '', lessonsPerWeek: 1, preferredModality: '', notes: '', status: 'ACTIVE' }

export default function FlexibleStudentsPage() {
  const [students, setStudents] = useState<FlexStudent[]>([])
  const [classes,  setClasses]  = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('ACTIVE')
  const [modal,    setModal]    = useState<'create'|'edit'|null>(null)
  const [sel,      setSel]      = useState<any>(EMPTY)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [sr, cr] = await Promise.all([
      fetch(`/api/flexible-students?search=${search}&status=${status}`),
      fetch('/api/classes?status=ACTIVE'),
    ])
    setStudents(await sr.json())
    setClasses(await cr.json())
    setLoading(false)
  }, [search, status])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    const isEdit = !!sel.id
    const cls = classes.find(c => c.code === sel.classCode)
    const body = isEdit ? sel : { ...sel, classId: cls?.id }

    const res = await fetch(isEdit ? `/api/flexible-students/${sel.id}` : '/api/flexible-students', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Erro ao salvar'); return }
    toast.success(isEdit ? 'Atualizado!' : 'Cadastrado!')
    setModal(null); load()
  }

  async function del(s: FlexStudent) {
    if (!confirm(`Excluir ${s.studentName}?`)) return
    await fetch(`/api/flexible-students/${s.id}`, { method: 'DELETE' })
    toast.success('Excluído'); load()
  }

  const withoutNext = students.filter(s => !s.nextLesson && s.status === 'ACTIVE')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Alunos Flexíveis</h1>
        <Button onClick={() => { setSel(EMPTY); setModal('create') }}>
          <Plus className="w-4 h-4" />Novo Flexível
        </Button>
      </div>

      {withoutNext.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-2 text-sm text-yellow-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <strong>{withoutNext.length} aluno(s) sem próxima aula marcada.</strong>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome ou turma..."
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-52 focus:outline-none focus:border-red-500" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="WAITING">Aguardando</option>
          <option value="PAUSED">Pausado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <span className="ml-auto text-xs text-gray-400 self-center">{students.length} aluno(s)</span>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Turma</Th><Th>Aluno</Th><Th>Aulas/sem</Th><Th>Modalidade</Th>
            <Th>Última aula</Th><Th>Próxima aula</Th><Th>Obs</Th><Th>Status</Th><Th></Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="text-center py-8 text-gray-400">Carregando...</td></tr>
          ) : students.map(s => (
            <tr key={s.id} className={`hover:bg-gray-50 ${!s.nextLesson && s.status === 'ACTIVE' ? 'bg-yellow-50/50' : ''}`}>
              <Td><span className="font-bold">{s.class?.code}</span></Td>
              <Td>{s.studentName}</Td>
              <Td className="text-center"><span className="font-bold">{s.lessonsPerWeek}x</span></Td>
              <Td>{s.preferredModality ? <ModalityBadge modality={s.preferredModality} /> : <span className="text-gray-400 text-xs">—</span>}</Td>
              <Td className="text-xs text-gray-500">{s.lastLesson ? new Date(s.lastLesson).toLocaleDateString('pt-BR') : '—'}</Td>
              <Td>
                {s.nextLesson
                  ? <span className="text-green-700 font-semibold text-xs">{new Date(s.nextLesson).toLocaleDateString('pt-BR')}</span>
                  : s.status === 'ACTIVE' ? <span className="text-red-600 font-bold text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Sem aula!</span> : '—'}
              </Td>
              <Td className="text-xs text-gray-400 max-w-[120px]">{s.notes}</Td>
              <Td>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  s.status === 'ACTIVE'    ? 'bg-green-50 text-green-700' :
                  s.status === 'WAITING'   ? 'bg-yellow-50 text-yellow-700' :
                  s.status === 'PAUSED'    ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-500'
                }`}>{s.status === 'ACTIVE' ? 'Ativo' : s.status === 'WAITING' ? 'Aguardando' : s.status === 'PAUSED' ? 'Pausado' : 'Cancelado'}</span>
              </Td>
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => { setSel({ ...s, classCode: s.class?.code }); setModal('edit') }} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(s)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {modal && (
        <Modal title={modal === 'create' ? 'Novo Aluno Flexível' : 'Editar Aluno'} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Turma" required>
              <Select value={sel.classCode || ''} onChange={e => setSel((p: any) => ({ ...p, classCode: e.target.value }))}>
                <option value="">Selecionar...</option>
                {classes.map(c => <option key={c.id} value={c.code}>{c.code} — {c.studentNames}</option>)}
              </Select>
            </FormField>
            <FormField label="Nome do aluno" required>
              <Input value={sel.studentName} onChange={e => setSel((p: any) => ({ ...p, studentName: e.target.value }))} />
            </FormField>
            <FormField label="Aulas por semana">
              <Select value={sel.lessonsPerWeek} onChange={e => setSel((p: any) => ({ ...p, lessonsPerWeek: Number(e.target.value) }))}>
                <option value={1}>1x</option><option value={2}>2x</option><option value={3}>3x</option>
              </Select>
            </FormField>
            <FormField label="Modalidade preferencial">
              <Select value={sel.preferredModality || ''} onChange={e => setSel((p: any) => ({ ...p, preferredModality: e.target.value || null }))}>
                <option value="">Sem preferência</option>
                {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={sel.status} onChange={e => setSel((p: any) => ({ ...p, status: e.target.value }))}>
                <option value="ACTIVE">Ativo</option>
                <option value="WAITING">Aguardando</option>
                <option value="PAUSED">Pausado</option>
                <option value="CANCELLED">Cancelado</option>
              </Select>
            </FormField>
            <div />
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
