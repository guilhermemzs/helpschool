'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { Modal, Button, FormField, Input, Select, Textarea, Table, Th, Td, ModalityBadge, ClassStatusBadge } from '@/components/ui'
import { MODALITY_LABELS, LEVELS, AGE_GROUPS, CLASS_STATUS_LABELS } from '@/lib/utils'

interface Class {
  id: string; code: string; studentNames: string; classType: string; groupType: string
  modality: string; level: string; ageGroup?: string; lessonsPerWeek: number
  allowedTeachers?: string; restrictedTeachers?: string; notes?: string; status: string
}

const EMPTY: Partial<Class> = {
  code: '', studentNames: '', classType: 'FIXED', groupType: 'Individual',
  modality: 'ONLINE', level: 'A1', ageGroup: '17+', lessonsPerWeek: 2,
  allowedTeachers: '', restrictedTeachers: '', notes: '', status: 'ACTIVE',
}

export default function ClassesPage() {
  const [classes,  setClasses]  = useState<Class[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [typeF,    setTypeF]    = useState('')
  const [statusF,  setStatusF]  = useState('ACTIVE')
  const [modal,    setModal]    = useState<'create'|'edit'|null>(null)
  const [sel,      setSel]      = useState<Partial<Class>>(EMPTY)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ search, type: typeF, status: statusF })
    const res = await fetch(`/api/classes?${p}`)
    setClasses(await res.json())
    setLoading(false)
  }, [search, typeF, statusF])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    const isEdit = !!sel.id
    const res = await fetch(isEdit ? `/api/classes/${sel.id}` : '/api/classes', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sel, lessonsPerWeek: Number(sel.lessonsPerWeek) }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error || 'Erro ao salvar'); return }
    toast.success(isEdit ? 'Turma atualizada!' : 'Turma criada!')
    setModal(null); load()
  }

  async function del(cls: Class) {
    if (!confirm(`Excluir ${cls.code}?`)) return
    await fetch(`/api/classes/${cls.id}`, { method: 'DELETE' })
    toast.success('Excluída'); load()
  }

  const f = (k: keyof Class, v: any) => setSel(p => ({ ...p, [k]: v }))

  const stats = {
    total: classes.length,
    fixed: classes.filter(c => c.classType === 'FIXED').length,
    flex:  classes.filter(c => c.classType === 'FLEXIBLE').length,
    active:classes.filter(c => c.status === 'ACTIVE').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Turmas</h1>
        <Button onClick={() => { setSel(EMPTY); setModal('create') }}><Plus className="w-4 h-4" />Nova Turma</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Total</p><p className="text-2xl font-bold">{stats.total}</p></div>
        <div className="bg-white border border-gray-200 border-l-4 border-l-green-400 rounded-xl p-4"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Ativas</p><p className="text-2xl font-bold text-green-700">{stats.active}</p></div>
        <div className="bg-white border border-gray-200 border-l-4 border-l-blue-400 rounded-xl p-4"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Fixas</p><p className="text-2xl font-bold text-blue-700">{stats.fixed}</p></div>
        <div className="bg-white border border-gray-200 border-l-4 border-l-purple-400 rounded-xl p-4"><p className="text-xs font-bold text-gray-400 uppercase mb-1">Flexíveis</p><p className="text-2xl font-bold text-purple-700">{stats.flex}</p></div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar turma ou aluno..."
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:border-red-500" />
        </div>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
          <option value="">Todos os tipos</option>
          <option value="FIXED">Fixa</option>
          <option value="FLEXIBLE">Flexível</option>
        </select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
          <option value="">Todos os status</option>
          {Object.entries(CLASS_STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"><RefreshCw className="w-3.5 h-3.5 text-gray-500" /></button>
        <span className="ml-auto text-xs text-gray-400 self-center">{classes.length} turma(s)</span>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Turma</Th><Th>Aluno(s)</Th><Th>Tipo</Th><Th>Nível</Th>
            <Th>Modalidade</Th><Th>Aulas/sem</Th><Th>Status</Th><Th>Obs</Th><Th></Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="text-center py-8 text-gray-400">Carregando...</td></tr>
          ) : classes.length === 0 ? (
            <tr><td colSpan={9} className="text-center py-8 text-gray-400">Nenhuma turma encontrada.</td></tr>
          ) : classes.map(cls => (
            <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
              <Td><span className="font-bold text-gray-900">{cls.code}</span></Td>
              <Td><span className="text-gray-800">{cls.studentNames}</span></Td>
              <Td>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls.classType === 'FIXED' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                  {cls.classType === 'FIXED' ? 'Fixa' : 'Flexível'}
                </span>
              </Td>
              <Td><span className="font-semibold text-xs">{cls.level}</span></Td>
              <Td><ModalityBadge modality={cls.modality} /></Td>
              <Td className="text-center"><span className="font-bold">{cls.lessonsPerWeek}x</span></Td>
              <Td><ClassStatusBadge status={cls.status} /></Td>
              <Td className="max-w-[120px]"><span className="text-xs text-gray-400 line-clamp-1">{cls.notes}</span></Td>
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => { setSel(cls); setModal('edit') }} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(cls)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {modal && (
        <Modal title={modal === 'create' ? 'Nova Turma' : `Editar — ${sel.code}`} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Código" required>
              <Input value={sel.code || ''} onChange={e => f('code', e.target.value)} placeholder="Class 80" />
            </FormField>
            <FormField label="Aluno(s)" required>
              <Input value={sel.studentNames || ''} onChange={e => f('studentNames', e.target.value)} placeholder="Nome completo" />
            </FormField>
            <FormField label="Tipo de turma">
              <Select value={sel.classType} onChange={e => f('classType', e.target.value)}>
                <option value="FIXED">Fixa (dia e horário definidos)</option>
                <option value="FLEXIBLE">Flexível (sem dia/horário fixo)</option>
              </Select>
            </FormField>
            <FormField label="Individual ou Grupo">
              <Select value={sel.groupType} onChange={e => f('groupType', e.target.value)}>
                <option>Individual</option><option>Grupo</option>
              </Select>
            </FormField>
            <FormField label="Nível">
              <Select value={sel.level} onChange={e => f('level', e.target.value)}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </Select>
            </FormField>
            <FormField label="Faixa etária">
              <Select value={sel.ageGroup} onChange={e => f('ageGroup', e.target.value)}>
                {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
            </FormField>
            <FormField label="Modalidade">
              <Select value={sel.modality} onChange={e => f('modality', e.target.value)}>
                {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Aulas por semana">
              <Select value={sel.lessonsPerWeek} onChange={e => f('lessonsPerWeek', e.target.value)}>
                {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}x por semana</option>)}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={sel.status} onChange={e => f('status', e.target.value)}>
                {Object.entries(CLASS_STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <div />
            <FormField label="Professores permitidos">
              <Input value={sel.allowedTeachers || ''} onChange={e => f('allowedTeachers', e.target.value)} placeholder="Ex: Yuri, Amanda, Lays" />
            </FormField>
            <FormField label="Professores restritos">
              <Input value={sel.restrictedTeachers || ''} onChange={e => f('restrictedTeachers', e.target.value)} placeholder="Ex: William, Ana Clara" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Observações">
                <Textarea rows={2} value={sel.notes || ''} onChange={e => f('notes', e.target.value)} />
              </FormField>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Salvando...' : modal === 'create' ? 'Criar turma' : 'Salvar'}</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
