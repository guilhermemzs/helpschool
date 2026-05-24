import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatCard, SectionHeader, Alert } from '@/components/ui'
import { WEEKDAYS, CLASS_STATUS_LABELS, MODALITY_LABELS } from '@/lib/utils'
import { AlertTriangle, Users, BookOpen, Clock, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  const [
    totalClasses, activeClasses, pausedClasses,
    totalTeachers, fixedTeachers,
    totalFlexible, flexWithoutLesson,
    latestSchedule,
    classesByModality,
  ] = await Promise.all([
    prisma.class.count(),
    prisma.class.count({ where: { status: 'ACTIVE' } }),
    prisma.class.count({ where: { status: 'PAUSED' } }),
    prisma.teacher.count({ where: { active: true } }),
    prisma.teacher.count({ where: { active: true, type: 'FIXED' } }),
    prisma.flexibleStudent.count({ where: { status: 'ACTIVE' } }),
    prisma.flexibleStudent.count({ where: { status: 'ACTIVE', nextLesson: null } }),
    prisma.schedule.findFirst({ orderBy: { weekStartDate: 'desc' }, include: { _count: { select: { lessons: true } } } }),
    prisma.class.groupBy({ by: ['teachingModality'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
  ])

  let weekLessons: any[] = []
  let dayStats: Record<string, any> = {}
  let pendingLessons = 0
  let noTeacher = 0

  if (latestSchedule) {
    weekLessons = await prisma.lesson.findMany({
      where: { scheduleId: latestSchedule.id },
      select: { weekday: true, status: true, modality: true, teacherId: true },
    })
    pendingLessons = weekLessons.filter(l => l.status === 'PENDING').length
    noTeacher      = weekLessons.filter(l => !l.teacherId && l.status !== 'CANCELLED').length

    for (const l of weekLessons) {
      if (!dayStats[l.weekday]) dayStats[l.weekday] = { total: 0, confirmed: 0, pending: 0, online: 0, presencial: 0, domicilio: 0 }
      dayStats[l.weekday].total++
      if (l.status === 'CONFIRMED')    dayStats[l.weekday].confirmed++
      if (l.status === 'PENDING')      dayStats[l.weekday].pending++
      if (l.modality === 'ONLINE')     dayStats[l.weekday].online++
      if (l.modality === 'PRESENCIAL') dayStats[l.weekday].presencial++
      if (l.modality === 'DOMICILIO')  dayStats[l.weekday].domicilio++
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Painel de Controle</h1>
          <p className="text-sm text-gray-500 mt-0.5">Olá, {session?.user.name}. Bem-vindo ao sistema Help School.</p>
        </div>
        {latestSchedule && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            Semana ativa: {latestSchedule.name}
          </span>
        )}
      </div>

      {/* Alerts */}
      <div className="space-y-2 mb-6">
        {pendingLessons > 0 && (
          <Alert type="warning">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span><strong>{pendingLessons} aulas pendentes</strong> de confirmação esta semana.{' '}
              <Link href="/schedule" className="underline font-semibold">Ver escala</Link>
            </span>
          </Alert>
        )}
        {noTeacher > 0 && (
          <Alert type="error">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span><strong>{noTeacher} aulas sem professor</strong> — verifique a escala.{' '}
              <Link href="/schedule" className="underline font-semibold">Ver escala</Link>
            </span>
          </Alert>
        )}
        {flexWithoutLesson > 0 && (
          <Alert type="info">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span><strong>{flexWithoutLesson} alunos flexíveis</strong> sem próxima aula marcada.{' '}
              <Link href="/flexible-students" className="underline font-semibold">Ver flexíveis</Link>
            </span>
          </Alert>
        )}
      </div>

      {/* Top stats */}
      <SectionHeader title="Visão Geral" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total de Turmas" value={totalClasses} sub={`${activeClasses} ativas · ${pausedClasses} pausadas`} accent="border-l-red-500" />
        <StatCard label="Aulas na Semana" value={weekLessons.length} sub={`${pendingLessons} pendentes`} accent="border-l-yellow-400" />
        <StatCard label="Professores" value={totalTeachers} sub={`${fixedTeachers} fixos · ${totalTeachers - fixedTeachers} flexíveis`} accent="border-l-blue-400" />
        <StatCard label="Flexíveis" value={totalFlexible} sub={`${flexWithoutLesson} sem aula marcada`} accent="border-l-purple-400" />
      </div>

      {/* Modality breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {classesByModality.map(m => (
          <StatCard
            key={m.teachingModality}
            label={MODALITY_LABELS[m.teachingModality] || m.teachingModality}
            value={m._count.id}
            sub="turmas"
          />
        ))}
      </div>

      {/* Week table */}
      {latestSchedule && (
        <>
          <SectionHeader title={`Aulas por dia — ${latestSchedule.name}`}>
            <Link href="/schedule" className="text-xs font-semibold text-red-600 hover:text-red-700">
              Ver escala completa →
            </Link>
          </SectionHeader>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Dia</th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-500 uppercase">Total</th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold text-green-600 uppercase">Confirm.</th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold text-yellow-600 uppercase">Pendentes</th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold text-gray-500 uppercase">Online</th>
                  <th className="text-center px-3 py-2.5 text-xs font-bold text-red-600 uppercase">Presencial</th>
                </tr>
              </thead>
              <tbody>
                {WEEKDAYS.map(day => {
                  const d = dayStats[day]
                  return (
                    <tr key={day} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{day}</td>
                      <td className="px-3 py-2.5 text-center font-bold">{d?.total || 0}</td>
                      <td className="px-3 py-2.5 text-center text-green-700 font-semibold">{d?.confirmed || 0}</td>
                      <td className="px-3 py-2.5 text-center text-yellow-700 font-semibold">{d?.pending || 0}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{d?.online || 0}</td>
                      <td className="px-3 py-2.5 text-center text-red-600">{d?.presencial || 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Quick actions */}
      <SectionHeader title="Ações Rápidas" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/daily',             label: 'Ver escala de hoje',      icon: <Calendar className="w-5 h-5" />,    color: 'text-blue-600 bg-blue-50' },
          { href: '/print',             label: 'Gerar resumo WhatsApp',   icon: <TrendingUp className="w-5 h-5" />,  color: 'text-green-600 bg-green-50' },
          { href: '/flexible-students', label: 'Alunos sem aula',         icon: <Clock className="w-5 h-5" />,       color: 'text-yellow-600 bg-yellow-50' },
          { href: '/classes',           label: 'Cadastrar turma',         icon: <BookOpen className="w-5 h-5" />,    color: 'text-purple-600 bg-purple-50' },
        ].map(action => (
          <Link
            key={action.href} href={action.href}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition-shadow group"
          >
            <div className={`p-2 rounded-lg ${action.color}`}>{action.icon}</div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
