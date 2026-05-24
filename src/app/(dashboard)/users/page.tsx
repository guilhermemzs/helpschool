'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, UserX, RefreshCw } from 'lucide-react'
import { Modal, Button, FormField, Input, Select, Table, Th, Td } from '@/components/ui'
import { ROLE_LABELS } from '@/lib/utils'

interface User {
  id: string; name: string; email: string; role: string; active: boolean; createdAt: string
}

const EMPTY = { name: '', email: '', password: '', role: 'SECRETARY' }
const ROLES = ['ADMIN', 'COORDINATOR', 'SECRETARY', 'TEACHER']

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState<'create' | 'edit' | null>(null)
  const [sel,     setSel]     = useState<any>(EMPTY)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') router.push('/dashboard')
    else load()
  }, [session])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const isEdit = !!sel.id
    const res = await fetch(isEdit ? `/api/users/${sel.id}` : '/api/users', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sel),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error || 'Erro ao salvar'); return }
    toast.success(isEdit ? 'Usuário atualizado!' : 'Usuário criado!')
    setModal(null); load()
  }

  async function deactivate(u: User) {
    if (!confirm(`Desativar ${u.name}?`)) return
    const res = await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    if (res.ok) { toast.success('Usuário desativado'); load() }
  }

  const roleColors: Record<string, string> = {
    ADMIN:       'bg-red-50 text-red-700',
    COORDINATOR: 'bg-blue-50 text-blue-700',
    SECRETARY:   'bg-green-50 text-green-700',
    TEACHER:     'bg-purple-50 text-purple-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Usuários do Sistema</h1>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <Button onClick={() => { setSel(EMPTY); setModal('create') }}>
            <Plus className="w-4 h-4" />Novo Usuário
          </Button>
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Nome</Th><Th>E-mail</Th><Th>Perfil</Th><Th>Status</Th><Th>Criado em</Th><Th></Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Carregando...</td></tr>
          ) : users.map(u => (
            <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.active ? 'opacity-50' : ''}`}>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {u.name.slice(0,2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900">{u.name}</span>
                </div>
              </Td>
              <Td className="text-gray-500 font-mono text-xs">{u.email}</Td>
              <Td>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
              </Td>
              <Td>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {u.active ? 'Ativo' : 'Inativo'}
                </span>
              </Td>
              <Td className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</Td>
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => { setSel({ ...u, password: '' }); setModal('edit') }}
                    className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors" title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {u.active && u.id !== session?.user.id && (
                    <button onClick={() => deactivate(u)}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Desativar">
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {modal && (
        <Modal title={modal === 'create' ? 'Novo Usuário' : 'Editar Usuário'} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nome completo" required>
              <Input value={sel.name} onChange={e => setSel((p: any) => ({ ...p, name: e.target.value }))} placeholder="Nome" />
            </FormField>
            <FormField label="E-mail" required>
              <Input type="email" value={sel.email} onChange={e => setSel((p: any) => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" />
            </FormField>
            <FormField label={modal === 'create' ? 'Senha' : 'Nova senha (deixe em branco para manter)'}>
              <Input type="password" value={sel.password || ''} onChange={e => setSel((p: any) => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
            </FormField>
            <FormField label="Perfil de acesso">
              <Select value={sel.role} onChange={e => setSel((p: any) => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </Select>
            </FormField>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Permissões por perfil:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><span className="font-semibold text-red-700">Administrador:</span> Acesso total — pode excluir dados e gerenciar usuários.</p>
              <p><span className="font-semibold text-blue-700">Coordenação:</span> CRUD completo de turmas, professores e escalas. Sem gerenciar usuários.</p>
              <p><span className="font-semibold text-green-700">Secretaria:</span> Visualizar e editar escala e turmas. Sem excluir e sem relatórios avançados.</p>
              <p><span className="font-semibold text-purple-700">Professor:</span> Visualizar apenas suas próprias aulas (futuro).</p>
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
