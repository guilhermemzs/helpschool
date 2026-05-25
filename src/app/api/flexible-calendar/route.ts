import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { timesOverlap } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const weekStart = new Date(searchParams.get('weekStart') || new Date().toISOString())
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)

  const classes = await prisma.class.findMany({
    where: { status: 'ACTIVE', classType: 'FLEXIBLE' },
    include: {
      flexibleSchedules: {
        where: { date: { gte: weekStart, lte: weekEnd } },
        select: { id: true },
      }
    },
    orderBy: { code: 'asc' },
  })

  return NextResponse.json(classes.map(c => ({
    id: c.id, code: c.code, studentNames: c.studentNames,
    lessonsPerWeek: c.lessonsPerWeek, modality: c.modality,
    schedulesThisWeek: c.flexibleSchedules.length,
  })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { classId, teacherId, date, weekday, startTime, endTime, modality, notes, weekStart } = await req.json()

  const dateObj    = new Date(date + 'T00:00:00')
  const dateEndObj = new Date(date + 'T23:59:59')

  // Conflict check
  const errors: string[] = []
  if (teacherId) {
    const teacherLessons = await prisma.dailyLesson.findMany({
      where: { date: { gte: dateObj, lte: dateEndObj }, teacherId, status: { not: 'CANCELLED' } },
      select: { startTime: true, endTime: true },
    })
    const flexLessons = await prisma.flexibleSchedule.findMany({
      where: { date: { gte: dateObj, lte: dateEndObj }, teacherId },
      select: { startTime: true, endTime: true },
    })
    const all = [...teacherLessons, ...flexLessons]
    if (all.some(l => timesOverlap(startTime, endTime, l.startTime, l.endTime)))
      errors.push('Professor já tem aula neste horário.')
  }

  if (errors.length > 0) return NextResponse.json({ conflict: true, errors }, { status: 409 })

  const schedule = await prisma.flexibleSchedule.create({
    data: {
      classId, teacherId: teacherId || null,
      date: dateObj, weekday, startTime, endTime,
      modality: modality || 'ONLINE', notes: notes || null,
      weekStart: new Date(weekStart),
    },
    include: { class: true, teacher: true },
  })

  // Also add to daily schedule
  await prisma.dailyLesson.create({
    data: {
      date: dateObj, weekday, classId,
      teacherId: teacherId || null,
      startTime, endTime, modality: modality || 'ONLINE',
      notes, isFromFixed: false, status: 'PENDING',
    },
  }).catch(() => {}) // ignore if already exists

  return NextResponse.json(schedule, { status: 201 })
}
