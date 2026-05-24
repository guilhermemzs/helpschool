'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Database, RefreshCw } from 'lucide-react'
import { Button, FormField, Input, Alert } from '@/components/ui'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Configurações</h1>

      <div className="space-y-4">
        {/* System info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-red-500" />
            Sistema
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-medium">Versão</span>
              <span className="font-mono text-gray-400">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-medium">Framework</span>
              <span className="font-mono text-gray-400">Next.js 14 + TypeScript</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-medium">Banco de dados</span>
              <span className="font-mono text-gray-400">PostgreSQL + Prisma</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium">Autenticação</span>
              <span className="font-mono text-gray-400">NextAuth.js</span>
            </div>
          </div>
        </div>

        {/* Backup/export */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-gray-800 mb-3">Exportação de dados</h2>
          <p className="text-sm text-gray-500 mb-4">Exporte todos os dados do sistema em formato Excel.</p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => window.open('/api/export?type=classes')}>
              Turmas (.xlsx)
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.open('/api/export?type=teachers')}>
              Professores (.xlsx)
            </Button>
          </div>
        </div>

        <Alert type="info">
          <span className="text-sm">Para redefinir senhas de usuários ou alterar permissões, acesse a página <strong>Usuários</strong> no menu lateral.</span>
        </Alert>
      </div>
    </div>
  )
}
