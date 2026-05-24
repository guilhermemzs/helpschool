import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StatCard, SectionHeader } from '@/components/ui'
import { MODALITY_LABELS, CLASS_STATUS_LABELS } from '@/lib/utils'
import Link from 'next/link'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !['ADMIN','COORDINATOR'].includes(session.user.role)) redirect('/dashboard')

  const [
    classesByLevel, classesByModality, classesByStatus,
    teachersByType, teacherLoad,
    latestSchedule,
  ] = await Promise.all([
    prisma.class.groupBy({ by: ['level'],            _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.class.groupBy({ by: ['teachingModality'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } }),
    prisma.class.groupBy({ by: ['status'],           _count: { id: true } }),
    prisma.teacher.groupBy({ by: ['type'],           _count: { id: true }, where: { active: true } }),
    prisma.lesson.groupBy({
      by: ['teacherId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.schedule.findFirst({ orderBy: { weekStartDate: 'desc' } }),
  ])

  // Resolve teacher names for load stats
  const teacherIds = teacherLoad.map(t => t.teacherId).filter(Boolean) as string[]
  const teacherNames = await prisma.teacher.findMany({ where: { id: { in: teacherIds } }, select: { id: true, name: true } })
  const teacherNameMap = Object.fromEntries(teacherNames.map(t => [t.id, t.name]))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        <div className="flex gap-2">
          <Link href="/api/export?type=classes" className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
            Exportar turmas
          </Link>
          <Link href="/api/export?type=teachers" className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
            Exportar professores
          </Link>
          {latestSchedule && (
            <Link href={`/api/export?type=lessons&scheduleId=${latestSchedule.id}`} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
              Exportar escala atual
            </Link>
          )}
        </div>
      </div>

      {/* Classes by modality */}
      <SectionHeader title="Turmas por Modalidade" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {classesByModality.map(m => (
          <StatCard key={m.teachingModality} label={MODALITY_LABELS[m.teachingModality] || m.teachingModality} value={m._count.id} sub="turmas" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Classes by level */}
        <div>
          <SectionHeader title="Turmas por Nível" />
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Nível</th>
                <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Turmas</th>
              </tr></thead>
              <tbody>
                {classesByLevel.map(l => (
                  <tr key={l.level} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-semibold">{l.level}</td>
                    <td className="px-4 py-2.5 text-right font-bold">{l._count.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teacher load */}
        <div>
          <SectionHeader title="Professores com mais aulas (semana atual)" />
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Professor</th>
                <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Aulas</th>
              </tr></thead>
              <tbody>
                {teacherLoad.map(t => (
                  <tr key={t.teacherId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{t.teacherId ? teacherNameMap[t.teacherId] || 'Desconhecido' : 'Sem professor'}</td>
                    <td className="px-4 py-2.5 text-right font-bold">{t._count.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Classes by status */}
      <SectionHeader title="Turmas por Status" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {classesByStatus.map(s => (
          <StatCard key={s.status} label={CLASS_STATUS_LABELS[s.status] || s.status} value={s._count.id} />
        ))}
      </div>

      {/* Teachers by type */}
      <SectionHeader title="Professores" />
      <div className="grid grid-cols-2 gap-3 max-w-xs">
        {teachersByType.map(t => (
          <StatCard key={t.type} label={t.type === 'FIXED' ? 'Fixos' : 'Flexíveis'} value={t._count.id} />
        ))}
      </div>
    </div>
  )
}
