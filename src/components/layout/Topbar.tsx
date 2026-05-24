'use client'
import { signOut } from 'next-auth/react'
import { LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { ROLE_LABELS } from '@/lib/utils'

interface TopbarProps {
  user: { name: string; email: string; role: string }
}

export function Topbar({ user }: TopbarProps) {
  const [open, setOpen] = useState(false)
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center gap-4 flex-shrink-0">
      <p className="text-xs text-gray-400 font-medium capitalize">{today}</p>
      <div className="flex-1" />

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold leading-none">{user.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABELS[user.role] || user.role}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair do sistema
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
