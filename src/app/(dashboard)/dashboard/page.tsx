import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/ui'
import { getWeekdayFromDate, getWeekStart } from '@/lib/utils'
import { AlertTriangle, BookOpen, Users, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const today = new Date()
  const todayWeekday = getWeekdayFromDate(today)
  const weekStart = getWeekStart(today)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const todayStr = today.toISOString().split('T')[0]

  const [
    totalClasses, activeClasses, fixedClasses, flexClasses,
    totalTeachers,
    todayFixed, todayDaily,
    flexPending,
  ] = await Promise.all([
    prisma.class.count(),
    prisma.class.count({ where: { status: 'ACTIVE' } }),
    prisma.class.count({ where: { status: 'ACTIVE', classType: 'FIXED' } }),
    prisma.class.count({ where: { status: 'ACTIVE', classType: 'FLEXIBLE' } }),
    prisma.teacher.count({ where: { status: 'ACTIVE' } }),
    prisma.fixedLesson.count({ where: { weekday: todayWeekday, active: true } }),
    prisma.dailyLesson.findMany({
      where: { date: { gte: new Date(todayStr), lt: new Date(new Date(todayStr).setDate(new Date(todayStr).getDate()+1)) } },
      select: { status: true, modality: true, teacherId: true },
    }),
    prisma.class.findMany({
      where: { status: 'ACTIVE', classType: 'FLEXIBLE' },
      include: {
        flexibleSchedules: {
          where: { date: { gte: weekStart, lte: weekEnd } },
          select: { id: true },
        }
      }
    }),
  ])

  const confirmed  = todayDaily.filter(l => l.status === 'CONFIRMED').length
  const cancelled  = todayDaily.filter(l => l.status === 'CANCELLED').length
  const pending    = todayDaily.filter(l => l.status === 'PENDING').length
  const online     = todayDaily.filter(l => l.modality === 'ONLINE').length
  const presencial = todayDaily.filter(l => l.modality === 'PRESENCIAL').length

  const flexComplete = flexPending.filter(c => c.flexibleSchedules.length >= c.lessonsPerWeek).length
  const flexMissing  = flexPending.filter(c => c.flexibleSchedules.length < c.lessonsPerWeek).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Olá, {session?.user.name}! Hoje é {todayWeekday}, {today.toLocaleDateString('pt-BR')}.</p>
        </div>
        <Link href="/daily-schedule" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
          Abrir Escala de Hoje →
        </Link>
      </div>

      {flexMissing > 0 && (
        <div className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3 text-sm text-yellow-800">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span><strong>{flexMissing} turma(s) flexível(is)</strong> ainda não completou as aulas desta semana.{' '}
            <Link href="/flexible-calendar" className="underline font-semibold">Agendar agora</Link>
          </span>
        </div>
      )}

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Turmas</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total de turmas" value={totalClasses} />
        <StatCard label="Ativas" value={activeClasses} accent="border-l-green-400" />
        <StatCard label="Fixas ativas" value={fixedClasses} accent="border-l-blue-400" />
        <StatCard label="Flexíveis ativas" value={flexClasses} accent="border-l-purple-400" />
      </div>

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Hoje — {todayWeekday}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Aulas fixas" value={todayFixed} sub="na grade" />
        <StatCard label="Na escala hoje" value={todayDaily.length} />
        <StatCard label="Confirmadas" value={confirmed} accent="border-l-green-400" color="text-green-700" />
        <StatCard label="Pendentes" value={pending} accent="border-l-yellow-400" color="text-yellow-700" />
        <StatCard label="Canceladas" value={cancelled} accent="border-l-gray-400" color="text-gray-500" />
        <StatCard label="Online" value={online} />
        <StatCard label="Presencial" value={presencial} accent="border-l-red-400" />
        <StatCard label="Professores ativos" value={totalTeachers} />
      </div>

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Flexíveis — semana atual</p>
      <div className="grid grid-cols-2 gap-3 mb-6 max-w-sm">
        <StatCard label="Semana completa" value={flexComplete} accent="border-l-green-400" color="text-green-700" />
        <StatCard label="Aulas faltando" value={flexMissing} accent="border-l-red-400" color="text-red-700" />
      </div>

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Ações rápidas</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/daily-schedule', label: 'Escala diária', icon: <CalendarDays />, color: 'text-blue-600 bg-blue-50' },
          { href: '/flexible-calendar', label: 'Agendar flexíveis', icon: <Clock />, color: 'text-purple-600 bg-purple-50' },
          { href: '/classes', label: 'Turmas', icon: <BookOpen />, color: 'text-green-600 bg-green-50' },
          { href: '/print', label: 'Impressão', icon: <Users />, color: 'text-orange-600 bg-orange-50' },
        ].map(a => (
          <Link key={a.href} href={a.href} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className={`p-2 rounded-lg ${a.color}`}>{a.icon}</div>
            <span className="text-sm font-semibold text-gray-700">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function CalendarDays() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> }
function Clock() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function BookOpen() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> }
function Users() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
