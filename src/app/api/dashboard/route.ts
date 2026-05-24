import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    totalClasses, activeClasses, pausedClasses,
    totalTeachers, fixedTeachers, flexibleTeachers,
    totalFlexible,
    latestSchedule,
    classesByModality,
  ] = await Promise.all([
    prisma.class.count(),
    prisma.class.count({ where: { status: 'ACTIVE' } }),
    prisma.class.count({ where: { status: 'PAUSED' } }),
    prisma.teacher.count({ where: { active: true } }),
    prisma.teacher.count({ where: { active: true, type: 'FIXED' } }),
    prisma.teacher.count({ where: { active: true, type: 'FLEXIBLE' } }),
    prisma.flexibleStudent.count({ where: { status: 'ACTIVE' } }),
    prisma.schedule.findFirst({ orderBy: { weekStartDate: 'desc' } }),
    prisma.class.groupBy({ by: ['teachingModality'], _count: { id: true } }),
  ])

  let weekStats = { total: 0, pending: 0, confirmed: 0, cancelled: 0, online: 0, presencial: 0 }
  let dayStats: Record<string, { total: number; confirmed: number; pending: number; online: number; presencial: number }> = {}

  if (latestSchedule) {
    const lessons = await prisma.lesson.findMany({
      where: { scheduleId: latestSchedule.id },
      select: { weekday: true, status: true, modality: true },
    })
    weekStats.total     = lessons.length
    weekStats.pending   = lessons.filter(l => l.status === 'PENDING').length
    weekStats.confirmed = lessons.filter(l => l.status === 'CONFIRMED').length
    weekStats.cancelled = lessons.filter(l => l.status === 'CANCELLED').length
    weekStats.online    = lessons.filter(l => l.modality === 'ONLINE').length
    weekStats.presencial= lessons.filter(l => l.modality === 'PRESENCIAL').length

    for (const l of lessons) {
      if (!dayStats[l.weekday]) dayStats[l.weekday] = { total: 0, confirmed: 0, pending: 0, online: 0, presencial: 0 }
      dayStats[l.weekday].total++
      if (l.status === 'CONFIRMED')   dayStats[l.weekday].confirmed++
      if (l.status === 'PENDING')     dayStats[l.weekday].pending++
      if (l.modality === 'ONLINE')    dayStats[l.weekday].online++
      if (l.modality === 'PRESENCIAL')dayStats[l.weekday].presencial++
    }
  }

  const flexWithoutLesson = await prisma.flexibleStudent.count({
    where: { status: 'ACTIVE', nextLesson: null }
  })

  const noTeacher = latestSchedule ? await prisma.lesson.count({
    where: { scheduleId: latestSchedule.id, teacherId: null, status: { not: 'CANCELLED' } }
  }) : 0

  return NextResponse.json({
    classes: { total: totalClasses, active: activeClasses, paused: pausedClasses },
    teachers: { total: totalTeachers, fixed: fixedTeachers, flexible: flexibleTeachers },
    flexible: { total: totalFlexible, withoutLesson: flexWithoutLesson },
    week: weekStats,
    dayStats,
    classesByModality,
    latestSchedule,
    alerts: {
      pendingLessons: weekStats.pending,
      noTeacher,
      flexWithoutLesson,
    }
  })
}
