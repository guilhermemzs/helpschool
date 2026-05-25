'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, UserCheck, Clock, Calendar, CalendarDays, Printer, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard',        href: '/dashboard',          icon: <LayoutDashboard className="w-4 h-4" />, section: 'Principal' },
  { label: 'Escala Diária',    href: '/daily-schedule',     icon: <CalendarDays className="w-4 h-4" />,    section: 'Principal' },
  { label: 'Aulas Flexíveis',  href: '/flexible-calendar',  icon: <Calendar className="w-4 h-4" />,        section: 'Principal' },
  { label: 'Turmas',           href: '/classes',            icon: <BookOpen className="w-4 h-4" />,        section: 'Cadastros' },
  { label: 'Grade Fixa',       href: '/fixed-lessons',      icon: <Clock className="w-4 h-4" />,           section: 'Cadastros' },
  { label: 'Professores',      href: '/teachers',           icon: <UserCheck className="w-4 h-4" />,       section: 'Cadastros' },
  { label: 'Impressão',        href: '/print',              icon: <Printer className="w-4 h-4" />,         section: 'Saídas' },
  { label: 'Usuários',         href: '/users',              icon: <Users className="w-4 h-4" />,           section: 'Sistema', roles: ['ADMIN'] },
  { label: 'Configurações',    href: '/settings',           icon: <Settings className="w-4 h-4" />,        section: 'Sistema' },
]

const SECTIONS = ['Principal','Cadastros','Saídas','Sistema']

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  return (
    <aside className="w-56 bg-gray-950 flex flex-col flex-shrink-0 overflow-y-auto">
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black italic text-white" style={{ fontFamily: 'Georgia, serif' }}>Help</span>
          <span className="text-sm font-bold text-red-500" style={{ fontFamily: 'Georgia, serif' }}>school</span>
        </div>
        <p className="text-gray-500 text-[10px] tracking-widest uppercase mt-0.5">Sistema de Gestão</p>
      </div>
      <nav className="flex-1 py-2">
        {SECTIONS.map(section => {
          const items = NAV.filter(n => n.section === section && (!n.roles || n.roles.includes(role)))
          if (!items.length) return null
          return (
            <div key={section}>
              <p className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{section}</p>
              {items.map(item => {
                const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href}
                    className={cn('flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                      active ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
                    {item.icon}{item.label}
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
