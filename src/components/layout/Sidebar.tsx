'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCheck, Clock, Calendar, CalendarDays,
  Printer, BarChart2, Upload, Settings, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href:  string
  icon:  React.ReactNode
  roles?: string[]
  badge?: string
}

const NAV: NavItem[] = [
  { label: 'Dashboard',        href: '/dashboard',          icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Escala Diária',    href: '/daily',              icon: <CalendarDays className="w-4 h-4" /> },
  { label: 'Escala Semanal',   href: '/schedule',           icon: <Calendar className="w-4 h-4" /> },
  { label: 'Turmas',           href: '/classes',            icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Flexíveis',        href: '/flexible-students',  icon: <Clock className="w-4 h-4" /> },
  { label: 'Professores',      href: '/teachers',           icon: <UserCheck className="w-4 h-4" /> },
  { label: 'Impressão',        href: '/print',              icon: <Printer className="w-4 h-4" /> },
  { label: 'Relatórios',       href: '/reports',            icon: <BarChart2 className="w-4 h-4" />, roles: ['ADMIN','COORDINATOR'] },
  { label: 'Importação',       href: '/import',             icon: <Upload className="w-4 h-4" />, roles: ['ADMIN','COORDINATOR'] },
  { label: 'Usuários',         href: '/users',              icon: <Users className="w-4 h-4" />, roles: ['ADMIN'] },
  { label: 'Configurações',    href: '/settings',           icon: <Settings className="w-4 h-4" />, roles: ['ADMIN','COORDINATOR'] },
]

const SECTIONS = [
  { label: 'Principal',  items: ['Dashboard','Escala Diária','Escala Semanal'] },
  { label: 'Cadastros',  items: ['Turmas','Flexíveis','Professores'] },
  { label: 'Saídas',     items: ['Impressão','Relatórios'] },
  { label: 'Sistema',    items: ['Importação','Usuários','Configurações'] },
]

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()

  const visible = NAV.filter(n => !n.roles || n.roles.includes(role))
  const byLabel = Object.fromEntries(visible.map(n => [n.label, n]))

  return (
    <aside className="w-56 bg-gray-950 flex flex-col flex-shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black italic text-white" style={{ fontFamily: 'Georgia, serif' }}>Help</span>
          <span className="text-sm font-bold text-red-500" style={{ fontFamily: 'Georgia, serif' }}>school</span>
        </div>
        <p className="text-gray-500 text-[10px] tracking-widest uppercase mt-0.5 font-medium">Sistema de Gestão</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {SECTIONS.map(section => {
          const items = section.items.map(l => byLabel[l]).filter(Boolean)
          if (!items.length) return null
          return (
            <div key={section.label}>
              <p className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                {section.label}
              </p>
              {items.map(item => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href} href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
