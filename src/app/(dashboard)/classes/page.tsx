'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Pencil, Trash2, RefreshCw, Download } from 'lucide-react'
import {
  StatCard, SectionHeader, Modal, Button, FormField, Input, Select, Textarea,
  Table, Th, Td, ModalityBadge, StatusBadge, ClassStatusBadge, Alert
} from '@/components/ui'
import { MODALITY_LABELS, LEVELS, AGE_GROUPS, CLASS_STATUS_LABELS } from '@/lib/utils'

interface Class {
  id: string; code: string; studentNames: string; classType: string; level: string
  ageGroup: string; allowedTeachers: string; teachingModality: string; testStatus: string
  lessonsPerWeek: number; notes: string; status: string
}

const EMPTY: Partial<Class> = {
  code: '', studentNames: '', classType: 'Individual', level: 'A1', ageGroup: '17+',
  allowedTeachers: 'Todos', teachingModality: 'ONLINE', testStatus: 'FAZER',
  lessonsPerWeek: 2, notes: '', status: 'ACTIVE',
}

export default function ClassesPage() {
  const [classes,  setClasses]  = useState<Class[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [level,    setLevel]    = useState('')
  const [modality, setModality] = useState('')
  const [status,   setStatus]   = useState('ACTIVE')
  const [modal,    setModal]    = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Partial<Class>>(EMPTY)
  const [saving,   setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ search, level, modality, status })
    const res = await fetch(`/api/classes?${params}`)
    setClasses(await res.json())
    setLoading(false)
  }, [search, level, modality, status])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    const isEdit = !!selected.id
    const res = await fetch(isEdit ? `/api/classes/${selected.id}` : '/api/classes', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...selected, lessonsPerWeek: Number(selected.lessonsPerWeek) }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error || 'Erro ao salvar'); return }
    toast.success(isEdit ? 'Turma atualizada!' : 'Turma criada!')
    setModal(null); load()
  }

  async function del(cls: Class) {
    if (!confirm(`Excluir ${cls.code}? Esta ação não pode ser desfeita.`)) return
    const res = await fetch(`/api/classes/${cls.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Turma excluída'); load() }
    else toast.error('Erro ao excluir turma')
  }

  function openEdit(cls: Class) { setSelected(cls); setModal('edit') }
  function openCreate() { setSelected(EMPTY); setModal('create') }
  function field(k: keyof Class, v: any) { setSelected(p => ({ ...p, [k]: v })) }

  const stats = {
    total:    classes.length,
    active:   classes.filter(c => c.status === 'ACTIVE').length,
    paused:   classes.filter(c => c.status === 'PAUSED').length,
    online:   classes.filter(c => c.teachingModality === 'ONLINE').length,
    presencial:classes.filter(c => c.teachingModality === 'PRESENCIAL').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Turmas</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.open('/api/export?type=classes')}>
            <Download className="w-3.5 h-3.5" />Exportar Excel
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />Nova Turma
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Ativas" value={stats.active} accent="border-l-green-400" />
        <StatCard label="Pausadas" value={stats.paused} accent="border-l-yellow-400" />
        <StatCard label="Online" value={stats.online} accent="border-l-gray-400" />
        <StatCard label="Presencial" value={stats.presencial} accent="border-l-red-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar turma ou aluno..."
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:border-red-500"
          />
        </div>
        <select value={level} onChange={e => setLevel(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
          <option value="">Todos os níveis</option>
          {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={modality} onChange={e => setModality(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
          <option value="">Todas as modalidades</option>
          {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500">
          <option value="">Todos os status</option>
          {Object.entries(CLASS_STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <span className="ml-auto text-xs text-gray-400 self-center">{classes.length} turma(s)</span>
      </div>

      {/* Table */}
      <Table>
        <thead>
          <tr>
            <Th>Turma</Th><Th>Aluno(s)</Th><Th>Tipo</Th><Th>Nível</Th>
            <Th>Modalidade</Th><Th>Professores</Th><Th>Prova</Th><Th>Aulas</Th>
            <Th>Status</Th><Th>Obs</Th><Th></Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={11} className="text-center py-8 text-gray-400 text-sm">Carregando...</td></tr>
          ) : classes.length === 0 ? (
            <tr><td colSpan={11} className="text-center py-8 text-gray-400 text-sm">Nenhuma turma encontrada.</td></tr>
          ) : classes.map(cls => (
            <tr key={cls.id} className={`hover:bg-gray-50 transition-colors ${cls.status === 'PAUSED' ? 'bg-yellow-50/40' : ''}`}>
              <Td><span className="font-bold text-gray-900">{cls.code}</span></Td>
              <Td><span className="text-gray-800">{cls.studentNames}</span></Td>
              <Td>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls.classType === 'Individual' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                  {cls.classType}
                </span>
              </Td>
              <Td><span className="font-semibold text-xs">{cls.level}</span></Td>
              <Td><ModalityBadge modality={cls.teachingModality} /></Td>
              <Td className="max-w-[150px]"><span className="text-xs text-gray-500 line-clamp-1">{cls.allowedTeachers}</span></Td>
              <Td>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  cls.testStatus === 'ENTREGUE' ? 'bg-green-50 text-green-700' :
                  cls.testStatus === 'FAZENDO'  ? 'bg-orange-50 text-orange-700' : 'text-gray-500'
                }`}>{cls.testStatus}</span>
              </Td>
              <Td className="text-center"><span className="font-bold text-sm">{cls.lessonsPerWeek}x</span></Td>
              <Td><ClassStatusBadge status={cls.status} /></Td>
              <Td className="max-w-[120px]"><span className="text-xs text-gray-400 line-clamp-1">{cls.notes}</span></Td>
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cls)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => del(cls)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Excluir">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal */}
      {modal && (
        <Modal title={modal === 'create' ? 'Nova Turma' : `Editar — ${selected.code}`} onClose={() => setModal(null)} size="lg">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Código da turma" required>
              <Input value={selected.code || ''} onChange={e => field('code', e.target.value)} placeholder="Class 160" />
            </FormField>
            <FormField label="Nome do aluno" required>
              <Input value={selected.studentNames || ''} onChange={e => field('studentNames', e.target.value)} placeholder="Nome completo" />
            </FormField>
            <FormField label="Tipo">
              <Select value={selected.classType} onChange={e => field('classType', e.target.value)}>
                <option>Individual</option><option>Grupo</option>
              </Select>
            </FormField>
            <FormField label="Nível">
              <Select value={selected.level} onChange={e => field('level', e.target.value)}>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </Select>
            </FormField>
            <FormField label="Faixa etária">
              <Select value={selected.ageGroup} onChange={e => field('ageGroup', e.target.value)}>
                {AGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
            </FormField>
            <FormField label="Aulas por semana">
              <Select value={selected.lessonsPerWeek} onChange={e => field('lessonsPerWeek', e.target.value)}>
                <option value={1}>1x</option><option value={2}>2x</option><option value={3}>3x</option>
              </Select>
            </FormField>
            <FormField label="Modalidade de ensino">
              <Select value={selected.teachingModality} onChange={e => field('teachingModality', e.target.value)}>
                {Object.entries(MODALITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={selected.status} onChange={e => field('status', e.target.value)}>
                {Object.entries(CLASS_STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Status da prova">
              <Select value={selected.testStatus} onChange={e => field('testStatus', e.target.value)}>
                <option value="FAZER">Fazer</option>
                <option value="FAZENDO">Fazendo</option>
                <option value="ENTREGUE">Entregue</option>
                <option value="CORRIGINDO">Corrigindo</option>
              </Select>
            </FormField>
            <div />
            <FormField label="Professores permitidos / restrições" required>
              <Input value={selected.allowedTeachers || ''} onChange={e => field('allowedTeachers', e.target.value)} placeholder="Ex: Todos, menos William, Só com Amanda..." />
            </FormField>
            <div />
            <div className="col-span-2">
              <FormField label="Observações">
                <Textarea rows={2} value={selected.notes || ''} onChange={e => field('notes', e.target.value)} placeholder="Observações internas..." />
              </FormField>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : modal === 'create' ? 'Criar turma' : 'Salvar alterações'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
